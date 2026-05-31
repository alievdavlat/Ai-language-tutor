/**
 * Per-device notification preferences: which kinds are allowed, whether system
 * (OS) delivery is on, and quiet hours. Persisted to localStorage via zustand.
 * The {@link notify} pipeline consults this before delivering anything.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NotifKind } from '@shared/types'
import { NOTIF_KINDS } from './catalog'

export interface QuietHours {
  enabled: boolean
  /** 0–23, inclusive start hour. */
  start: number
  /** 0–23, exclusive end hour. May wrap past midnight (e.g. 22 → 7). */
  end: number
}

interface NotifPrefsState {
  /** Per-kind in-app enable map. Missing key = enabled (forward-compatible). */
  perKind: Partial<Record<NotifKind, boolean>>
  /** Mirror selected in-app notifications to the OS notification centre. */
  systemDelivery: boolean
  quietHours: QuietHours
  setKind: (kind: NotifKind, on: boolean) => void
  setAllKinds: (on: boolean) => void
  setSystemDelivery: (on: boolean) => void
  setQuietHours: (patch: Partial<QuietHours>) => void
}

const ALL_ON: Record<NotifKind, boolean> = NOTIF_KINDS.reduce(
  (acc, k) => { acc[k] = true; return acc },
  {} as Record<NotifKind, boolean>
)

export const useNotifPrefs = create<NotifPrefsState>()(
  persist(
    (set, get) => ({
      perKind: { ...ALL_ON },
      systemDelivery: true,
      quietHours: { enabled: false, start: 22, end: 7 },
      setKind: (kind, on) => set({ perKind: { ...get().perKind, [kind]: on } }),
      setAllKinds: (on) => set({ perKind: NOTIF_KINDS.reduce((a, k) => { a[k] = on; return a }, {} as Record<NotifKind, boolean>) }),
      setSystemDelivery: (on) => set({ systemDelivery: on }),
      setQuietHours: (patch) => set({ quietHours: { ...get().quietHours, ...patch } })
    }),
    { name: 'speakai.notifPrefs.v1' }
  )
)

/** A kind is enabled unless explicitly turned off. */
export function isKindEnabled(kind: NotifKind): boolean {
  return useNotifPrefs.getState().perKind[kind] !== false
}

/** Is the given moment inside the configured quiet-hours window? */
export function inQuietHours(date = new Date()): boolean {
  const { quietHours } = useNotifPrefs.getState()
  if (!quietHours.enabled) return false
  const h = date.getHours()
  const { start, end } = quietHours
  // Same-day window (e.g. 1 → 6) vs. overnight wrap (e.g. 22 → 7).
  return start <= end ? h >= start && h < end : h >= start || h < end
}
