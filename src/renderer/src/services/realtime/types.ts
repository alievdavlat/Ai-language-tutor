/**
 * Provider-agnostic realtime channel contract. Pages and hooks talk to a
 * `RealtimeChannel`, never directly to Supabase or BroadcastChannel — the
 * factory in `index.ts` swaps the implementation based on `realtimeConfig`.
 *
 * Two concerns, kept deliberately small so both backends can satisfy them:
 *   • broadcast  — fire-and-forget JSON events to everyone in the room.
 *   • presence   — who is here right now, with a small per-peer state blob.
 */

/** Stable per-tab/window identity for a connected peer. */
export type PeerId = string

export interface PresenceMeta {
  /** App-level user id (from the backend) when known, else the peer id. */
  userId?: string
  name: string
  /** Optional role marker used by hosts / leaderboards. */
  role?: string
  /** Free-form extras a feature wants to gossip (level, topic, score…). */
  [key: string]: unknown
}

export interface PresencePeer extends PresenceMeta {
  peerId: PeerId
  /** Epoch ms of the last heartbeat we saw (broadcast transport only). */
  lastSeen?: number
}

export type BroadcastHandler = (payload: unknown, fromPeerId: PeerId) => void
export type PresenceHandler = (peers: PresencePeer[]) => void

export interface RealtimeChannel {
  /** This peer's stable id for the lifetime of the channel. */
  readonly peerId: PeerId
  readonly roomId: string

  /** Begin receiving; resolves once subscribed (and presence is tracked). */
  subscribe(initialPresence?: PresenceMeta): Promise<void>
  /** Tear everything down — handlers, presence, transport. */
  unsubscribe(): void

  /** Send a named event to every other peer in the room. */
  send(event: string, payload?: unknown): void
  /** Listen for a named event. Returns an unsubscribe fn. */
  on(event: string, handler: BroadcastHandler): () => void

  /** Update this peer's presence blob (merged). */
  updatePresence(patch: Partial<PresenceMeta>): void
  /** Subscribe to the full presence roster. Returns an unsubscribe fn. */
  onPresence(handler: PresenceHandler): () => void
  /** Current snapshot of who is in the room (this peer included). */
  presence(): PresencePeer[]
}

export interface RealtimeProvider {
  readonly kind: 'supabase' | 'broadcast'
  /** Get (or create) a channel for a room. Each call returns a fresh handle. */
  channel(roomId: string): RealtimeChannel
}
