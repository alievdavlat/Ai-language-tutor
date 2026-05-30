/**
 * Same-machine realtime provider built on the BroadcastChannel API.
 *
 * Works across browser tabs, Electron windows, and dev-preview windows on the
 * SAME machine with zero configuration — this is what lets the live pages be
 * demoed without any backend. Presence is emulated with heartbeats + reaping
 * (BroadcastChannel has no built-in presence like Supabase Realtime does).
 *
 * For real cross-device rooms the factory picks the Supabase provider instead.
 */
import type {
  BroadcastHandler,
  PeerId,
  PresenceHandler,
  PresenceMeta,
  PresencePeer,
  RealtimeChannel,
  RealtimeProvider
} from './types'

const HEARTBEAT_MS = 2000
const REAP_AFTER_MS = 6500

interface Envelope {
  v: 1
  from: PeerId
  kind: 'event' | 'presence' | 'leave' | 'whois'
  event?: string
  payload?: unknown
  meta?: PresenceMeta
  ts: number
}

function makePeerId(): PeerId {
  return `peer_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

class BroadcastRealtimeChannel implements RealtimeChannel {
  readonly peerId: PeerId = makePeerId()
  readonly roomId: string

  private bc: BroadcastChannel | null = null
  private myMeta: PresenceMeta = { name: 'Guest' }
  private peers = new Map<PeerId, PresencePeer>()
  private eventHandlers = new Map<string, Set<BroadcastHandler>>()
  private presenceHandlers = new Set<PresenceHandler>()
  private heartbeat: ReturnType<typeof setInterval> | null = null
  private reaper: ReturnType<typeof setInterval> | null = null
  private closed = false

  constructor(roomId: string) {
    this.roomId = roomId
  }

  async subscribe(initialPresence?: PresenceMeta): Promise<void> {
    if (this.bc) return
    if (initialPresence) this.myMeta = { ...this.myMeta, ...initialPresence }

    this.bc = new BroadcastChannel(`speakai.rt.${this.roomId}`)
    this.bc.onmessage = (e: MessageEvent<Envelope>) => this.handle(e.data)

    // Announce ourselves + ask everyone else to announce back.
    this.post('presence')
    this.post('whois')
    this.touchSelf()

    this.heartbeat = setInterval(() => this.post('presence'), HEARTBEAT_MS)
    this.reaper = setInterval(() => this.reap(), HEARTBEAT_MS)

    // Resolve on next tick so any already-open peers can answer the whois.
    await new Promise<void>((r) => setTimeout(r, 60))
  }

  unsubscribe(): void {
    if (this.closed) return
    this.closed = true
    if (this.bc) {
      this.post('leave')
      this.bc.onmessage = null
      this.bc.close()
      this.bc = null
    }
    if (this.heartbeat) clearInterval(this.heartbeat)
    if (this.reaper) clearInterval(this.reaper)
    this.heartbeat = this.reaper = null
    this.eventHandlers.clear()
    this.presenceHandlers.clear()
    this.peers.clear()
  }

  send(event: string, payload?: unknown): void {
    this.post('event', event, payload)
  }

  on(event: string, handler: BroadcastHandler): () => void {
    let set = this.eventHandlers.get(event)
    if (!set) {
      set = new Set()
      this.eventHandlers.set(event, set)
    }
    set.add(handler)
    return () => set?.delete(handler)
  }

  updatePresence(patch: Partial<PresenceMeta>): void {
    this.myMeta = { ...this.myMeta, ...patch }
    this.touchSelf()
    this.post('presence')
    this.emitPresence()
  }

  onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler)
    handler(this.presence())
    return () => this.presenceHandlers.delete(handler)
  }

  presence(): PresencePeer[] {
    return Array.from(this.peers.values())
  }

  // ── internals ──────────────────────────────────────────────────────────

  private post(kind: Envelope['kind'], event?: string, payload?: unknown): void {
    if (!this.bc) return
    const env: Envelope = {
      v: 1,
      from: this.peerId,
      kind,
      event,
      payload,
      meta: kind === 'presence' ? this.myMeta : undefined,
      ts: Date.now()
    }
    try {
      this.bc.postMessage(env)
    } catch {
      /* structured-clone failure — drop the message */
    }
  }

  private touchSelf(): void {
    this.peers.set(this.peerId, {
      ...this.myMeta,
      peerId: this.peerId,
      lastSeen: Date.now()
    })
  }

  private handle(env: Envelope): void {
    if (!env || env.from === this.peerId) return
    switch (env.kind) {
      case 'event':
        if (env.event) {
          const set = this.eventHandlers.get(env.event)
          if (set) for (const h of set) h(env.payload, env.from)
        }
        break
      case 'presence':
        this.peers.set(env.from, {
          ...(env.meta ?? { name: 'Guest' }),
          peerId: env.from,
          lastSeen: Date.now()
        })
        this.emitPresence()
        break
      case 'whois':
        // Someone just joined and wants the roster — answer with our presence.
        this.post('presence')
        break
      case 'leave':
        if (this.peers.delete(env.from)) this.emitPresence()
        break
    }
  }

  private reap(): void {
    const cutoff = Date.now() - REAP_AFTER_MS
    let changed = false
    for (const [id, p] of this.peers) {
      if (id === this.peerId) continue
      if ((p.lastSeen ?? 0) < cutoff) {
        this.peers.delete(id)
        changed = true
      }
    }
    this.touchSelf()
    if (changed) this.emitPresence()
  }

  private emitPresence(): void {
    const snap = this.presence()
    for (const h of this.presenceHandlers) h(snap)
  }
}

export const broadcastProvider: RealtimeProvider = {
  kind: 'broadcast',
  channel(roomId: string): RealtimeChannel {
    return new BroadcastRealtimeChannel(roomId)
  }
}
