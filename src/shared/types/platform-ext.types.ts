/**
 * Extended platform data model — the domains the feature sessions consume but
 * that weren't in the original `platform.types.ts` (reviews, groups, challenges,
 * exam attempts, vocab items, DM threads/messages, activity events, media,
 * per-user stats).
 *
 * Same contract discipline as platform.types.ts: these shapes are stable. The
 * local (localStorage) backend and the Supabase backend both implement CRUD for
 * them behind the single `Backend` interface in services/backend/types.ts.
 */

import type { TargetLanguage } from './user.types'
import type { CEFRLevel } from './cefr.types'
import type { ID } from './platform.types'

// ─── Per-user learning stats (foundation for Progress #6 / Gamification #18) ─

/**
 * Aggregated, fast-to-read counters for a user. Source of truth is the
 * `activity_events` log; this row is the denormalised projection the Home /
 * Progress / Profile pages read so they don't have to fold the whole log on
 * every render. Recomputed by `recordActivity()` after each event.
 */
export interface UserStats {
  userId: ID
  /** Lifetime experience points. */
  xp: number
  /** Current consecutive-day streak. */
  streak: number
  /** Longest streak ever reached. */
  longestStreak: number
  /** ISO yyyy-mm-dd of the last day the user did anything. */
  lastActiveDay?: string
  /** Total minutes practised, lifetime. */
  totalMinutes: number
  /** Words marked as learned/mastered, lifetime. */
  wordsLearned: number
  /** Lessons completed, lifetime. */
  lessonsCompleted: number
  /** User-chosen daily goal in minutes (drives the ring on Home). */
  dailyGoalMin: number
  updatedAt: string
}

// ─── Course reviews / ratings ────────────────────────────────────────────────

export interface Review {
  id: ID
  courseId: ID
  userId: ID
  /** 1–5 stars. */
  rating: number
  text: string
  createdAt: string
}

// ─── Groups / clubs ──────────────────────────────────────────────────────────

export interface Group {
  id: ID
  name: string
  description: string
  language: TargetLanguage
  ownerId: ID
  /** Cover gradient (tailwind from-…to-…) for the card. */
  cover: string
  /** Optional card thumbnail image (data: or remote URL). Falls back to `cover` gradient. */
  imageUrl?: string
  visibility: 'public' | 'private'
  memberCount: number
  createdAt: string
}

export interface GroupMembership {
  groupId: ID
  userId: ID
  role: 'owner' | 'moderator' | 'member'
  joinedAt: string
}

/** A group member joined with their public profile + role — what the members
 *  list on the group detail page renders. */
export interface GroupMember {
  user: import('./platform.types').PlatformUser
  role: GroupMembership['role']
  joinedAt: string
}

/** One message in a group's chat room. Lighter than a DM (no per-thread plumbing
 *  — a group *is* the thread). */
export interface GroupMessage {
  id: ID
  groupId: ID
  senderId: ID
  text: string
  createdAt: string
}

// ─── Challenges (30-day, word-count, minutes…) ───────────────────────────────

export type ChallengeKind = 'streak' | 'words' | 'minutes' | 'lessons' | 'custom'

export interface Challenge {
  id: ID
  title: string
  description: string
  kind: ChallengeKind
  /** Target value for `kind` (e.g. 30 days, 500 words, 600 minutes). */
  goal: number
  language: TargetLanguage
  createdBy: ID
  startsAt: string
  endsAt: string
  cover: string
  /** Optional card thumbnail image (data: or remote URL). Falls back to `cover` gradient. */
  imageUrl?: string
  participantCount: number
  createdAt: string
}

export interface ChallengeParticipant {
  challengeId: ID
  userId: ID
  /** Progress toward `Challenge.goal`. */
  progress: number
  completedAt?: string
  joinedAt: string
}

// ─── Exam attempts ───────────────────────────────────────────────────────────

export type ExamKind = 'ielts' | 'toefl' | 'cefr' | 'duolingo' | 'sat' | 'gmat' | 'custom'

export interface ExamAttempt {
  id: ID
  userId: ID
  kind: ExamKind
  language: TargetLanguage
  /** Overall band/score (e.g. IELTS 7.0, TOEFL 95, CEFR mapped to a number). */
  overall: number
  /** Per-section breakdown, e.g. { listening: 7, reading: 6.5, writing: 6, speaking: 7 }. */
  sections: Record<string, number>
  /** Optional CEFR mapping of the overall result. */
  cefr?: CEFRLevel
  /** AI examiner feedback, when graded. */
  feedback?: string
  /** Minutes the attempt took. */
  durationMin?: number
  takenAt: string
}

// ─── Vocabulary items (FSRS-ready spaced repetition) ─────────────────────────

export type FsrsState = 'new' | 'learning' | 'review' | 'relearning'

export interface VocabItem {
  id: ID
  userId: ID
  language: TargetLanguage
  term: string
  translation: string
  example?: string
  /** Optional deck/grouping label (e.g. "IELTS band 7", "Travel"). */
  deck?: string
  /** How the word entered the user's vocabulary: manually created vs saved from
   *  content (reading/dictionary). Drives the My words / Saved tabs. */
  source?: 'created' | 'saved'
  /** Optional synonyms / alternative phrasings shown when a card is opened. */
  alternatives?: string[]
  /** ── FSRS scheduling fields (defaults are FSRS "new card") ── */
  due: string
  stability: number
  difficulty: number
  /** Elapsed/scheduled days are tracked for the FSRS formula. */
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  state: FsrsState
  lastReviewedAt?: string
  createdAt: string
}

// ─── Direct messages ─────────────────────────────────────────────────────────

export interface DmThread {
  id: ID
  /** Exactly two participant ids for a 1:1 thread (kept as an array for future group DMs). */
  participantIds: ID[]
  lastMessageAt: string
  /** Preview text of the last message, for the thread list. */
  lastMessageText?: string
  createdAt: string
}

export interface DmMessage {
  id: ID
  threadId: ID
  senderId: ID
  text: string
  /** Optional attachment (voice note, pdf, image) by url. */
  attachment?: { kind: 'audio' | 'pdf' | 'image'; url: string; name?: string }
  /** User ids that have read this message. */
  readBy: ID[]
  createdAt: string
}

// ─── Activity / learning events (append-only log) ────────────────────────────

export type ActivityKind =
  | 'lesson_complete'
  | 'word_learned'
  | 'practice_session'
  | 'exam_attempt'
  | 'speaking_session'
  | 'streak_day'
  | 'achievement'
  | 'course_enroll'
  | 'custom'

/**
 * One thing the user did. Append-only; `UserStats` is the rolled-up projection.
 * `xp` and `minutes` (when present) feed the stat counters.
 */
export interface ActivityEvent {
  id: ID
  userId: ID
  kind: ActivityKind
  language?: TargetLanguage
  /** Free-form payload, e.g. { lessonId, courseId } or { word, deck }. */
  meta?: Record<string, unknown>
  /** Minutes this event represents (added to totalMinutes). */
  minutes?: number
  /** XP awarded by this event. */
  xp?: number
  createdAt: string
}

// ─── Uploaded media assets ───────────────────────────────────────────────────

export type MediaKind = 'pdf' | 'audio' | 'image' | 'video'

export interface MediaAsset {
  id: ID
  ownerId: ID
  kind: MediaKind
  /** Public URL (Supabase Storage) or data: URL (local fallback). */
  url: string
  name: string
  sizeBytes: number
  /** MIME type as reported by the browser File. */
  contentType?: string
  createdAt: string
}
