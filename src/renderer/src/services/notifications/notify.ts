/**
 * The single entry point for raising a notification. Every producer (daily
 * reminder, broadcasts, badge unlocks, …) calls {@link notify} rather than
 * touching the backend directly, so per-type toggles, quiet hours and the two
 * delivery channels (in-app bell + OS notification centre) are honoured in one
 * place.
 */
import type { ID, Notif, NotifKind } from '@shared/types'
import { backend } from '../backend'
import { kindMeta } from './catalog'
import { isKindEnabled, inQuietHours, useNotifPrefs } from './prefs'

/** Fired whenever the current user's notifications change, so the bell refreshes instantly. */
export const NOTIF_EVENT = 'speakai:notif-changed'

function ping(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(NOTIF_EVENT))
}

export interface NotifyInput {
  userId: ID
  kind: NotifKind
  title: string
  body: string
  /** Overrides the catalog's default deep-link. */
  link?: string
  /** Skip the OS notification even when system delivery is on (e.g. silent backfill). */
  silent?: boolean
}

/**
 * Deliver a notification through every enabled channel.
 * Returns the persisted in-app row, or null if the kind is muted.
 */
export async function notify(input: NotifyInput): Promise<Notif | null> {
  const meta = kindMeta(input.kind)
  if (!meta) return null
  // Respect the per-kind toggle — a muted kind is dropped entirely.
  if (!isKindEnabled(input.kind)) return null

  const link = input.link ?? meta.defaultLink

  // 1) In-app delivery — always written when the kind is enabled (the bell is the inbox).
  let row: Notif | null = null
  try {
    row = await backend.createNotif({
      userId: input.userId,
      type: meta.category,
      kind: input.kind,
      title: input.title,
      body: input.body,
      link
    })
    ping()
  } catch {
    /* backend offline — fall through to system delivery */
  }

  // 2) System (OS) delivery — opt-in, suppressed during quiet hours.
  const { systemDelivery } = useNotifPrefs.getState()
  if (
    systemDelivery &&
    !input.silent &&
    !inQuietHours() &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  ) {
    try {
      // eslint-disable-next-line no-new
      new Notification(input.title, { body: input.body, tag: input.kind })
    } catch {
      /* OS refused */
    }
  }

  return row
}

/** Ask for OS notification permission once (no-op if already decided). */
export function ensureSystemPermission(): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'default') void Notification.requestPermission()
}
