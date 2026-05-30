import { useCallback, useEffect, useRef, useState } from 'react'
import { openChannel } from '../../services/realtime'
import type { PresenceMeta, PresencePeer, RealtimeChannel } from '../../services/realtime'

export interface UseRealtimeRoom {
  /** Live channel once subscribed (null until ready). Attach `.on()` in an
   *  effect keyed on this so handlers wire up exactly when it's available. */
  channel: RealtimeChannel | null
  /** Full presence roster (this peer included). */
  peers: PresencePeer[]
  /** This peer's id (stable for the room's lifetime). */
  peerId: string | null
  ready: boolean
  send: (event: string, payload?: unknown) => void
  updatePresence: (patch: Partial<PresenceMeta>) => void
}

/**
 * Subscribe to a realtime room: maintains the presence roster as React state
 * and hands back the channel for event wiring. Tears down on unmount / room
 * change. `enabled=false` keeps the hook inert (e.g. before a PIN is entered).
 */
export function useRealtimeRoom(
  roomId: string | null,
  presence?: PresenceMeta,
  opts?: { enabled?: boolean }
): UseRealtimeRoom {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [peers, setPeers] = useState<PresencePeer[]>([])
  const [ready, setReady] = useState(false)
  const presenceRef = useRef(presence)
  presenceRef.current = presence

  const enabled = opts?.enabled !== false && !!roomId

  useEffect(() => {
    if (!enabled || !roomId) return
    const ch = openChannel(roomId)
    let active = true
    const offPresence = ch.onPresence((p) => {
      if (active) setPeers(p)
    })
    void ch.subscribe(presenceRef.current).then(() => {
      if (!active) return
      setChannel(ch)
      setReady(true)
    })
    return () => {
      active = false
      offPresence()
      ch.unsubscribe()
      setChannel(null)
      setReady(false)
      setPeers([])
    }
    // presence is read via ref so a changing object doesn't re-subscribe.
  }, [roomId, enabled])

  const send = useCallback(
    (event: string, payload?: unknown) => channel?.send(event, payload),
    [channel]
  )
  const updatePresence = useCallback(
    (patch: Partial<PresenceMeta>) => channel?.updatePresence(patch),
    [channel]
  )

  return { channel, peers, peerId: channel?.peerId ?? null, ready, send, updatePresence }
}
