/**
 * Cross-device realtime provider backed by Supabase Realtime channels
 * (broadcast + presence). Selected by the factory when VITE_USE_SUPABASE=1 and
 * the URL + anon key are present — the same flags the data backend uses.
 *
 * All app events ride a single broadcast event name ('msg') carrying the
 * caller's event name + payload + sender peer id, so arbitrary event names work
 * without re-subscribing. Presence uses the peer id as the tracking key.
 *
 * Note: Supabase project must have Realtime enabled (it is by default). No DB
 * tables are required — broadcast + presence are ephemeral.
 */
import {
  createClient,
  type RealtimeChannel as SbChannel,
  type SupabaseClient
} from '@supabase/supabase-js'
import type {
  BroadcastHandler,
  PeerId,
  PresenceHandler,
  PresenceMeta,
  PresencePeer,
  RealtimeChannel,
  RealtimeProvider
} from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let _client: SupabaseClient | null = null
function client(): SupabaseClient {
  if (!_client) {
    if (!url || !key) throw new Error('[realtime] Supabase URL / anon key missing')
    _client = createClient(url, key, { realtime: { params: { eventsPerSecond: 20 } } })
  }
  return _client
}

function makePeerId(): PeerId {
  return `peer_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

interface MsgPayload {
  event: string
  payload: unknown
  from: PeerId
}

class SupabaseRealtimeChannel implements RealtimeChannel {
  readonly peerId: PeerId = makePeerId()
  readonly roomId: string

  private ch: SbChannel | null = null
  private myMeta: PresenceMeta = { name: 'Guest' }
  private eventHandlers = new Map<string, Set<BroadcastHandler>>()
  private presenceHandlers = new Set<PresenceHandler>()
  private roster: PresencePeer[] = []

  constructor(roomId: string) {
    this.roomId = roomId
  }

  async subscribe(initialPresence?: PresenceMeta): Promise<void> {
    if (this.ch) return
    if (initialPresence) this.myMeta = { ...this.myMeta, ...initialPresence }

    const ch = client().channel(`speakai:rt:${this.roomId}`, {
      config: { presence: { key: this.peerId }, broadcast: { self: false } }
    })

    ch.on('broadcast', { event: 'msg' }, (msg: { payload: MsgPayload }) => {
      const m = msg.payload
      if (!m || m.from === this.peerId) return
      const set = this.eventHandlers.get(m.event)
      if (set) for (const h of set) h(m.payload, m.from)
    })

    ch.on('presence', { event: 'sync' }, () => this.syncPresence())
    ch.on('presence', { event: 'join' }, () => this.syncPresence())
    ch.on('presence', { event: 'leave' }, () => this.syncPresence())

    this.ch = ch

    await new Promise<void>((resolve) => {
      ch.subscribe(async (status) => {
        if (String(status) === 'SUBSCRIBED') {
          await ch.track({ ...this.myMeta, peerId: this.peerId })
          this.syncPresence()
          resolve()
        }
      })
      // Don't hang forever if Realtime is unreachable.
      setTimeout(resolve, 4000)
    })
  }

  unsubscribe(): void {
    if (this.ch) {
      void this.ch.untrack().catch(() => undefined)
      void client().removeChannel(this.ch).catch(() => undefined)
      this.ch = null
    }
    this.eventHandlers.clear()
    this.presenceHandlers.clear()
    this.roster = []
  }

  send(event: string, payload?: unknown): void {
    if (!this.ch) return
    const body: MsgPayload = { event, payload, from: this.peerId }
    void this.ch.send({ type: 'broadcast', event: 'msg', payload: body })
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
    if (this.ch) void this.ch.track({ ...this.myMeta, peerId: this.peerId })
  }

  onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler)
    handler(this.roster)
    return () => this.presenceHandlers.delete(handler)
  }

  presence(): PresencePeer[] {
    return this.roster
  }

  private syncPresence(): void {
    if (!this.ch) return
    const state = this.ch.presenceState() as unknown as Record<string, Array<Record<string, unknown>>>
    const peers: PresencePeer[] = []
    for (const key of Object.keys(state)) {
      const metas = state[key]
      const meta = (metas?.[metas.length - 1] ?? {}) as Partial<PresenceMeta>
      peers.push({ name: 'Guest', ...meta, peerId: key })
    }
    this.roster = peers
    for (const h of this.presenceHandlers) h(peers)
  }
}

export const supabaseRealtimeProvider: RealtimeProvider = {
  kind: 'supabase',
  channel(roomId: string): RealtimeChannel {
    return new SupabaseRealtimeChannel(roomId)
  }
}
