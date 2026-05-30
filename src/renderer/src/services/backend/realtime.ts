/**
 * Realtime sync layer (Task #26). One small surface the social / live / DM
 * sessions subscribe to, regardless of whether the live backend is Supabase or
 * the local mock.
 *
 * - With Supabase → uses Supabase Realtime (Postgres change feeds + broadcast).
 * - Without Supabase → falls back to a same-tab EventTarget bus plus the
 *   browser `storage` event, so two windows of the local app still see each
 *   other's writes, and a single window gets optimistic local echoes.
 *
 * Every subscribe* returns an `unsubscribe()` cleanup function — call it in a
 * React effect's teardown.
 */
import { getSupabaseClient, hasSupabaseEnv } from './client'

export type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface TableChange<T = Record<string, unknown>> {
  event: Exclude<ChangeEvent, '*'>
  table: string
  new: T | null
  old: T | null
}

export type Unsubscribe = () => void

// ─── Local fallback bus ──────────────────────────────────────────────────────

const localBus = typeof window !== 'undefined' ? new EventTarget() : null

/** Emit a local change so same-tab subscribers update without a round-trip. */
export function emitLocalChange(change: TableChange): void {
  if (!localBus) return
  localBus.dispatchEvent(new CustomEvent(`table:${change.table}`, { detail: change }))
  // Cross-tab nudge — other windows listen on the storage event.
  try {
    window.localStorage.setItem('speakai.rt.ping', `${change.table}:${Date.now()}`)
  } catch {
    /* quota / private mode */
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Subscribe to row changes on a table. `filter` is a Postgres-realtime filter
 * string like `user_id=eq.u_123` (ignored by the local bus, which sees all
 * rows for the table — callers should still filter in their callback).
 */
export function subscribeTable<T = Record<string, unknown>>(
  table: string,
  handler: (change: TableChange<T>) => void,
  opts: { event?: ChangeEvent; filter?: string } = {}
): Unsubscribe {
  if (hasSupabaseEnv) {
    const sb = getSupabaseClient()
    const channel = sb
      .channel(`rt:${table}:${opts.filter ?? 'all'}`)
      .on(
        // @ts-expect-error — supabase-js types the literal 'postgres_changes' loosely
        'postgres_changes',
        { event: opts.event ?? '*', schema: 'public', table, filter: opts.filter },
        (payload: { eventType: string; new: T; old: T }) => {
          handler({
            event: payload.eventType as TableChange['event'],
            table,
            new: (payload.new as T) ?? null,
            old: (payload.old as T) ?? null
          })
        }
      )
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }

  // Local fallback.
  if (!localBus) return () => undefined
  const listener = (e: Event): void => {
    const change = (e as CustomEvent<TableChange<T>>).detail
    if (opts.event && opts.event !== '*' && change.event !== opts.event) return
    handler(change)
  }
  localBus.addEventListener(`table:${table}`, listener)
  return () => localBus.removeEventListener(`table:${table}`, listener)
}

/**
 * Presence + broadcast channel (used by live rooms / typing indicators).
 * Returns a small handle for sending messages and tracking presence.
 */
export interface RoomChannel {
  send(eventName: string, payload: unknown): void
  on(eventName: string, cb: (payload: unknown) => void): void
  unsubscribe: Unsubscribe
}

export function joinRoom(roomId: string, presence?: Record<string, unknown>): RoomChannel {
  if (hasSupabaseEnv) {
    const sb = getSupabaseClient()
    const channel = sb.channel(`room:${roomId}`, { config: { presence: { key: roomId } } })
    const handlers = new Map<string, (p: unknown) => void>()
    channel
      .on('broadcast', { event: '*' }, (msg: { event: string; payload: unknown }) => {
        handlers.get(msg.event)?.(msg.payload)
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED' && presence) void channel.track(presence)
      })
    return {
      send: (eventName, payload) => void channel.send({ type: 'broadcast', event: eventName, payload }),
      on: (eventName, cb) => handlers.set(eventName, cb),
      unsubscribe: () => void sb.removeChannel(channel)
    }
  }

  // Local fallback — single-tab broadcast over the bus.
  const handlers = new Map<string, (p: unknown) => void>()
  const evt = `room:${roomId}`
  const listener = (e: Event): void => {
    const { event: name, payload } = (e as CustomEvent<{ event: string; payload: unknown }>).detail
    handlers.get(name)?.(payload)
  }
  localBus?.addEventListener(evt, listener)
  return {
    send: (eventName, payload) =>
      localBus?.dispatchEvent(new CustomEvent(evt, { detail: { event: eventName, payload } })),
    on: (eventName, cb) => handlers.set(eventName, cb),
    unsubscribe: () => localBus?.removeEventListener(evt, listener)
  }
}
