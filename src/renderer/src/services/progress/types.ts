/**
 * Progress / activity domain model. This is the single source of truth that
 * every gamification, progress, retention and study-buddy surface reads from.
 *
 * Until the cloud backend lands, the store (store.ts) persists to localStorage
 * (`speakai.progress.v1`). The shapes here are deliberately serialisable so the
 * swap to a Supabase-backed table set is mechanical — every action maps to an
 * insert (`events`) or an upsert (the small preference/claim maps).
 */

/** The four skill buckets the mastery crowns + radar are computed over. */
export type SkillKey = 'speaking' | 'listening' | 'grammar' | 'vocabulary'

/** What kind of learning moment produced an event. */
export type ActivityKind =
  | 'speaking_exchange' // one user↔AI turn in Speaking / Call / AI tutor
  | 'correction' // a grammar correction the user received
  | 'word_learned' // saved / reviewed-known vocabulary item(s)
  | 'flashcard_round' // finished a flashcard round
  | 'lesson_complete' // finished an exercise / lesson
  | 'level_test' // completed a CEFR level test
  | 'pronunciation' // pronunciation drill
  | 'listening' // watched / shadowed audio-video content
  | 'quest_reward' // XP granted by claiming a quest
  | 'milestone_reward' // XP granted by a streak-society milestone
  | 'session' // generic study session (catch-all)

/**
 * One immutable thing the learner did. Append-only — stats are always derived
 * by folding the full event log, never by mutating a counter, so the numbers
 * can never drift out of sync with the underlying activity.
 */
export interface ActivityEvent {
  id: string
  kind: ActivityKind
  /** ISO timestamp. */
  at: string
  /** XP this event awarded. */
  xp: number
  /** Which skill it strengthened, when meaningful. */
  skill?: SkillKey
  /** How many units (words, corrections…) — defaults to 1 when folding counts. */
  count?: number
  /** 0–100 quality score for lessons / flashcard rounds — feeds mastery. */
  accuracy?: number
  /** Free-form extra context (topic, deck name, level result…). */
  meta?: Record<string, unknown>
}

/** Daily-goal intensity, Duolingo-style. */
export type DailyGoalId = 'casual' | 'regular' | 'serious' | 'intense'

export interface DailyGoalDef {
  id: DailyGoalId
  label: string
  /** Daily XP target. */
  xp: number
  /** Rough minutes equivalent, shown in copy. */
  minutes: number
  blurb: string
}

/** A league tier in the weekly XP race. */
export type LeagueId = 'Bronze' | 'Silver' | 'Gold' | 'Sapphire' | 'Ruby' | 'Diamond'

export interface LeagueDef {
  id: LeagueId
  /** Tailwind gradient stops. */
  tint: string
  rank: string
  /** Total-XP floor to sit in this league. */
  minXp: number
}

export type QuestScope = 'daily' | 'weekly' | 'monthly'

/**
 * A quest definition. `measure` reads the derived context and returns current
 * progress toward `target`; completion + reward-claim state is tracked
 * separately in the store (keyed by quest id + the period it belongs to).
 */
export interface QuestDef {
  id: string
  scope: QuestScope
  title: string
  /** XP awarded when claimed. */
  reward: number
  target: number
  unit: string
  /** Icon name from components/icons. */
  icon: string
  tint: string
}

export type AchievementCategory =
  | 'Speaking'
  | 'Streak'
  | 'Learning'
  | 'Social'
  | 'Mastery'

export interface AchievementDef {
  id: string
  name: string
  desc: string
  category: AchievementCategory
  icon: string
  tint: string
  /** When set, a progress bar + n/target is shown until unlocked. */
  target?: number
}

/** Streak-society milestone — a streak length that grants a reward + title. */
export interface MilestoneDef {
  days: number
  title: string
  /** XP awarded once when first reached. */
  reward: number
  /** Bonus streak-freezes granted. */
  freezes: number
  emoji: string
}

/** Reminder + digest preferences (retention). */
export interface ReminderPrefs {
  enabled: boolean
  /** Hour of day 0–23 for the practice reminder. */
  hour: number
}

export interface DigestPrefs {
  dailyEmail: boolean
  weeklyEmail: boolean
  push: boolean
}

/** A potential study buddy surfaced by the matcher. */
export interface BuddyCandidate {
  id: string
  name: string
  avatarEmoji: string
  country?: string
  level: string
  targetLanguage: string
  goals: string[]
  /** Deterministic activity figures so the card feels alive. */
  streak: number
  weeklyXp: number
  /** 0–100 match score vs. the current learner. */
  match: number
  blurb: string
}
