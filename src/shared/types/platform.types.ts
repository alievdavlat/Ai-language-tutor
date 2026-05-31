/**
 * Platform-level data model. These shapes are stable contracts that the
 * mock-backend (services/backend/local.ts) implements today, and the real
 * Supabase backend will implement later by changing one factory file.
 */

import type { CEFRLevel } from './cefr.types'
import type { TargetLanguage } from './user.types'

export type ID = string

// Canonical role hierarchy (Owner > Admin > Teacher > Student) lives in the
// shared permissions module (#A55). Re-exported here so the platform data model
// and the permission matrix never drift apart. 'admin' is server-persisted.
export type { Role } from '../constants/roles'
import type { Role } from '../constants/roles'

// ─── Identity ──────────────────────────────────────────────────────────────

export interface PlatformUser {
  id: ID
  name: string
  email: string
  role: Role
  avatarEmoji?: string
  bio?: string
  /** Native language code (ISO 639-1). */
  nativeLanguage: string
  /** What this user is learning. Teachers usually still pick a target too. */
  targetLanguage: TargetLanguage
  level?: CEFRLevel
  createdAt: string
  /** Country code shown next to the name on the channel page. */
  country?: string
  /** Profile photo (Supabase Storage / data: URL). */
  avatarUrl?: string
  /** Channel banner image (Supabase Storage / data: URL). */
  bannerUrl?: string
}

// ─── Content ───────────────────────────────────────────────────────────────

/** A downloadable resource attached to a lesson (real uploaded file URL). */
export interface LessonMaterialRef {
  kind: 'pdf' | 'audio'
  /** Display name shown in the materials list. */
  name: string
  /** Storage / data URL produced by the upload helper. */
  url: string
  /** Human-friendly size (PDF) or duration (audio), optional. */
  size?: string
}

/**
 * Rich, teacher-authored lesson body. Stored as one JSON blob on the lesson
 * (`Lesson.content`) so it persists in both the local and cloud backends
 * without a column-per-field migration. Authored in Creator Studio's rich-text
 * editor and rendered faithfully on the learner side (Classroom).
 */
export interface LessonContentDoc {
  /** Short "what you'll learn" summary (markdown). */
  about?: string
  /** Main rich-text / blog article — the written lesson material (markdown). */
  body?: string
  /** Optional video transcript. */
  transcript?: string
  /** Downloadable PDFs / audio attached by the teacher. */
  materials?: LessonMaterialRef[]
}

export interface Course {
  id: ID
  teacherId: ID
  title: string
  /** Short one-line tagline shown on cards. */
  description: string
  /** Rich "About this course" article (markdown) shown on the course page. */
  about?: string
  level: string
  targetLanguage: TargetLanguage
  /** Gradient class fallback (e.g. "from-sky-500 to-blue-700") used when no image is set. */
  cover: string
  /** Square card image (data: URL or remote URL). Falls back to `cover` gradient. */
  thumbnailUrl?: string
  /** Wide hero/banner image for the course detail page. Falls back to `cover` gradient. */
  bannerUrl?: string
  /** Pricing: { kind: 'free' } | { kind: 'one-off', usd: number } | { kind: 'sub', usdPerMo: number } */
  pricing: { kind: 'free' } | { kind: 'one-off'; usd: number } | { kind: 'sub'; usdPerMo: number }
  rating: number
  reviewCount: number
  enrollmentCount: number
  hours: number
  /** ISO publish date. Drafts have no publishedAt. */
  publishedAt?: string
  capstone?: string
  /** Duplicate-detection key (#A65) — `to:<title>|<ownerId>` via `services/dedup`. */
  contentHash?: string
}

export interface Unit {
  id: ID
  courseId: ID
  index: number
  title: string
  about?: string
}

export interface Lesson {
  id: ID
  unitId: ID
  index: number
  title: string
  kind: 'video' | 'practice' | 'exam' | 'rule'
  /** YouTube URL for video kind. */
  videoUrl?: string
  durationMin?: number
  dripDays?: number
  /**
   * Free preview lesson — playable before purchase on a paid course (a taster).
   * Ignored for free courses (those unlock entirely on enrolment).
   */
  preview?: boolean
  /** Rich teacher-authored content (article body, about, transcript, materials). */
  content?: LessonContentDoc
}

// ─── Social / community ───────────────────────────────────────────────────

export type PostKind = 'text' | 'question' | 'resource' | 'achievement' | 'poll' | 'study-session' | 'voice'

export interface Poll {
  question: string
  options: { id: string; label: string; votes: number }[]
  closesAt?: string
}

export interface StudySessionMeta {
  topic: string
  language: TargetLanguage
  level: string
  whenISO: string
  durationMin: number
  capacity: number
  joinedIds: ID[]
}

export interface AchievementMeta {
  title: string
  emoji: string
  /** e.g. "100-word streak" or "First IELTS mock at band 7". */
  description: string
}

export interface VoiceMeta {
  durationSec: number
  /** Recorded clip URL (Supabase Storage public URL, or a data: URL in local mode). */
  audioUrl?: string
  /** Optional auto-transcript shown under the player. */
  transcript?: string
}

export interface Post {
  id: ID
  authorId: ID
  kind: PostKind
  /** Text body. For polls and study-sessions, often the longer description. */
  text: string
  /** Optional attached resource (youtube/pdf/audio/image/video). */
  resource?: { kind: 'youtube' | 'pdf' | 'audio' | 'image' | 'video'; url: string; title?: string }
  poll?: Poll
  studySession?: StudySessionMeta
  achievement?: AchievementMeta
  voice?: VoiceMeta
  createdAt: string
  likeCount: number
  commentCount: number
  /** Emoji reactions map: { '❤️': 24, '👍': 12, '🎯': 5 }. */
  reactions?: Record<string, number>
  /** Number of times shared. */
  shareCount?: number
}

export interface Follow {
  followerId: ID
  followingId: ID
  createdAt: string
}

export interface Like {
  userId: ID
  postId: ID
  createdAt: string
}

export interface Save {
  userId: ID
  // saved either a course or a post
  target: { kind: 'course'; id: ID } | { kind: 'post'; id: ID }
  createdAt: string
}

export interface Enrollment {
  userId: ID
  courseId: ID
  /** 0–100 percentage. */
  progress: number
  /** Last accessed timestamp. */
  lastActiveAt: string
  enrolledAt: string
  completedAt?: string
}

// ─── Live ──────────────────────────────────────────────────────────────────

export interface LiveStream {
  id: ID
  hostId: ID
  title: string
  category: string
  language: TargetLanguage
  viewerCount: number
  startedAt: string
  /** Cover gradient for the lobby/grid card. */
  cover: string
  /** Optional card thumbnail image (data: or remote URL). Falls back to `cover` gradient. */
  imageUrl?: string
}

export interface LiveAnnouncement {
  id: ID
  teacherId: ID
  title: string
  body: string
  whenISO: string
  cover: string
  /** Optional hero banner image (data: or remote URL). Falls back to the gradient. */
  imageUrl?: string
}

// ─── Notifications ─────────────────────────────────────────────────────────

/** Broad bucket used by the filter tabs, the DB `type` column and the tint. */
export type NotifCategory = 'social' | 'learning' | 'system'

/**
 * Fine-grained notification catalog. Each kind maps to one {@link NotifCategory}
 * (see `services/notifications/catalog`), drives its icon + default deep-link,
 * and is individually toggleable in Settings → Notifications.
 */
export type NotifKind =
  | 'reminder'
  | 'streak-at-risk'
  | 'goal'
  | 'badge'
  | 'milestone'
  | 'quest'
  | 'vocab-due'
  | 'announcement'
  | 'new-course'
  | 'live'
  | 'dm'
  | 'comment-reply'
  | 'peer-review'
  | 'certificate'

export interface Notif {
  id: ID
  userId: ID
  /** Broad bucket (drives filter tabs + DB check constraint). */
  type: NotifCategory
  /** Fine-grained catalog entry. Optional for legacy rows (inferred from `type`). */
  kind?: NotifKind
  title: string
  body: string
  createdAt: string
  read: boolean
  link?: string
}
