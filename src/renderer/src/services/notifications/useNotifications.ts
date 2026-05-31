import { useCallback, useEffect, useState } from 'react'
import type { Notif } from '@shared/types'
import { backend } from '../backend'
import { NOTIF_EVENT } from './notify'

interface UseNotifications {
  items: Notif[]
  unread: number
  loading: boolean
  refresh: () => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

/**
 * Live view of the current user's notifications for the bell + page. Refreshes
 * on a slow poll and immediately whenever {@link notify} fires NOTIF_EVENT.
 */
export function useNotifications(pollMs = 60_000): UseNotifications {
  const [items, setItems] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    const me = backend.currentUserId()
    if (!me) { setItems([]); setLoading(false); return }
    setLoading(true)
    backend.listNotifs(me)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    const onChange = (): void => refresh()
    window.addEventListener(NOTIF_EVENT, onChange)
    const t = window.setInterval(refresh, pollMs)
    return () => { window.removeEventListener(NOTIF_EVENT, onChange); window.clearInterval(t) }
  }, [refresh, pollMs])

  const markRead = useCallback(async (id: string): Promise<void> => {
    // Optimistic — flip locally, then persist.
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try { await backend.markNotif(id, true) } catch { /* keep optimistic */ }
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT))
  }, [])

  const markAllRead = useCallback(async (): Promise<void> => {
    const me = backend.currentUserId()
    if (!me) return
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    try { await backend.markAllRead(me) } catch { /* keep optimistic */ }
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT))
  }, [])

  return { items, unread: items.filter((n) => !n.read).length, loading, refresh, markRead, markAllRead }
}
