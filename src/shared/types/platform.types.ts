/**
 * Platform-level data model. These shapes are stable contracts that the
 * mock-backend (services/backend/local.ts) implements today, and the real
 * Supabase backend will implement later by changing one factory file.
 */

import type { CEFRLevel } from './cefr.types'
import type { TargetLanguage } from './user.types'

export type ID = string

export type Role = 'student' | 'teacher'

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
}

// ─── Content ───────────────────────────────────────────────────────────────

export interface Course {
  id: ID
  teacherId: ID
  title: string
  description: string
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
  /** Optional auto-transcript shown under the player. */
  transcript?: string
}

export interface Post {
  id: ID
  authorId: ID
  kind: PostKind
  /** Text body. For polls and study-sessions, often the longer description. */
  text: string
  /** Optional attached resource (youtube/pdf/audio). */
  resource?: { kind: 'youtube' | 'pdf' | 'audio'; url: string; title?: string }
  poll?: Poll
  studySession?: StudySessionMeta
  achievement?: AchievementMeta
  voice?: VoiceMeta
  /** When set, this post belongs to a group's scoped feed (not the global feed). */
  groupId?: ID
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

export interface Notif {
  id: ID
  userId: ID
  type: 'social' | 'learning' | 'system'
  title: string
  body: string
  createdAt: string
  read: boolean
  link?: string
}
