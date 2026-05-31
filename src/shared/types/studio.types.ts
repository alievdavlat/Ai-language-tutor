/**
 * Studio domain — the teacher / monetization / admin / productivity slice.
 *
 * These shapes back the interactive lesson builder (#3), teacher analytics &
 * monetization (#21), YouTube connection (#25), payments pipeline (#32),
 * admin + moderation (#33), the clips/shorts composer (#41), and offline
 * downloads + cross-device sync (#35).
 *
 * They live alongside `platform.types.ts`. The local studio store
 * (`services/studio/store.ts`) implements them today; a real Supabase backend
 * swaps the store factory later. Analytics read enrollments/courses from the
 * existing `Backend`; everything else is owned here.
 */
import type { TargetLanguage } from './user.types'
import type { ID } from './platform.types'

// ─── #3 Interactive (TED-Ed-style) lessons ──────────────────────────────────

/** A cropped reference to a YouTube video — the spine of every lesson. */
export interface VideoClipRef {
  source: 'youtube'
  /** Raw 11-char video id (parsed from any pasted URL). */
  youtubeId: string
  /** Crop window. Player starts at startSec and stops at endSec. */
  startSec?: number
  endSec?: number
  /** Cached title from the paste-a-link metadata fetch (#25). */
  title?: string
  channelTitle?: string
}

export type ThinkQuestionKind = 'mcq' | 'open'

export interface ThinkQuestion {
  id: string
  kind: ThinkQuestionKind
  prompt: string
  /** MCQ choices. */
  options?: string[]
  /** Index into `options` for the correct answer. */
  answerIndex?: number
  /** Shown after a wrong attempt / on request. */
  hint?: string
  /** Optional model answer for open questions. */
  sampleAnswer?: string
}

/**
 * An embedded Clips-style fill-in-the-blank drill (language-learning adaptation
 * of TED-Ed). `text` carries `[[word]]` tokens that become blanks.
 */
export interface FillBlankTask {
  /** Sentence(s) with `[[answer]]` blank tokens. */
  text: string
  instructions?: string
}

export type LessonStatus = 'draft' | 'published'

/** The five TED-Ed sections, adapted for language learning. */
export interface InteractiveLesson {
  id: ID
  teacherId: ID
  /** Lessons group into a course (optional — a lesson can stand alone). */
  courseId?: ID
  title: string
  targetLanguage: TargetLanguage
  level: string
  video?: VideoClipRef
  /** "Let's Begin" — a short framing intro. */
  letsBegin: string
  /** "Think" — up to 15 questions (MCQ + open answer). */
  think: ThinkQuestion[]
  /** "Dig Deeper" — extra resources / reading (markdown + links). */
  digDeeper: string
  /** "Discuss" — open discussion prompts. */
  discuss: string
  /** "And Finally" — wrap-up / call to action. */
  andFinally: string
  /** Language-learning extras. */
  targetVocab: string[]
  grammarFocus?: string
  /** Optional embedded fill-in-blank task. */
  fillBlank?: FillBlankTask
  status: LessonStatus
  /** Stable share slug once published. */
  shareId?: string
  createdAt: string
  updatedAt: string
  views: number
  completions: number
}

// ─── #32 Payments & monetization ─────────────────────────────────────────────

/**
 * Providers. Uzbekistan/region note: international card rails (Stripe/PayPal)
 * are not reliably available to UZ teachers/students, so the local payment
 * rails **Payme** and **Click** are first-class. Stripe/PayPal stay for the
 * rest of the world. The store records intent + status; real capture is wired
 * server-side once keys exist (see docs/PAYMENTS.md).
 */
export type PaymentProvider = 'payme' | 'click' | 'stripe' | 'paypal'

export type OrderKind = 'course' | 'subscription' | 'tip'
export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface Order {
  id: ID
  buyerId: ID
  /** Course bought / subscribed to, or teacher tipped. */
  courseId?: ID
  teacherId: ID
  kind: OrderKind
  amountUsd: number
  provider: PaymentProvider
  status: OrderStatus
  /** Referral code applied at checkout, if any. */
  referralCode?: string
  note?: string
  createdAt: string
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due'

export interface Subscription {
  id: ID
  subscriberId: ID
  teacherId: ID
  courseId?: ID
  usdPerMo: number
  status: SubscriptionStatus
  startedAt: string
  renewsAt: string
}

export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'failed'

export interface Payout {
  id: ID
  teacherId: ID
  amountUsd: number
  provider: PaymentProvider
  status: PayoutStatus
  requestedAt: string
  paidAt?: string
}

export interface PayoutAccount {
  provider: PaymentProvider
  /** Card / wallet handle (masked when displayed). */
  handle: string
  verified: boolean
}

export interface ReferralCode {
  code: string
  ownerId: ID
  /** USD credited to the owner per successful referral. */
  rewardUsd: number
  signups: number
  conversions: number
}

export interface TeacherBalance {
  /** Withdrawable now. */
  availableUsd: number
  /** Earned but still in the clearing window. */
  pendingUsd: number
  lifetimeUsd: number
}

// ─── #21 Teacher analytics ───────────────────────────────────────────────────

export interface TeacherStats {
  views: number
  watchTimeHours: number
  /** 0–100 average completion across the teacher's courses. */
  avgCompletion: number
  revenueUsd: number
  subscribers: number
  /** Weekly plays series for the bar chart. */
  weeklyPlays: number[]
  /** Per-course breakdown. */
  topCourses: { courseId: ID; title: string; views: number; completion: number; revenueUsd: number }[]
  audience: { country: string; pct: number }[]
}

// ─── #33 Admin + moderation ──────────────────────────────────────────────────

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'misinformation' | 'other'

export interface ReportTarget {
  kind: 'post' | 'user' | 'course' | 'stream' | 'comment'
  id: ID
  /** Snapshot of what was reported (text/title) for triage. */
  preview?: string
}

export type ReportStatus = 'open' | 'resolved' | 'dismissed'

export interface Report {
  id: ID
  reporterId: ID
  target: ReportTarget
  reason: ReportReason
  note?: string
  status: ReportStatus
  createdAt: string
  resolvedAt?: string
  /** How many distinct users have reported this same target. */
  reportCount: number
}

export type ModerationAction = 'remove' | 'warn' | 'ban' | 'unban' | 'dismiss' | 'approve' | 'reject'

export interface ModerationLogEntry {
  id: ID
  moderatorId: ID
  target: ReportTarget
  action: ModerationAction
  note?: string
  at: string
}

export interface FeaturedSlot {
  id: ID
  kind: 'course' | 'ad'
  /** courseId for kind=course. */
  refId?: ID
  title: string
  cover: string
  /** Display order in the home hero carousel. */
  position: number
  active: boolean
  /** Ad-only. */
  sponsor?: string
  priceWeekUsd?: number
}

export interface UserModerationState {
  userId: ID
  banned: boolean
  bannedAt?: string
  warnings: number
}

// ─── #25 YouTube OAuth + import ──────────────────────────────────────────────

export interface YouTubeConnection {
  connected: boolean
  channelId?: string
  channelTitle?: string
  /** @handle resolved for the channel, when known. */
  handle?: string
  thumbnail?: string
  subscriberCount?: number
  videoCount?: number
  /** Uploads playlist id (UU…) — the spine of a real video import. */
  uploadsPlaylistId?: string
  connectedAt?: string
  /** OAuth scopes granted. */
  scopes?: string[]
  /** Short-lived OAuth access token (implicit flow). Used as a bearer for import. */
  accessToken?: string
  /** Epoch ms when `accessToken` expires. */
  tokenExpiresAt?: number
  /** How the connection was established. */
  via?: 'oauth' | 'link' | 'demo'
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  durationSec: number
  viewCount: number
  /** True once the teacher has imported it as a lesson/clip source. */
  imported?: boolean
}

// ─── #41 Clips / shorts composer ─────────────────────────────────────────────

export interface ShortClip {
  id: ID
  teacherId: ID
  /** Source can be a YouTube video or a past live stream. */
  source: VideoClipRef | { source: 'live'; streamId: ID; title?: string }
  title: string
  caption?: string
  startSec: number
  endSec: number
  /** 9:16 / 1:1 / 16:9 export aspect. */
  aspect: '9:16' | '1:1' | '16:9'
  status: 'draft' | 'published'
  views: number
  createdAt: string
}

// ─── #35 Offline downloads + cross-device sync ───────────────────────────────

export type DownloadKind = 'course' | 'lesson' | 'clip' | 'video'
export type DownloadStatus = 'queued' | 'downloading' | 'ready' | 'error' | 'expired'

export interface DownloadItem {
  id: ID
  kind: DownloadKind
  refId: ID
  title: string
  sizeMb: number
  status: DownloadStatus
  /** 0–100. */
  progress: number
  addedAt: string
  /** Offline rental expiry (course rentals expire). */
  expiresAt?: string
}

export interface DeviceInfo {
  id: ID
  name: string
  platform: string
  lastSeenAt: string
  /** This device. */
  current: boolean
}

export interface SyncState {
  deviceId: ID
  lastSyncedAt?: string
  pendingChanges: number
  devices: DeviceInfo[]
}
