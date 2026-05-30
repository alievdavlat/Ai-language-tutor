/**
 * WebRTC mesh over a RealtimeChannel.
 *
 * Each pair of peers gets one RTCPeerConnection. Signaling (offer/answer/ICE)
 * rides the realtime channel's broadcast bus, addressed by peer id. Uses the
 * standard "perfect negotiation" pattern (polite/impolite by peer-id order) so
 * simultaneous offers don't deadlock.
 *
 * A full mesh is O(n²) connections — perfect for 1:1 (Meet) and small group
 * rooms (3–4 co-hosts, #27). For large audiences (#16 at scale) swap in a
 * LiveKit SFU; see config.ts / docs/REALTIME.md.
 */
import { realtimeConfig } from './config'
import type { PeerId, RealtimeChannel } from './types'

interface SignalOffer { to: PeerId; description: RTCSessionDescriptionInit }
interface SignalIce { to: PeerId; candidate: RTCIceCandidateInit }

export interface MeshEvents {
  /** A remote peer's media stream became available (or updated). */
  onStream?: (peerId: PeerId, stream: MediaStream) => void
  /** Connection state for a peer changed. */
  onState?: (peerId: PeerId, state: RTCPeerConnectionState) => void
  /** A peer connection was torn down. */
  onClose?: (peerId: PeerId) => void
}

interface PeerEntry {
  pc: RTCPeerConnection
  polite: boolean
  makingOffer: boolean
  ignoreOffer: boolean
  remoteStream: MediaStream
}

export class WebRTCMesh {
  private channel: RealtimeChannel
  private events: MeshEvents
  private localStream: MediaStream | null = null
  private peers = new Map<PeerId, PeerEntry>()
  private offSignals: Array<() => void> = []
  private closed = false

  constructor(channel: RealtimeChannel, events: MeshEvents = {}) {
    this.channel = channel
    this.events = events
    this.offSignals.push(channel.on('rtc-offer', (p, from) => this.onOffer(p as SignalOffer, from)))
    this.offSignals.push(channel.on('rtc-answer', (p, from) => this.onAnswer(p as SignalOffer, from)))
    this.offSignals.push(channel.on('rtc-ice', (p, from) => this.onIce(p as SignalIce, from)))
    // When a peer leaves the room, drop its connection.
    this.offSignals.push(channel.on('rtc-bye', (_p, from) => this.drop(from)))
  }

  /** Set / replace the local media stream across all peer connections. */
  async setLocalStream(stream: MediaStream | null): Promise<void> {
    this.localStream = stream
    for (const [, entry] of this.peers) {
      this.applyLocalTracks(entry.pc)
    }
  }

  /**
   * Reconcile the connected set against the room roster. Connects to peers we
   * don't have yet and tears down peers that left. Skips our own id.
   */
  syncPeers(peerIds: PeerId[]): void {
    if (this.closed) return
    const wanted = new Set(peerIds.filter((id) => id !== this.channel.peerId))
    for (const id of wanted) {
      if (!this.peers.has(id)) this.ensurePeer(id)
    }
    for (const id of Array.from(this.peers.keys())) {
      if (!wanted.has(id)) this.drop(id)
    }
  }

  /** Tear down everything. */
  close(): void {
    this.closed = true
    this.channel.send('rtc-bye', {})
    for (const id of Array.from(this.peers.keys())) this.drop(id, true)
    for (const off of this.offSignals) off()
    this.offSignals = []
  }

  // ── internals ──────────────────────────────────────────────────────────

  private ensurePeer(peerId: PeerId): PeerEntry {
    const existing = this.peers.get(peerId)
    if (existing) return existing

    const pc = new RTCPeerConnection({ iceServers: realtimeConfig.iceServers })
    // Impolite peer is the one with the lexicographically smaller id — it wins
    // glare and is the natural first offerer.
    const polite = this.channel.peerId > peerId
    const entry: PeerEntry = {
      pc,
      polite,
      makingOffer: false,
      ignoreOffer: false,
      remoteStream: new MediaStream()
    }
    this.peers.set(peerId, entry)

    this.applyLocalTracks(pc)

    pc.onnegotiationneeded = async () => {
      try {
        entry.makingOffer = true
        await pc.setLocalDescription()
        if (pc.localDescription) {
          this.channel.send('rtc-offer', { to: peerId, description: pc.localDescription.toJSON() })
        }
      } catch {
        /* negotiation race — perfect-negotiation will recover */
      } finally {
        entry.makingOffer = false
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.channel.send('rtc-ice', { to: peerId, candidate: candidate.toJSON() })
    }

    pc.ontrack = ({ track, streams }) => {
      const stream = streams[0] ?? entry.remoteStream
      if (!streams[0]) entry.remoteStream.addTrack(track)
      this.events.onStream?.(peerId, stream)
    }

    pc.onconnectionstatechange = () => {
      this.events.onState?.(peerId, pc.connectionState)
      if (pc.connectionState === 'failed') {
        try { pc.restartIce() } catch { /* not supported */ }
      }
    }

    return entry
  }

  private applyLocalTracks(pc: RTCPeerConnection): void {
    if (!this.localStream) return
    const senders = pc.getSenders()
    for (const track of this.localStream.getTracks()) {
      const sender = senders.find((s) => s.track?.kind === track.kind)
      if (sender) void sender.replaceTrack(track)
      else pc.addTrack(track, this.localStream)
    }
  }

  private async onOffer(sig: SignalOffer, from: PeerId): Promise<void> {
    if (sig.to !== this.channel.peerId) return
    const entry = this.ensurePeer(from)
    const { pc } = entry
    const collision =
      sig.description.type === 'offer' && (entry.makingOffer || pc.signalingState !== 'stable')
    entry.ignoreOffer = !entry.polite && collision
    if (entry.ignoreOffer) return
    try {
      await pc.setRemoteDescription(sig.description)
      await pc.setLocalDescription()
      if (pc.localDescription) {
        this.channel.send('rtc-answer', { to: from, description: pc.localDescription.toJSON() })
      }
    } catch {
      /* drop bad SDP */
    }
  }

  private async onAnswer(sig: SignalOffer, from: PeerId): Promise<void> {
    if (sig.to !== this.channel.peerId) return
    const entry = this.peers.get(from)
    if (!entry) return
    try {
      await entry.pc.setRemoteDescription(sig.description)
    } catch {
      /* stale answer */
    }
  }

  private async onIce(sig: SignalIce, from: PeerId): Promise<void> {
    if (sig.to !== this.channel.peerId) return
    const entry = this.peers.get(from)
    if (!entry) return
    try {
      await entry.pc.addIceCandidate(sig.candidate)
    } catch {
      if (!entry.ignoreOffer) {
        /* candidate could not be added — non-fatal */
      }
    }
  }

  private drop(peerId: PeerId, silent = false): void {
    const entry = this.peers.get(peerId)
    if (!entry) return
    try {
      entry.pc.onnegotiationneeded = null
      entry.pc.onicecandidate = null
      entry.pc.ontrack = null
      entry.pc.onconnectionstatechange = null
      entry.pc.close()
    } catch {
      /* already closed */
    }
    this.peers.delete(peerId)
    if (!silent) this.events.onClose?.(peerId)
  }
}

/** Acquire local camera + mic. Returns null + reason on failure. */
export async function getLocalMedia(
  opts: { video?: boolean; audio?: boolean } = { video: true, audio: true }
): Promise<{ stream: MediaStream | null; error: string | null }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { stream: null, error: 'Camera/microphone API not available in this environment.' }
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: opts.video ?? true,
      audio: opts.audio ?? true
    })
    return { stream, error: null }
  } catch (err) {
    const name = (err as DOMException)?.name
    const msg =
      name === 'NotAllowedError'
        ? 'Camera/microphone permission was denied.'
        : name === 'NotFoundError'
          ? 'No camera or microphone found on this device.'
          : 'Could not start camera/microphone.'
    return { stream: null, error: msg }
  }
}
