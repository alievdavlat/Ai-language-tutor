import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { openChannel } from '../../services/realtime'
import type { PresenceMeta, PresencePeer, RealtimeChannel } from '../../services/realtime'
import { WebRTCMesh, getLocalMedia } from '../../services/realtime/webrtc'

export interface UseMediaRoom {
  channel: RealtimeChannel | null
  peers: PresencePeer[]
  peerId: string | null
  ready: boolean
  /** This peer's local camera/mic stream (null until acquired / if viewer). */
  localStream: MediaStream | null
  /** Remote peers' streams keyed by peer id. */
  remoteStreams: Record<string, MediaStream>
  /** Human-readable media error (permission denied, no device…). */
  mediaError: string | null
  micOn: boolean
  camOn: boolean
  toggleMic: () => void
  toggleCam: () => void
  send: (event: string, payload?: unknown) => void
  updatePresence: (patch: Partial<PresenceMeta>) => void
}

export interface MediaRoomOptions {
  presence?: PresenceMeta
  /** Publish local camera/mic into the mesh (host / participant). Viewers pass false. */
  publish?: boolean
  video?: boolean
  audio?: boolean
  enabled?: boolean
}

/**
 * A realtime room with a WebRTC media mesh layered on top of the signaling
 * channel. Handles presence → peer reconciliation, local media acquisition,
 * and exposes the remote streams + mic/cam controls. One channel serves
 * presence, app events (chat, etc.) AND WebRTC signaling.
 */
export function useMediaRoom(roomId: string | null, options: MediaRoomOptions = {}): UseMediaRoom {
  const { presence, publish = true, video = true, audio = true } = options
  const enabled = options.enabled !== false && !!roomId

  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [peers, setPeers] = useState<PresencePeer[]>([])
  const [ready, setReady] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(audio)
  const [camOn, setCamOn] = useState(video)

  const meshRef = useRef<WebRTCMesh | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const presenceRef = useRef(presence)
  presenceRef.current = presence

  // ── Channel + mesh + media lifecycle ─────────────────────────────────────
  useEffect(() => {
    if (!enabled || !roomId) return
    const ch = openChannel(roomId)
    let active = true
    let localRef: MediaStream | null = null

    const mesh = new WebRTCMesh(ch, {
      onStream: (pid, stream) => {
        if (active) setRemoteStreams((prev) => ({ ...prev, [pid]: stream }))
      },
      onClose: (pid) => {
        if (active)
          setRemoteStreams((prev) => {
            const next = { ...prev }
            delete next[pid]
            return next
          })
      }
    })
    meshRef.current = mesh

    const offPresence = ch.onPresence((p) => {
      if (!active) return
      setPeers(p)
      mesh.syncPeers(p.map((peer) => peer.peerId))
    })

    void (async () => {
      await ch.subscribe(presenceRef.current)
      if (!active) return
      if (publish) {
        const { stream, error } = await getLocalMedia({ video, audio })
        if (!active) {
          stream?.getTracks().forEach((t) => t.stop())
          return
        }
        if (stream) {
          localRef = stream
          localStreamRef.current = stream
          setLocalStream(stream)
          await mesh.setLocalStream(stream)
        }
        if (error) setMediaError(error)
      }
      setChannel(ch)
      setReady(true)
      // Connect to whoever is already here.
      mesh.syncPeers(ch.presence().map((peer) => peer.peerId))
    })()

    return () => {
      active = false
      offPresence()
      mesh.close()
      meshRef.current = null
      ch.unsubscribe()
      localRef?.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
      setChannel(null)
      setReady(false)
      setPeers([])
      setRemoteStreams({})
      setLocalStream(null)
    }
  }, [roomId, enabled, publish, video, audio])

  const toggleMic = useCallback(() => {
    const s = localStreamRef.current
    if (!s) return
    const on = !s.getAudioTracks().every((t) => t.enabled)
    s.getAudioTracks().forEach((t) => (t.enabled = on))
    setMicOn(on)
  }, [])

  const toggleCam = useCallback(() => {
    const s = localStreamRef.current
    if (!s) return
    const on = !s.getVideoTracks().every((t) => t.enabled)
    s.getVideoTracks().forEach((t) => (t.enabled = on))
    setCamOn(on)
  }, [])

  const send = useCallback(
    (event: string, payload?: unknown) => channel?.send(event, payload),
    [channel]
  )
  const updatePresence = useCallback(
    (patch: Partial<PresenceMeta>) => channel?.updatePresence(patch),
    [channel]
  )

  return useMemo(
    () => ({
      channel,
      peers,
      peerId: channel?.peerId ?? null,
      ready,
      localStream,
      remoteStreams,
      mediaError,
      micOn,
      camOn,
      toggleMic,
      toggleCam,
      send,
      updatePresence
    }),
    [channel, peers, ready, localStream, remoteStreams, mediaError, micOn, camOn, toggleMic, toggleCam, send, updatePresence]
  )
}
