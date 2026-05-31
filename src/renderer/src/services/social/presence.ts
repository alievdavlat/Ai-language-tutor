/**
 * Lightweight, REAL presence — replaces the old "fake green dot on every
 * student" with one that actually means something.
 *
 * A user is "online" only if a heartbeat for them was written within
 * ONLINE_WINDOW_MS. The current viewer heartbeats on an interval (and on
 * focus / visibility) for as long as the app is open, so the dot reflects who
 * is *actually using the app right now*:
 *   • You (this window)                                  — always
 *   • Your other windows / tabs on this machine          — via the `storage` event
 *   • Other devices, when Supabase Realtime is on         — via a presence broadcast room
 *
 * Seed users who never launch the app are therefore never shown as online —
 * which is the honest result. No storage schema change, no backend edit: the
 * heartbeat map lives in localStorage under `speakai.presence.v1`.
 */
import { useEffect, useState } from 'react'
import { joinRoom, type RoomChannel } from '../backend/realtime'

/** A heartbeat older than this means the user is considered offline. */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000
/** How often the current viewer re-stamps their own heartbeat. */
const HEARTBEAT_MS = 45 * 1000
const LS_KEY = 'speakai.presence.v1'
const PRESENCE_ROOM = 'presence:global'

type HeartbeatMap = Record<string, number>

const bus = typeof window !== 'undefined' ? new EventTarget() : null

function read(): HeartbeatMap {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) ?? '{}') as HeartbeatMap
  } catch {
    return {}
  }
}

function write(map: HeartbeatMap): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode */
  }
}

/** Drop entries we no longer need so the map can't grow unbounded. */
function prune(map: HeartbeatMap, now: number): HeartbeatMap {
  const cutoff = now - ONLINE_WINDOW_MS * 4
  const out: HeartbeatMap = {}
  for (const [id, at] of Object.entries(map)) if (at >= cutoff) out[id] = at
  return out
}

/** Record a heartbeat we observed for `userId` (local or from realtime). */
function stamp(userId: string, at: number): void {
  const map = read()
  // Ignore stale or out-of-order beats.
  if ((map[userId] ?? 0) >= at) return
  map[userId] = at
  write(prune(map, at))
  bus?.dispatchEvent(new CustomEvent('change'))
}

/** Is `userId` online right now? */
export function isOnline(userId: string | null | undefined, map: HeartbeatMap = read(), now = Date.now()): boolean {
  if (!userId) return false
  return now - (map[userId] ?? 0) <= ONLINE_WINDOW_MS
}

/** Snapshot of every currently-online user id. */
export function onlineIds(now = Date.now()): string[] {
  const map = read()
  return Object.keys(map).filter((id) => now - map[id] <= ONLINE_WINDOW_MS)
}

/**
 * Begin heartbeating the current viewer. Call once, globally, while signed in.
 * Returns a cleanup that stops the heartbeat + leaves the realtime room.
 */
export function startPresence(userId: string): () => void {
  if (typeof window === 'undefined' || !userId) return () => undefined

  let room: RoomChannel | null = null
  const beat = (): void => {
    const now = Date.now()
    stamp(userId, now)
    room?.send('hb', { userId, at: now })
  }

  // Cross-device fan-out (real only when Supabase Realtime is configured; the
  // local fallback is same-tab, which the storage path already covers).
  try {
    room = joinRoom(PRESENCE_ROOM, { userId })
    room.on('hb', (payload) => {
      const p = payload as { userId?: string; at?: number }
      if (p?.userId && p.userId !== userId) stamp(p.userId, typeof p.at === 'number' ? p.at : Date.now())
    })
  } catch {
    room = null
  }

  beat()
  const interval = window.setInterval(beat, HEARTBEAT_MS)
  const onFocus = (): void => beat()
  const onVisible = (): void => { if (document.visibilityState === 'visible') beat() }
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    window.clearInterval(interval)
    window.removeEventListener('focus', onFocus)
    document.removeEventListener('visibilitychange', onVisible)
    room?.unsubscribe()
  }
}

/** Subscribe to presence changes (storage from other tabs + local beats). */
export function subscribePresence(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (e: StorageEvent): void => { if (e.key === LS_KEY) cb() }
  const onLocal = (): void => cb()
  window.addEventListener('storage', onStorage)
  bus?.addEventListener('change', onLocal)
  // A slow tick re-evaluates the time window so dots expire even with no events.
  const tick = window.setInterval(cb, 30 * 1000)
  return () => {
    window.removeEventListener('storage', onStorage)
    bus?.removeEventListener('change', onLocal)
    window.clearInterval(tick)
  }
}

/**
 * React presence reader. Re-renders when anyone's online status changes.
 * Returns a stable `online(userId)` predicate + the current online id set.
 */
export function usePresence(): { online: (userId: string | null | undefined) => boolean; onlineIds: string[] } {
  const [, setRev] = useState(0)
  useEffect(() => subscribePresence(() => setRev((r) => r + 1)), [])
  const now = Date.now()
  const map = read()
  return {
    online: (userId) => isOnline(userId, map, now),
    onlineIds: Object.keys(map).filter((id) => now - map[id] <= ONLINE_WINDOW_MS)
  }
}
