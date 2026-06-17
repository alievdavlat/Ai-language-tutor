/**
 * Studio store — local, conflict-free data layer for the teacher /
 * monetization / admin / productivity slice.
 *
 * Why its own store (not the shared `Backend`): several build sessions edit
 * `services/backend/{types,local}.ts` in parallel, so this slice keeps its
 * domain (#3 lessons, #21 analytics, #25 youtube, #32 payments, #33 moderation,
 * #41 clips, #35 sync) in a separate localStorage namespace and only *reads*
 * courses/enrollments from the shared backend for analytics.
 *
 * Swap target: when Supabase lands, replace the body of each method with a
 * query — the method names are list/get/upsert/… on purpose.
 */
import type {
  DeviceInfo,
  DownloadItem,
  DownloadKind,
  FeaturedSlot,
  InteractiveLesson,
  ModerationLogEntry,
  Order,
  OrderKind,
  PaymentProvider,
  PayoutAccount,
  Payout,
  Report,
  ReportReason,
  ReportStatus,
  ReportTarget,
  ShortClip,
  Subscription,
  TeacherBalance,
  TeacherStats,
  UserModerationState,
  YouTubeConnection,
  YouTubeVideo
} from '@shared/types/studio.types'
import type { ID } from '@shared/types'
import { backend } from '../backend/useBackend'
import {
  SEED_DOWNLOADS,
  SEED_FEATURED,
  SEED_LESSONS,
  SEED_ORDERS,
  SEED_PAYOUTS,
  SEED_REPORTS,
  SEED_SHORTS,
  SEED_SUBSCRIPTIONS
} from './seed'

// ─── Storage ─────────────────────────────────────────────────────────────────

const LS_KEY = 'speakai.studio.v1'

interface StudioDb {
  lessons: InteractiveLesson[]
  orders: Order[]
  subscriptions: Subscription[]
  payouts: Payout[]
  payoutAccounts: PayoutAccount[]
  referralCodes: { code: string; ownerId: ID; rewardUsd: number; signups: number; conversions: number }[]
  reports: Report[]
  moderationLog: ModerationLogEntry[]
  featured: FeaturedSlot[]
  userModeration: UserModerationState[]
  youtube: YouTubeConnection
  importedVideos: YouTubeVideo[]
  shorts: ShortClip[]
  downloads: DownloadItem[]
  deviceId: ID
  lastSyncedAt?: string
}

function emptyDb(): StudioDb {
  return {
    lessons: [...SEED_LESSONS],
    orders: [...SEED_ORDERS],
    subscriptions: [...SEED_SUBSCRIPTIONS],
    payouts: [...SEED_PAYOUTS],
    payoutAccounts: [],
    referralCodes: [],
    reports: [...SEED_REPORTS],
    moderationLog: [],
    featured: [...SEED_FEATURED],
    userModeration: [],
    youtube: { connected: false },
    importedVideos: [],
    shorts: [...SEED_SHORTS],
    downloads: [...SEED_DOWNLOADS],
    deviceId: `dev_${Math.random().toString(36).slice(2, 8)}`
  }
}

let cache: StudioDb | null = null
function db(): StudioDb {
  if (cache) return cache
  if (typeof window === 'undefined' || !window.localStorage) {
    cache = emptyDb()
    return cache
  }
  const raw = window.localStorage.getItem(LS_KEY)
  if (!raw) {
    cache = emptyDb()
    persist()
    return cache
  }
  try {
    cache = { ...emptyDb(), ...(JSON.parse(raw) as Partial<StudioDb>) } as StudioDb
  } catch {
    cache = emptyDb()
  }
  return cache
}
function persist(): void {
  if (cache && typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(cache)) } catch { /* quota */ }
  }
}

const now = (): string => new Date().toISOString()
const newId = (p: string): ID => `${p}_${Math.random().toString(36).slice(2, 10)}`

function me(): ID {
  return backend.currentUserId() ?? 'u_emma'
}

// ─── #25 YouTube helpers ─────────────────────────────────────────────────────

/** Parse an 11-char video id from any pasted URL or bare id. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim()
  if (/^[\w-]{11}$/.test(s)) return s
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
    /[?&]v=([\w-]{11})/
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) return m[1]
  }
  return null
}

export interface VideoMeta {
  youtubeId: string
  title: string
  channelTitle: string
  thumbnail: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const studio = {
  // ── #3 Interactive lessons ──────────────────────────────────────────────
  async listLessons(teacherId?: ID): Promise<InteractiveLesson[]> {
    const tid = teacherId ?? me()
    return db().lessons.filter((l) => l.teacherId === tid).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  async listLessonsByCourse(courseId: ID): Promise<InteractiveLesson[]> {
    return db().lessons.filter((l) => l.courseId === courseId)
  },
  async getLesson(id: ID): Promise<InteractiveLesson | null> {
    return db().lessons.find((l) => l.id === id) ?? null
  },
  async getLessonByShareId(shareId: string): Promise<InteractiveLesson | null> {
    return db().lessons.find((l) => l.shareId === shareId) ?? null
  },
  async upsertLesson(lesson: InteractiveLesson): Promise<InteractiveLesson> {
    const next = { ...lesson, updatedAt: now() }
    const i = db().lessons.findIndex((l) => l.id === next.id)
    if (i < 0) db().lessons.push(next)
    else db().lessons[i] = next
    persist()
    return next
  },
  async publishLesson(id: ID): Promise<InteractiveLesson> {
    const i = db().lessons.findIndex((l) => l.id === id)
    if (i < 0) throw new Error('Lesson not found')
    const shareId = db().lessons[i].shareId ?? newId('lx')
    db().lessons[i] = { ...db().lessons[i], status: 'published', shareId, updatedAt: now() }
    persist()
    return db().lessons[i]
  },
  async deleteLesson(id: ID): Promise<void> {
    db().lessons = db().lessons.filter((l) => l.id !== id)
    persist()
  },
  async recordLessonView(id: ID): Promise<void> {
    const i = db().lessons.findIndex((l) => l.id === id)
    if (i >= 0) { db().lessons[i] = { ...db().lessons[i], views: db().lessons[i].views + 1 }; persist() }
  },
  async recordLessonCompletion(id: ID): Promise<void> {
    const i = db().lessons.findIndex((l) => l.id === id)
    if (i >= 0) { db().lessons[i] = { ...db().lessons[i], completions: db().lessons[i].completions + 1 }; persist() }
  },

  // ── #21 Teacher analytics ───────────────────────────────────────────────
  async teacherStats(teacherId?: ID): Promise<TeacherStats> {
    const tid = teacherId ?? me()
    const courses = await backend.myCourses(tid)
    const students = await backend.studentsOf(tid)
    const lessons = db().lessons.filter((l) => l.teacherId === tid)
    const orders = db().orders.filter((o) => o.teacherId === tid && o.status === 'paid')

    // Views = REAL recorded lesson plays only (recordLessonView). No synthetic
    // multiplier on enrollment counts.
    const views = lessons.reduce((a, l) => a + l.views, 0)
    // Watch-hours: transparent estimate off real plays (~4.5 min avg/play),
    // shown to the teacher as an estimate, not a measured figure.
    const watchTimeHours = Math.round((views * 4.5) / 60)
    // Avg completion = mean of REAL student enrollment progress. No rating-based
    // fallback: a course with no students has no measured completion → 0.
    const completion = students.length
      ? Math.round(students.reduce((a, s) => a + s.enrollment.progress, 0) / students.length)
      : 0
    const revenueUsd = orders.reduce((a, o) => a + o.amountUsd, 0)

    // No per-day/per-week play history is recorded anywhere, so we cannot show a
    // real weekly trend. Return an empty series rather than a synthetic curve.
    const weeklyPlays: number[] = []

    // Per-course completion from REAL student progress for that course; views
    // from REAL lesson plays of that course's lessons.
    const topCourses = courses
      .map((c) => {
        const courseStudents = students.filter((s) => s.enrollment.courseId === c.id)
        const courseCompletion = courseStudents.length
          ? Math.round(courseStudents.reduce((a, s) => a + s.enrollment.progress, 0) / courseStudents.length)
          : 0
        const courseViews = lessons.filter((l) => l.courseId === c.id).reduce((a, l) => a + l.views, 0)
        return {
          courseId: c.id,
          title: c.title,
          views: courseViews,
          completion: courseCompletion,
          revenueUsd: orders.filter((o) => o.courseId === c.id).reduce((a, o) => a + o.amountUsd, 0)
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Real audience split — bucket the teacher's actual students by country.
    const byCountry = new Map<string, number>()
    for (const s of students) {
      const c = (s.user.country || 'Unknown').trim() || 'Unknown'
      byCountry.set(c, (byCountry.get(c) ?? 0) + 1)
    }
    const total = students.length
    const audience = total
      ? [...byCountry.entries()]
          .map(([country, n]) => ({ country, pct: Math.round((n / total) * 100) }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 6)
      : []

    return {
      views,
      watchTimeHours,
      avgCompletion: completion,
      revenueUsd,
      // Subscribers = REAL enrolled students only.
      subscribers: students.length,
      weeklyPlays,
      topCourses,
      audience
    }
  },

  // ── #21 / #32 Monetization ──────────────────────────────────────────────
  async teacherBalance(teacherId?: ID): Promise<TeacherBalance> {
    const tid = teacherId ?? me()
    const paidOrders = db().orders.filter((o) => o.teacherId === tid && o.status === 'paid')
    const lifetime = paidOrders.reduce((a, o) => a + o.amountUsd, 0)
    const paidOut = db().payouts.filter((p) => p.teacherId === tid && p.status === 'paid').reduce((a, p) => a + p.amountUsd, 0)
    const requested = db().payouts.filter((p) => p.teacherId === tid && p.status !== 'paid').reduce((a, p) => a + p.amountUsd, 0)
    // Orders in the last 14 days are "pending" (clearing window).
    const cutoff = Date.now() - 14 * 24 * 60 * 60_000
    const pending = paidOrders.filter((o) => new Date(o.createdAt).getTime() > cutoff).reduce((a, o) => a + o.amountUsd, 0)
    const available = Math.max(0, lifetime - pending - paidOut - requested)
    return { availableUsd: Math.round(available), pendingUsd: Math.round(pending), lifetimeUsd: Math.round(lifetime) }
  },
  async revenueSources(teacherId?: ID): Promise<{ label: string; amountUsd: number; pct: number }[]> {
    const tid = teacherId ?? me()
    const paid = db().orders.filter((o) => o.teacherId === tid && o.status === 'paid')
    const byKind: Record<OrderKind, number> = { course: 0, subscription: 0, tip: 0 }
    for (const o of paid) byKind[o.kind] += o.amountUsd
    const total = byKind.course + byKind.subscription + byKind.tip || 1
    return [
      { label: 'Course sales', amountUsd: byKind.course, pct: Math.round((byKind.course / total) * 100) },
      { label: 'Subscriptions', amountUsd: byKind.subscription, pct: Math.round((byKind.subscription / total) * 100) },
      { label: 'Tips', amountUsd: byKind.tip, pct: Math.round((byKind.tip / total) * 100) }
    ]
  },
  async listOrders(teacherId?: ID): Promise<Order[]> {
    const tid = teacherId ?? me()
    return db().orders.filter((o) => o.teacherId === tid).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async listPayouts(teacherId?: ID): Promise<Payout[]> {
    const tid = teacherId ?? me()
    return db().payouts.filter((p) => p.teacherId === tid).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  },
  async requestPayout(amountUsd: number, provider: PaymentProvider, teacherId?: ID): Promise<Payout> {
    const tid = teacherId ?? me()
    const p: Payout = { id: newId('po'), teacherId: tid, amountUsd, provider, status: 'requested', requestedAt: now() }
    db().payouts.unshift(p)
    persist()
    return p
  },
  async listSubscriptions(teacherId?: ID): Promise<Subscription[]> {
    const tid = teacherId ?? me()
    return db().subscriptions.filter((s) => s.teacherId === tid)
  },
  async payoutAccounts(): Promise<PayoutAccount[]> {
    return [...db().payoutAccounts]
  },
  async setPayoutAccount(acct: PayoutAccount): Promise<void> {
    const i = db().payoutAccounts.findIndex((a) => a.provider === acct.provider)
    if (i < 0) db().payoutAccounts.push(acct)
    else db().payoutAccounts[i] = acct
    persist()
  },
  async getReferral(ownerId?: ID): Promise<StudioDb['referralCodes'][number]> {
    const oid = ownerId ?? me()
    let r = db().referralCodes.find((x) => x.ownerId === oid)
    if (!r) {
      r = { code: `REF-${oid.slice(-4).toUpperCase()}`, ownerId: oid, rewardUsd: 5, signups: 0, conversions: 0 }
      db().referralCodes.push(r)
      persist()
    }
    return r
  },

  // ── #32 Payments pipeline ───────────────────────────────────────────────
  /**
   * Checkout. Records the order, "captures" it (mock — real capture is the
   * provider webhook, see docs/PAYMENTS.md), enrolls the buyer, applies any
   * referral credit, and credits the teacher's pending balance.
   */
  async checkout(input: {
    buyerId: ID
    teacherId: ID
    courseId?: ID
    kind: OrderKind
    amountUsd: number
    provider: PaymentProvider
    referralCode?: string
    note?: string
  }): Promise<Order> {
    const order: Order = {
      id: newId('ord'),
      buyerId: input.buyerId,
      teacherId: input.teacherId,
      courseId: input.courseId,
      kind: input.kind,
      amountUsd: input.amountUsd,
      provider: input.provider,
      status: input.amountUsd === 0 ? 'paid' : 'paid', // mock instant capture
      referralCode: input.referralCode,
      note: input.note,
      createdAt: now()
    }
    db().orders.unshift(order)

    // Referral credit
    if (input.referralCode) {
      const ri = db().referralCodes.findIndex((r) => r.code === input.referralCode)
      if (ri >= 0) db().referralCodes[ri] = { ...db().referralCodes[ri], conversions: db().referralCodes[ri].conversions + 1 }
    }

    // Recurring subscriptions get a Subscription row.
    if (input.kind === 'subscription') {
      db().subscriptions.unshift({
        id: newId('sub'),
        subscriberId: input.buyerId,
        teacherId: input.teacherId,
        courseId: input.courseId,
        usdPerMo: input.amountUsd,
        status: 'active',
        startedAt: now(),
        renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()
      })
    }
    persist()

    // Enroll through the shared backend so the course shows in "My learning".
    if (input.courseId) {
      try { await backend.enroll(input.buyerId, input.courseId) } catch { /* already enrolled */ }
    }
    return order
  },
  async tip(toTeacherId: ID, amountUsd: number, provider: PaymentProvider, message?: string): Promise<Order> {
    return this.checkout({ buyerId: me(), teacherId: toTeacherId, kind: 'tip', amountUsd, provider, note: message })
  },

  // ── #26 Paywall: entitlements + subscription lifecycle ───────────────────
  /**
   * Advance the subscription clock. Any active subscription past its renewal
   * date — with no captured renewal — drops to `past_due`, which re-locks the
   * course. This is the mock stand-in for the provider's recurring-charge
   * webhook (see docs/PAYMENTS.md); real renewals would flip it back to active.
   * Idempotent — safe to call on every read.
   */
  runSubscriptionLifecycle(): void {
    const nowMs = Date.now()
    let changed = false
    db().subscriptions = db().subscriptions.map((s) => {
      if (s.status === 'active' && new Date(s.renewsAt).getTime() <= nowMs) {
        changed = true
        return { ...s, status: 'past_due' as const }
      }
      return s
    })
    if (changed) persist()
  },
  /** All orders placed by a buyer (purchase history). */
  async myOrders(buyerId?: ID): Promise<Order[]> {
    const bid = buyerId ?? me()
    return db().orders.filter((o) => o.buyerId === bid).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  /** The paid one-off purchase for a course, if the buyer owns it (lifetime access). */
  async coursePurchase(buyerId: ID, courseId: ID): Promise<Order | null> {
    return db().orders.find((o) => o.buyerId === buyerId && o.courseId === courseId && o.kind === 'course' && o.status === 'paid') ?? null
  },
  /** The most-recent subscription row for a (subscriber, course), after running the lifecycle clock. */
  async courseSubscription(subscriberId: ID, courseId: ID): Promise<Subscription | null> {
    this.runSubscriptionLifecycle()
    const subs = db().subscriptions.filter((s) => s.subscriberId === subscriberId && s.courseId === courseId)
    if (!subs.length) return null
    return [...subs].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  },
  /** Cancel — access continues until the end of the paid period (renewsAt), then re-locks. */
  async cancelSubscription(id: ID): Promise<Subscription | null> {
    const i = db().subscriptions.findIndex((s) => s.id === id)
    if (i < 0) return null
    db().subscriptions[i] = { ...db().subscriptions[i], status: 'canceled' }
    persist()
    return db().subscriptions[i]
  },
  /** Renew / resume — captures another period and pushes renewsAt out 30 days. */
  async renewSubscription(id: ID): Promise<Subscription | null> {
    const i = db().subscriptions.findIndex((s) => s.id === id)
    if (i < 0) return null
    db().subscriptions[i] = {
      ...db().subscriptions[i],
      status: 'active',
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()
    }
    persist()
    return db().subscriptions[i]
  },
  /**
   * Test/dev hook: force a subscription to expire immediately so the re-lock
   * path can be exercised without waiting 30 days. Not used in production UI.
   */
  async __expireSubscriptionForTesting(id: ID): Promise<void> {
    const i = db().subscriptions.findIndex((s) => s.id === id)
    if (i < 0) return
    db().subscriptions[i] = { ...db().subscriptions[i], status: 'active', renewsAt: new Date(Date.now() - 1000).toISOString() }
    persist()
    this.runSubscriptionLifecycle()
  },

  // ── #33 Admin + moderation ──────────────────────────────────────────────
  async listReports(status?: ReportStatus): Promise<Report[]> {
    let r = [...db().reports]
    if (status) r = r.filter((x) => x.status === status)
    return r.sort((a, b) => b.reportCount - a.reportCount)
  },
  async createReport(input: { reporterId: ID; target: ReportTarget; reason: ReportReason; note?: string }): Promise<Report> {
    const existing = db().reports.find((r) => r.target.kind === input.target.kind && r.target.id === input.target.id && r.status === 'open')
    if (existing) {
      const i = db().reports.indexOf(existing)
      db().reports[i] = { ...existing, reportCount: existing.reportCount + 1 }
      persist()
      return db().reports[i]
    }
    const r: Report = {
      id: newId('rep'),
      reporterId: input.reporterId,
      target: input.target,
      reason: input.reason,
      note: input.note,
      status: 'open',
      createdAt: now(),
      reportCount: 1
    }
    db().reports.unshift(r)
    persist()
    return r
  },
  async resolveReport(id: ID, action: 'remove' | 'dismiss' | 'warn' | 'ban', moderatorId: ID, note?: string): Promise<void> {
    const i = db().reports.findIndex((r) => r.id === id)
    if (i < 0) return
    const report = db().reports[i]
    db().reports[i] = { ...report, status: action === 'dismiss' ? 'dismissed' : 'resolved', resolvedAt: now() }
    db().moderationLog.unshift({ id: newId('mlog'), moderatorId, target: report.target, action, note, at: now() })
    if ((action === 'ban' || action === 'warn') && report.target.kind === 'user') {
      await this.moderateUser(report.target.id, action)
    }
    persist()
  },
  async listModerationLog(): Promise<ModerationLogEntry[]> {
    return [...db().moderationLog]
  },
  async getUserModeration(userId: ID): Promise<UserModerationState> {
    return db().userModeration.find((u) => u.userId === userId) ?? { userId, banned: false, warnings: 0 }
  },
  async moderateUser(userId: ID, action: 'ban' | 'unban' | 'warn'): Promise<UserModerationState> {
    let s = db().userModeration.find((u) => u.userId === userId)
    if (!s) { s = { userId, banned: false, warnings: 0 }; db().userModeration.push(s) }
    const i = db().userModeration.indexOf(s)
    if (action === 'ban') s = { ...s, banned: true, bannedAt: now() }
    else if (action === 'unban') s = { ...s, banned: false, bannedAt: undefined }
    else s = { ...s, warnings: s.warnings + 1 }
    db().userModeration[i] = s
    persist()
    return s
  },
  async listFeatured(): Promise<FeaturedSlot[]> {
    return [...db().featured].sort((a, b) => a.position - b.position)
  },
  async upsertFeatured(slot: FeaturedSlot): Promise<FeaturedSlot> {
    const i = db().featured.findIndex((f) => f.id === slot.id)
    if (i < 0) db().featured.push(slot)
    else db().featured[i] = slot
    persist()
    return slot
  },
  async toggleFeatured(id: ID): Promise<void> {
    const i = db().featured.findIndex((f) => f.id === id)
    if (i >= 0) { db().featured[i] = { ...db().featured[i], active: !db().featured[i].active }; persist() }
  },
  async removeFeatured(id: ID): Promise<void> {
    db().featured = db().featured.filter((f) => f.id !== id)
    persist()
  },

  // ── #25 YouTube ─────────────────────────────────────────────────────────
  async youtubeConnection(): Promise<YouTubeConnection> {
    return { ...db().youtube }
  },
  setYouTubeConnection(conn: YouTubeConnection): void {
    db().youtube = conn
    persist()
  },
  async disconnectYouTube(): Promise<void> {
    db().youtube = { connected: false }
    db().importedVideos = []
    persist()
  },
  async listImportedVideos(): Promise<YouTubeVideo[]> {
    return [...db().importedVideos]
  },
  setImportedVideos(videos: YouTubeVideo[]): void {
    db().importedVideos = videos
    persist()
  },
  markVideoImported(id: string): void {
    const i = db().importedVideos.findIndex((v) => v.id === id)
    if (i >= 0) { db().importedVideos[i] = { ...db().importedVideos[i], imported: true }; persist() }
  },

  // ── #41 Clips / shorts composer ─────────────────────────────────────────
  async listShorts(teacherId?: ID): Promise<ShortClip[]> {
    const tid = teacherId ?? me()
    return db().shorts.filter((s) => s.teacherId === tid).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async upsertShort(clip: ShortClip): Promise<ShortClip> {
    const i = db().shorts.findIndex((s) => s.id === clip.id)
    if (i < 0) db().shorts.unshift(clip)
    else db().shorts[i] = clip
    persist()
    return clip
  },
  async publishShort(id: ID): Promise<void> {
    const i = db().shorts.findIndex((s) => s.id === id)
    if (i >= 0) { db().shorts[i] = { ...db().shorts[i], status: 'published' }; persist() }
  },
  async deleteShort(id: ID): Promise<void> {
    db().shorts = db().shorts.filter((s) => s.id !== id)
    persist()
  },

  // ── #35 Offline downloads + sync ────────────────────────────────────────
  async listDownloads(): Promise<DownloadItem[]> {
    return [...db().downloads].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  },
  async addDownload(kind: DownloadKind, refId: ID, title: string, sizeMb: number): Promise<DownloadItem> {
    const existing = db().downloads.find((d) => d.refId === refId && d.kind === kind)
    if (existing) return existing
    const item: DownloadItem = { id: newId('dl'), kind, refId, title, sizeMb, status: 'downloading', progress: 0, addedAt: now() }
    db().downloads.unshift(item)
    persist()
    return item
  },
  /** Advance any in-flight downloads. UI calls this on an interval to animate. */
  tickDownloads(stepPct = 12): boolean {
    let changed = false
    db().downloads = db().downloads.map((d) => {
      if (d.status !== 'downloading') return d
      changed = true
      const progress = Math.min(100, d.progress + stepPct)
      return { ...d, progress, status: progress >= 100 ? 'ready' : 'downloading' }
    })
    if (changed) persist()
    return db().downloads.some((d) => d.status === 'downloading')
  },
  async removeDownload(id: ID): Promise<void> {
    db().downloads = db().downloads.filter((d) => d.id !== id)
    persist()
  },
  async syncState(): Promise<{ deviceId: ID; lastSyncedAt?: string; pendingChanges: number; devices: DeviceInfo[] }> {
    // Only the REAL current device. Cross-device sync needs a cloud backend that
    // isn't wired up yet, so we never invent phantom phones/tablets.
    const devices: DeviceInfo[] = [
      { id: db().deviceId, name: 'This computer', platform: 'Windows · Desktop', lastSeenAt: now(), current: true }
    ]
    return { deviceId: db().deviceId, lastSyncedAt: db().lastSyncedAt, pendingChanges: db().downloads.filter((d) => d.status === 'ready').length, devices }
  },
  async syncNow(): Promise<string> {
    const ts = now()
    db().lastSyncedAt = ts
    persist()
    return ts
  }
}

export type Studio = typeof studio
