/**
 * Social-slice data model — the domains the community/social feature pages own:
 * tutors + bookings + tutor reviews, the peer feedback exchange (writing/speaking
 * submissions, peer reviews, karma economy), and the derived profile artefacts
 * (certificates, skill radar, badges) plus mega-search result shapes.
 *
 * These live behind the `SocialBackend` contract in services/backend/social.ts
 * (local + supabase impls), the same discipline as platform.types / platform-ext.
 * Kept in their own file so the social slice can grow without touching the core
 * `Backend` contract that every other feature session also edits.
 */
import type { TargetLanguage } from './user.types'
import type { ID, Course, PlatformUser, Post } from './platform.types'
import type { Group } from './platform-ext.types'

// ─── Tutors ──────────────────────────────────────────────────────────────────

export type TutorKind = 'pro' | 'community'

/** A tutor profile. `userId` points at the underlying PlatformUser. */
export interface TutorProfile {
  id: ID
  userId: ID
  name: string
  /** Flag emoji for the country shown on the card. */
  flag: string
  headline: string
  bio: string
  /** Languages the tutor teaches (ISO codes or display names). */
  teaches: string[]
  /** Languages the tutor speaks, with a CEFR-ish label. */
  speaks: { language: string; level: string }[]
  kind: TutorKind
  hourlyRateUsd: number
  rating: number
  reviewCount: number
  lessonsGiven: number
  studentsCount: number
  /** YouTube/intro video url for the card hover/preview. */
  videoIntroUrl?: string
  /** Offers a free trial lesson. */
  trial: boolean
  /** Currently available for an instant call. */
  online: boolean
  /** Focus tags: IELTS, Business, Conversation, Kids… */
  tags: string[]
  /** Cover gradient (tailwind from-…to-…) for the card. */
  cover: string
  /** Weekly recurring availability: weekday 0=Sun…6=Sat → list of "HH:MM" starts. */
  availability: { weekday: number; times: string[] }[]
  avatarEmoji: string
  createdAt: string
}

export type BookingKind = 'trial' | 'lesson' | 'instant'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Booking {
  id: ID
  tutorId: ID
  studentId: ID
  /** ISO start time of the lesson. */
  startISO: string
  durationMin: number
  kind: BookingKind
  status: BookingStatus
  priceUsd: number
  note?: string
  createdAt: string
}

export interface TutorReview {
  id: ID
  tutorId: ID
  studentId: ID
  /** 1–5. */
  rating: number
  text: string
  createdAt: string
}

// ─── Feedback exchange (peer review + karma) ─────────────────────────────────

export type FeedbackKind = 'writing' | 'speaking'
export type FeedbackStatus = 'open' | 'reviewed'

export interface FeedbackSubmission {
  id: ID
  authorId: ID
  kind: FeedbackKind
  /** Topic / prompt the work answers. */
  topic: string
  /** Writing body, or transcript for a speaking attempt. */
  content: string
  /** Optional recording url (data: or storage) for speaking submissions. */
  audioUrl?: string
  language: TargetLanguage
  level: string
  /** Karma the author offers each reviewer. */
  reward: number
  status: FeedbackStatus
  reviewCount: number
  createdAt: string
}

export interface PeerReview {
  id: ID
  submissionId: ID
  reviewerId: ID
  /** 1–5 overall rating of the work. */
  rating: number
  text: string
  /** Whether the submission's author has thanked this review. */
  thanked: boolean
  createdAt: string
}

/** Per-user karma wallet — the currency that gates submissions. */
export interface KarmaWallet {
  userId: ID
  balance: number
  earnedTotal: number
  spentTotal: number
  /** Submissions made today (free allowance is computed from this). */
  submittedToday: number
  lastSubmitDay?: string
  updatedAt: string
}

// ─── Community: leaderboards ─────────────────────────────────────────────────

export interface LeaderboardRow {
  userId: ID
  name: string
  avatarEmoji: string
  country?: string
  /** Progress toward the challenge goal. */
  progress: number
  /** 0–100 percent of the goal. */
  pct: number
  /** True once the participant has hit the goal. */
  completed: boolean
}

// ─── Mega-search ─────────────────────────────────────────────────────────────

export interface SearchClipHit {
  id: string
  title: string
  artist: string
  kind: string
  cover: string
  level: string
}

export interface SearchLessonHit {
  lessonId: ID
  title: string
  courseId: ID
  courseTitle: string
  kind: string
}

export interface SearchResults {
  query: string
  courses: Course[]
  users: PlatformUser[]
  groups: Group[]
  posts: Post[]
  lessons: SearchLessonHit[]
  clips: SearchClipHit[]
  total: number
}

// ─── Profile-derived artefacts (#22) ─────────────────────────────────────────

export interface Certificate {
  id: ID
  userId: ID
  /** Where it came from. */
  source: 'course' | 'exam' | 'level-test'
  title: string
  /** Sub-label e.g. "IELTS · Band 7.0" or "B2 Upper-Intermediate". */
  detail: string
  /** ISO date earned. */
  issuedAt: string
  /** Gradient for the card. */
  cover: string
  /** Score/grade summary, if any. */
  score?: string
}

/** Five-axis skill radar shown on the profile pentagon. */
export interface SkillRadar {
  userId: ID
  pronunciation: number
  fluency: number
  grammar: number
  intonation: number
  vocabulary: number
}

export interface Badge {
  id: string
  title: string
  description: string
  emoji: string
  /** Whether the user has unlocked it. */
  earned: boolean
  /** 0–100 progress toward earning it (100 when earned). */
  progress: number
  category: 'streak' | 'words' | 'lessons' | 'social' | 'exam' | 'milestone'
}
