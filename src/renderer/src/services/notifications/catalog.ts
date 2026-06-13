import type { Notif, NotifCategory, NotifKind } from '@shared/types'
import {
  IconBell,
  IconBolt,
  IconChat,
  IconClipboard,
  IconFlame,
  IconLive,
  IconMedal,
  IconStar,
  IconTarget,
  IconTrophy,
  IconUsers,
  IconBook,
  IconBookmark,
  type IconProps
} from '../../components/icons'

/** Settings groups the per-kind toggles under these headings. */
export type NotifGroup = 'learning' | 'social' | 'system'

export interface NotifKindMeta {
  kind: NotifKind
  /** Human label shown in Settings + as a fallback. */
  label: string
  /** Broad bucket — drives the filter tabs + the DB `type` column. */
  category: NotifCategory
  /** Toggle group in Settings → Notifications. */
  group: NotifGroup
  Icon: (p: IconProps) => JSX.Element
  /** Tailwind classes for the round icon chip. */
  tint: string
  /** Where a notification of this kind deep-links by default. */
  defaultLink: string
  /** One-line explanation shown under the toggle. */
  hint: string
}

/**
 * The single source of truth for the notification catalog. Order here is the
 * order shown in Settings. Each kind maps to exactly one category so the
 * existing 3-way filter + DB constraint keep working.
 */
export const NOTIF_CATALOG: Record<NotifKind, NotifKindMeta> = {
  reminder: {
    kind: 'reminder', label: 'Daily reminder', category: 'learning', group: 'learning',
    Icon: IconBell, tint: 'bg-brand-500/15 text-brand-300', defaultLink: '/progress',
    hint: 'A nudge to practice when you have not met your daily goal.'
  },
  'streak-at-risk': {
    kind: 'streak-at-risk', label: 'Streak at risk', category: 'learning', group: 'learning',
    Icon: IconFlame, tint: 'bg-orange-500/15 text-orange-300', defaultLink: '/progress',
    hint: 'When your streak is about to break later today.'
  },
  goal: {
    kind: 'goal', label: 'Goal reached', category: 'learning', group: 'learning',
    Icon: IconTarget, tint: 'bg-emerald-500/15 text-emerald-300', defaultLink: '/progress',
    hint: 'You hit your daily goal.'
  },
  badge: {
    kind: 'badge', label: 'Badge unlocked', category: 'learning', group: 'learning',
    Icon: IconMedal, tint: 'bg-amber-500/15 text-amber-300', defaultLink: '/achievements',
    hint: 'A new badge is yours.'
  },
  milestone: {
    kind: 'milestone', label: 'Milestone', category: 'learning', group: 'learning',
    Icon: IconTrophy, tint: 'bg-yellow-500/15 text-yellow-300', defaultLink: '/progress',
    hint: 'Level-ups and big totals (words learned, hours practised).'
  },
  quest: {
    kind: 'quest', label: 'Quest', category: 'learning', group: 'learning',
    Icon: IconBolt, tint: 'bg-brand-500/15 text-brand-300', defaultLink: '/quests',
    hint: 'New or completed daily quests.'
  },
  'vocab-due': {
    kind: 'vocab-due', label: 'Words due for review', category: 'learning', group: 'learning',
    Icon: IconBookmark, tint: 'bg-sky-500/15 text-sky-300', defaultLink: '/vocabulary',
    hint: 'Spaced-repetition cards waiting in your review queue.'
  },
  announcement: {
    kind: 'announcement', label: 'Announcements', category: 'system', group: 'system',
    Icon: IconStar, tint: 'bg-amber-500/15 text-amber-300', defaultLink: '/home',
    hint: 'Broadcasts from teachers and the team.'
  },
  'new-course': {
    kind: 'new-course', label: 'New course', category: 'learning', group: 'learning',
    Icon: IconBook, tint: 'bg-violet-500/15 text-violet-300', defaultLink: '/courses',
    hint: 'A course you might like just launched.'
  },
  live: {
    kind: 'live', label: 'Live now', category: 'social', group: 'social',
    Icon: IconLive, tint: 'bg-rose-500/15 text-rose-300', defaultLink: '/community',
    hint: 'A room or stream you follow just went live.'
  },
  dm: {
    kind: 'dm', label: 'Direct messages', category: 'social', group: 'social',
    Icon: IconChat, tint: 'bg-sky-500/15 text-sky-300', defaultLink: '/inbox',
    hint: 'New messages in your inbox.'
  },
  'comment-reply': {
    kind: 'comment-reply', label: 'Replies', category: 'social', group: 'social',
    Icon: IconChat, tint: 'bg-indigo-500/15 text-indigo-300', defaultLink: '/community',
    hint: 'Someone replied to your comment or post.'
  },
  'peer-review': {
    kind: 'peer-review', label: 'Peer review', category: 'social', group: 'social',
    Icon: IconUsers, tint: 'bg-teal-500/15 text-teal-300', defaultLink: '/feedback',
    hint: 'Feedback on your writing or speaking submissions.'
  },
  certificate: {
    kind: 'certificate', label: 'Certificate', category: 'learning', group: 'learning',
    Icon: IconTrophy, tint: 'bg-amber-500/15 text-amber-300', defaultLink: '/profile',
    hint: 'You earned a course or exam certificate.'
  },
  challenge: {
    kind: 'challenge', label: 'Challenge', category: 'social', group: 'social',
    Icon: IconTrophy, tint: 'bg-amber-500/15 text-amber-300', defaultLink: '/community',
    hint: 'Progress and completion of community challenges you joined.'
  }
}

export const NOTIF_KINDS: NotifKind[] = Object.keys(NOTIF_CATALOG) as NotifKind[]

/** Fallback meta per broad category, for legacy rows that carry no `kind`. */
const CATEGORY_FALLBACK: Record<NotifCategory, NotifKindMeta> = {
  social: NOTIF_CATALOG.dm,
  learning: NOTIF_CATALOG.reminder,
  system: NOTIF_CATALOG.announcement
}

/** Resolve the catalog entry for a notification (kind if present, else inferred). */
export function notifMeta(n: Pick<Notif, 'type' | 'kind'>): NotifKindMeta {
  if (n.kind && NOTIF_CATALOG[n.kind]) return NOTIF_CATALOG[n.kind]
  return CATEGORY_FALLBACK[n.type] ?? CATEGORY_FALLBACK.system
}

export function kindMeta(kind: NotifKind): NotifKindMeta {
  return NOTIF_CATALOG[kind]
}
