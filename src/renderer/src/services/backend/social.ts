/**
 * Social-slice backend — the domains that live alongside the core `Backend`
 * contract but that only the community / tutors / feedback / profile pages use:
 *
 *   • Tutors + bookings + tutor reviews          (#20)
 *   • Peer feedback exchange + karma economy     (#17)
 *   • Challenge leaderboards + mega-search        (#29)
 *   • Derived profile artefacts: certificates / skill radar / badges  (#22)
 *
 * Kept out of services/backend/types.ts on purpose: that contract is edited by
 * every feature session, so a separate module keeps the social slice
 * conflict-free. Same swap discipline though — a local (localStorage) impl and a
 * Supabase impl behind one `SocialBackend` interface, picked by the same
 * VITE_USE_SUPABASE flag as the core backend.
 *
 * Tutor/booking/feedback rows are owned here (localStorage key
 * `speakai.social.v1`). Certificates / skill radar / badges / leaderboards /
 * search are *derived* — computed live from the core `backend` (enrollments,
 * exam attempts, stats, activity, courses, users, groups, posts) + the clips
 * catalogue, so they always reflect real state and need no storage of their own.
 */
import type {
  Badge,
  Booking,
  BookingStatus,
  Certificate,
  Course,
  FeedbackSubmission,
  Group,
  KarmaWallet,
  LeaderboardRow,
  PeerReview,
  PlatformUser,
  Post,
  SearchResults,
  SkillRadar,
  TargetLanguage,
  TutorProfile,
  TutorReview,
  UserStats
} from '@shared/types'
import { CLIPS } from '../../features/clips/data'
import { backend, backendKind } from './index'
import { getSupabaseClient } from './client'
import {
  SEED_TUTORS,
  SEED_TUTOR_REVIEWS,
  SEED_FEEDBACK,
  SEED_PEER_REVIEWS,
  SEED_GROUPS,
  SEED_GROUP_MEMBERS,
  SEED_CHALLENGES,
  SEED_CHALLENGE_PROGRESS
} from './social-seed'

// ─── Contract ────────────────────────────────────────────────────────────────

export interface TutorFilter {
  kind?: 'pro' | 'community'
  language?: string
  q?: string
  onlineOnly?: boolean
  maxPrice?: number
}

export interface SocialBackend {
  // Tutors
  listTutors(filter?: TutorFilter): Promise<TutorProfile[]>
  getTutor(id: string): Promise<TutorProfile | null>
  listTutorReviews(tutorId: string): Promise<TutorReview[]>
  createTutorReview(input: Omit<TutorReview, 'id' | 'createdAt'>): Promise<TutorReview>
  createBooking(input: Omit<Booking, 'id' | 'createdAt' | 'status'> & { status?: BookingStatus }): Promise<Booking>
  myBookings(studentId: string): Promise<Booking[]>
  tutorBookings(tutorId: string): Promise<Booking[]>
  updateBookingStatus(id: string, status: BookingStatus): Promise<Booking>

  // Feedback exchange
  listFeedback(filter?: { kind?: 'writing' | 'speaking'; status?: 'open' | 'reviewed'; excludeAuthor?: string }): Promise<FeedbackSubmission[]>
  getFeedback(id: string): Promise<FeedbackSubmission | null>
  myFeedback(userId: string): Promise<FeedbackSubmission[]>
  createFeedback(input: Omit<FeedbackSubmission, 'id' | 'createdAt' | 'status' | 'reviewCount'>): Promise<FeedbackSubmission>
  listPeerReviews(submissionId: string): Promise<PeerReview[]>
  /** Reviews other people left on *my* submissions (the "received" tab). */
  reviewsForMe(userId: string): Promise<{ review: PeerReview; submission: FeedbackSubmission }[]>
  createPeerReview(input: Omit<PeerReview, 'id' | 'createdAt' | 'thanked'>): Promise<{ review: PeerReview; karma: KarmaWallet }>
  thankReview(reviewId: string): Promise<void>
  getKarma(userId: string): Promise<KarmaWallet>

  // Community extras
  challengeLeaderboard(challengeId: string): Promise<LeaderboardRow[]>
  search(query: string, opts?: { limit?: number }): Promise<SearchResults>

  // Profile-derived (#22)
  listCertificates(userId: string): Promise<Certificate[]>
  getSkillRadar(userId: string): Promise<SkillRadar>
  listBadges(userId: string): Promise<Badge[]>
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

const newId = (prefix: string): string => `${prefix}_${Math.random().toString(36).slice(2, 10)}`
const now = (): string => new Date().toISOString()
const dayKey = (iso: string): string => iso.slice(0, 10)
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)))

/** Free submissions a user gets per day before karma is required. */
const FREE_SUBMISSIONS_PER_DAY = 2
/** Karma cost to submit a piece for review. */
const SUBMIT_COST = 5

// ─── Derived computations (shared by both impls) ─────────────────────────────

const COVERS = [
  'from-rose-500 to-pink-700',
  'from-sky-500 to-blue-700',
  'from-violet-500 to-purple-700',
  'from-amber-500 to-orange-700',
  'from-emerald-500 to-teal-700',
  'from-fuchsia-500 to-rose-700'
]

async function computeCertificates(userId: string): Promise<Certificate[]> {
  const out: Certificate[] = []
  const enrollments = await backend.myEnrollments(userId)
  for (const e of enrollments) {
    if (e.progress < 100 && !e.completedAt) continue
    const course = await backend.getCourse(e.courseId)
    if (!course) continue
    out.push({
      id: `cert_course_${course.id}`,
      userId,
      source: 'course',
      title: course.title,
      detail: `${course.level} · ${course.hours}h course`,
      issuedAt: e.completedAt ?? e.lastActiveAt,
      cover: course.cover,
      score: 'Completed'
    })
  }
  const attempts = await backend.listExamAttempts(userId)
  attempts.forEach((a, i) => {
    out.push({
      id: `cert_exam_${a.id}`,
      userId,
      source: 'exam',
      title: `${a.kind.toUpperCase()} result`,
      detail: a.cefr ? `${a.cefr} · overall ${a.overall}` : `Overall ${a.overall}`,
      issuedAt: a.takenAt,
      cover: COVERS[i % COVERS.length],
      score: String(a.overall)
    })
  })
  return out.sort((x, y) => y.issuedAt.localeCompare(x.issuedAt))
}

async function computeSkillRadar(userId: string): Promise<SkillRadar> {
  // Derive a 5-axis radar from real signals: exam section scores when present,
  // otherwise a stable heuristic off the user's lifetime stats so the pentagon
  // still moves as they practise. All axes are 0–100.
  const stats = await backend.getStats(userId).catch(() => null)
  const attempts = await backend.listExamAttempts(userId).catch(() => [])
  const base = stats ? clamp(40 + Math.log2(stats.xp + 1) * 6) : 45

  // Average any matching exam sections across attempts.
  const sectionAvg = (keys: string[]): number | null => {
    const vals: number[] = []
    for (const a of attempts) {
      for (const k of Object.keys(a.sections)) {
        if (keys.some((want) => k.toLowerCase().includes(want))) {
          // Normalise: IELTS bands 0–9 → %, others assume already 0–100-ish.
          const v = a.sections[k]
          vals.push(v <= 9 ? (v / 9) * 100 : Math.min(100, v))
        }
      }
    }
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }

  const wordsBoost = stats ? Math.min(30, stats.wordsLearned / 10) : 0
  const lessonsBoost = stats ? Math.min(25, stats.lessonsCompleted * 2) : 0

  return {
    userId,
    pronunciation: clamp(sectionAvg(['speak', 'pronun']) ?? base + 3),
    fluency: clamp(sectionAvg(['speak', 'fluen']) ?? base + lessonsBoost - 4),
    grammar: clamp(sectionAvg(['writ', 'grammar']) ?? base + lessonsBoost),
    intonation: clamp(sectionAvg(['speak', 'inton']) ?? base - 2),
    vocabulary: clamp(sectionAvg(['read', 'vocab']) ?? base + wordsBoost)
  }
}

function badgeDefs(stats: UserStats | null, social: { reviewsGiven: number; postsMade: number }, certs: number): Badge[] {
  const s = stats
  const milestone = (
    id: string,
    title: string,
    description: string,
    emoji: string,
    category: Badge['category'],
    have: number,
    need: number
  ): Badge => ({
    id,
    title,
    description,
    emoji,
    category,
    earned: have >= need,
    progress: clamp((have / need) * 100)
  })

  return [
    milestone('streak7', '7-day streak', 'Practise 7 days in a row', '🔥', 'streak', s?.streak ?? 0, 7),
    milestone('streak30', '30-day streak', 'A full month, every day', '⚡', 'streak', s?.longestStreak ?? 0, 30),
    milestone('words100', 'Word collector', 'Learn 100 words', '📚', 'words', s?.wordsLearned ?? 0, 100),
    milestone('words500', 'Lexicon', 'Learn 500 words', '🧠', 'words', s?.wordsLearned ?? 0, 500),
    milestone('lessons10', 'Getting started', 'Finish 10 lessons', '🎯', 'lessons', s?.lessonsCompleted ?? 0, 10),
    milestone('xp1000', 'Rising star', 'Earn 1,000 XP', '🌟', 'milestone', s?.xp ?? 0, 1000),
    milestone('reviews5', 'Helpful peer', 'Review 5 submissions', '🤝', 'social', social.reviewsGiven, 5),
    milestone('posts3', 'Community voice', 'Make 3 posts', '💬', 'social', social.postsMade, 3),
    milestone('cert1', 'Certified', 'Earn your first certificate', '🏅', 'exam', certs, 1)
  ]
}

async function computeBadges(userId: string): Promise<Badge[]> {
  const [stats, reviews, posts, certs] = await Promise.all([
    backend.getStats(userId).catch(() => null),
    socialLocal.reviewsGivenCount(userId).catch(() => 0),
    backend.listFeed({ limit: 200 }).then((p) => p.filter((x) => x.authorId === userId).length).catch(() => 0),
    computeCertificates(userId).then((c) => c.length).catch(() => 0)
  ])
  return badgeDefs(stats, { reviewsGiven: reviews, postsMade: posts }, certs)
}

async function computeLeaderboard(challengeId: string): Promise<LeaderboardRow[]> {
  const challenge = await backend.getChallenge(challengeId)
  if (!challenge) return []
  // Pull every participant by reading myChallenges across users is overkill;
  // the core backend exposes participants via the challenge participant store
  // indirectly — we reconstruct from the per-user `myChallenges`. To stay within
  // the public contract we read all users then their participation.
  const users = await backend.listUsers()
  const rows: LeaderboardRow[] = []
  for (const u of users) {
    const mine = await backend.myChallenges(u.id)
    const hit = mine.find((m) => m.challenge.id === challengeId)
    if (!hit) continue
    rows.push({
      userId: u.id,
      name: u.name,
      avatarEmoji: u.avatarEmoji ?? '🙂',
      country: u.country,
      progress: hit.participant.progress,
      pct: clamp((hit.participant.progress / challenge.goal) * 100),
      completed: !!hit.participant.completedAt
    })
  }
  return rows.sort((a, b) => b.progress - a.progress)
}

async function computeSearch(query: string, limit = 8): Promise<SearchResults> {
  const q = query.trim().toLowerCase()
  const empty: SearchResults = { query, courses: [], users: [], groups: [], posts: [], lessons: [], clips: [], total: 0 }
  if (!q) return empty

  const [courses, users, groups, posts] = await Promise.all([
    backend.listCourses({ q: query }).catch(() => [] as Course[]),
    backend.listUsers({ q: query, limit }).catch(() => [] as PlatformUser[]),
    backend.listGroups({ q: query }).catch(() => [] as Group[]),
    backend.listFeed({ limit: 200 }).catch(() => [] as Post[])
  ])

  const matchedPosts = posts.filter((p) => p.text.toLowerCase().includes(q)).slice(0, limit)

  // Lessons across all (published) courses.
  const lessonHits: SearchResults['lessons'] = []
  for (const c of courses.slice(0, 6)) {
    const units = await backend.listUnits(c.id).catch(() => [])
    for (const u of units) {
      const lessons = await backend.listLessons(u.id).catch(() => [])
      for (const l of lessons) {
        if (l.title.toLowerCase().includes(q)) {
          lessonHits.push({ lessonId: l.id, title: l.title, courseId: c.id, courseTitle: c.title, kind: l.kind })
        }
      }
    }
    if (lessonHits.length >= limit) break
  }

  const clipHits = CLIPS.filter(
    (c) => c.title.toLowerCase().includes(q) || c.artist.toLowerCase().includes(q)
  )
    .slice(0, limit)
    .map((c) => ({ id: c.id, title: c.title, artist: c.artist, kind: c.kind, cover: c.cover, level: c.level }))

  const courseHits = courses.slice(0, limit)
  const total =
    courseHits.length + users.length + groups.length + matchedPosts.length + lessonHits.length + clipHits.length

  return {
    query,
    courses: courseHits,
    users,
    groups,
    posts: matchedPosts,
    lessons: lessonHits.slice(0, limit),
    clips: clipHits,
    total
  }
}

// ─── Local (localStorage) implementation ─────────────────────────────────────

const LS_KEY = 'speakai.social.v1'

interface SocialDb {
  tutors: TutorProfile[]
  tutorReviews: TutorReview[]
  bookings: Booking[]
  feedback: FeedbackSubmission[]
  peerReviews: PeerReview[]
  karma: KarmaWallet[]
}

function emptySocialDb(): SocialDb {
  return {
    tutors: [...SEED_TUTORS],
    tutorReviews: [...SEED_TUTOR_REVIEWS],
    bookings: [],
    feedback: [...SEED_FEEDBACK],
    peerReviews: [...SEED_PEER_REVIEWS],
    karma: []
  }
}

let cache: SocialDb | null = null
function sdb(): SocialDb {
  if (cache) return cache
  if (typeof window === 'undefined' || !window.localStorage) {
    cache = emptySocialDb()
    return cache
  }
  const raw = window.localStorage.getItem(LS_KEY)
  if (!raw) {
    cache = emptySocialDb()
    persist()
    return cache
  }
  try {
    cache = JSON.parse(raw) as SocialDb
  } catch {
    cache = emptySocialDb()
    persist()
  }
  return cache
}
function persist(): void {
  if (cache && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(cache))
    } catch {
      /* quota */
    }
  }
}

function freshKarma(userId: string): KarmaWallet {
  return { userId, balance: 50, earnedTotal: 50, spentTotal: 0, submittedToday: 0, updatedAt: now() }
}

function getKarmaRow(userId: string): KarmaWallet {
  const db = sdb()
  let w = db.karma.find((k) => k.userId === userId)
  if (!w) {
    w = freshKarma(userId)
    db.karma.push(w)
    persist()
  }
  // Reset the daily submission counter on a new day.
  if (w.lastSubmitDay && w.lastSubmitDay !== dayKey(now())) {
    w.submittedToday = 0
  }
  return w
}

interface LocalSocial extends SocialBackend {
  /** Internal helper used by badge computation. */
  reviewsGivenCount(userId: string): Promise<number>
}

const socialLocal: LocalSocial = {
  async listTutors(filter): Promise<TutorProfile[]> {
    let list = [...sdb().tutors]
    if (filter?.kind) list = list.filter((t) => t.kind === filter.kind)
    if (filter?.onlineOnly) list = list.filter((t) => t.online)
    if (filter?.maxPrice != null) list = list.filter((t) => t.hourlyRateUsd <= filter.maxPrice!)
    if (filter?.language) {
      const l = filter.language.toLowerCase()
      list = list.filter((t) => t.teaches.some((x) => x.toLowerCase().includes(l)))
    }
    if (filter?.q) {
      const q = filter.q.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.headline.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => b.rating - a.rating)
  },

  async getTutor(id): Promise<TutorProfile | null> {
    return sdb().tutors.find((t) => t.id === id) ?? null
  },

  async listTutorReviews(tutorId): Promise<TutorReview[]> {
    return sdb()
      .tutorReviews.filter((r) => r.tutorId === tutorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async createTutorReview(input): Promise<TutorReview> {
    const review: TutorReview = { ...input, id: newId('trv'), createdAt: now() }
    sdb().tutorReviews.unshift(review)
    // Recompute tutor rating + count.
    const ti = sdb().tutors.findIndex((t) => t.id === input.tutorId)
    if (ti >= 0) {
      const all = sdb().tutorReviews.filter((r) => r.tutorId === input.tutorId)
      const avg = all.reduce((s, r) => s + r.rating, 0) / all.length
      sdb().tutors[ti] = { ...sdb().tutors[ti], rating: Math.round(avg * 10) / 10, reviewCount: all.length }
    }
    persist()
    return review
  },

  async createBooking(input): Promise<Booking> {
    const booking: Booking = {
      ...input,
      id: newId('bk'),
      status: input.status ?? (input.kind === 'instant' ? 'confirmed' : 'pending'),
      createdAt: now()
    }
    sdb().bookings.unshift(booking)
    const ti = sdb().tutors.findIndex((t) => t.id === input.tutorId)
    if (ti >= 0) sdb().tutors[ti] = { ...sdb().tutors[ti], lessonsGiven: sdb().tutors[ti].lessonsGiven + 1 }
    persist()
    // Notify the student so it shows in their bell.
    void backend
      .createNotif({
        userId: input.studentId,
        type: 'learning',
        title: input.kind === 'instant' ? 'Call starting' : 'Lesson booked',
        body: `${booking.kind === 'trial' ? 'Free trial' : 'Lesson'} with your tutor — ${new Date(booking.startISO).toLocaleString()}`,
        link: '/tutors'
      })
      .catch(() => undefined)
    return booking
  },

  async myBookings(studentId): Promise<Booking[]> {
    return sdb()
      .bookings.filter((b) => b.studentId === studentId)
      .sort((a, b) => b.startISO.localeCompare(a.startISO))
  },

  async tutorBookings(tutorId): Promise<Booking[]> {
    return sdb()
      .bookings.filter((b) => b.tutorId === tutorId)
      .sort((a, b) => b.startISO.localeCompare(a.startISO))
  },

  async updateBookingStatus(id, status): Promise<Booking> {
    const i = sdb().bookings.findIndex((b) => b.id === id)
    if (i < 0) throw new Error(`Booking not found: ${id}`)
    sdb().bookings[i] = { ...sdb().bookings[i], status }
    persist()
    return sdb().bookings[i]
  },

  async listFeedback(filter): Promise<FeedbackSubmission[]> {
    let list = [...sdb().feedback]
    if (filter?.kind) list = list.filter((f) => f.kind === filter.kind)
    if (filter?.status) list = list.filter((f) => f.status === filter.status)
    if (filter?.excludeAuthor) list = list.filter((f) => f.authorId !== filter.excludeAuthor)
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async getFeedback(id): Promise<FeedbackSubmission | null> {
    return sdb().feedback.find((f) => f.id === id) ?? null
  },

  async myFeedback(userId): Promise<FeedbackSubmission[]> {
    return sdb()
      .feedback.filter((f) => f.authorId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async createFeedback(input): Promise<FeedbackSubmission> {
    const wallet = getKarmaRow(input.authorId)
    const today = dayKey(now())
    const free = wallet.submittedToday < FREE_SUBMISSIONS_PER_DAY
    if (!free && wallet.balance < SUBMIT_COST) {
      throw new Error('Not enough karma — review a peer to earn more.')
    }
    const submission: FeedbackSubmission = {
      ...input,
      id: newId('fb'),
      status: 'open',
      reviewCount: 0,
      createdAt: now()
    }
    sdb().feedback.unshift(submission)
    // Charge karma (or consume a free slot).
    if (!free) {
      wallet.balance -= SUBMIT_COST
      wallet.spentTotal += SUBMIT_COST
    }
    wallet.submittedToday += 1
    wallet.lastSubmitDay = today
    wallet.updatedAt = now()
    persist()
    return submission
  },

  async listPeerReviews(submissionId): Promise<PeerReview[]> {
    return sdb()
      .peerReviews.filter((r) => r.submissionId === submissionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async reviewsForMe(userId): Promise<{ review: PeerReview; submission: FeedbackSubmission }[]> {
    const mine = sdb().feedback.filter((f) => f.authorId === userId)
    const ids = new Set(mine.map((f) => f.id))
    return sdb()
      .peerReviews.filter((r) => ids.has(r.submissionId))
      .map((review) => ({ review, submission: mine.find((f) => f.id === review.submissionId)! }))
      .sort((a, b) => b.review.createdAt.localeCompare(a.review.createdAt))
  },

  async createPeerReview(input): Promise<{ review: PeerReview; karma: KarmaWallet }> {
    const review: PeerReview = { ...input, id: newId('pr'), thanked: false, createdAt: now() }
    sdb().peerReviews.unshift(review)
    // Bump the submission's review count + flip to "reviewed".
    const fi = sdb().feedback.findIndex((f) => f.id === input.submissionId)
    let reward = 10
    if (fi >= 0) {
      const sub = sdb().feedback[fi]
      reward = sub.reward
      sdb().feedback[fi] = { ...sub, reviewCount: sub.reviewCount + 1, status: 'reviewed' }
      // Notify the author.
      void backend
        .createNotif({
          userId: sub.authorId,
          type: 'social',
          title: 'New feedback on your work',
          body: `Someone reviewed "${sub.topic}"`,
          link: '/feedback'
        })
        .catch(() => undefined)
    }
    // Reward the reviewer's karma.
    const wallet = getKarmaRow(input.reviewerId)
    wallet.balance += reward
    wallet.earnedTotal += reward
    wallet.updatedAt = now()
    persist()
    return { review, karma: wallet }
  },

  async thankReview(reviewId): Promise<void> {
    const i = sdb().peerReviews.findIndex((r) => r.id === reviewId)
    if (i < 0) return
    sdb().peerReviews[i] = { ...sdb().peerReviews[i], thanked: true }
    // Bonus karma for a thanked review.
    const wallet = getKarmaRow(sdb().peerReviews[i].reviewerId)
    wallet.balance += 2
    wallet.earnedTotal += 2
    wallet.updatedAt = now()
    persist()
  },

  async getKarma(userId): Promise<KarmaWallet> {
    return { ...getKarmaRow(userId) }
  },

  async reviewsGivenCount(userId): Promise<number> {
    return sdb().peerReviews.filter((r) => r.reviewerId === userId).length
  },

  async challengeLeaderboard(challengeId): Promise<LeaderboardRow[]> {
    return computeLeaderboard(challengeId)
  },

  async search(query, opts): Promise<SearchResults> {
    return computeSearch(query, opts?.limit)
  },

  async listCertificates(userId): Promise<Certificate[]> {
    return computeCertificates(userId)
  },

  async getSkillRadar(userId): Promise<SkillRadar> {
    return computeSkillRadar(userId)
  },

  async listBadges(userId): Promise<Badge[]> {
    return computeBadges(userId)
  }
}

// ─── Supabase implementation ─────────────────────────────────────────────────
// Tutors / bookings / feedback / reviews / karma persist to dedicated tables.
// Derived data (certs / radar / badges / leaderboard / search) reuses the
// computations above, which already go through the (Supabase-backed) `backend`.

function sb() {
  return getSupabaseClient()
}

const t2t = (r: Record<string, unknown>): TutorProfile => ({
  id: r.id as string,
  userId: r.user_id as string,
  name: r.name as string,
  flag: r.flag as string,
  headline: r.headline as string,
  bio: r.bio as string,
  teaches: (r.teaches as string[]) ?? [],
  speaks: (r.speaks as TutorProfile['speaks']) ?? [],
  kind: r.kind as TutorProfile['kind'],
  hourlyRateUsd: Number(r.hourly_rate_usd ?? 0),
  rating: Number(r.rating ?? 0),
  reviewCount: Number(r.review_count ?? 0),
  lessonsGiven: Number(r.lessons_given ?? 0),
  studentsCount: Number(r.students_count ?? 0),
  videoIntroUrl: r.video_intro_url as string | undefined,
  trial: !!r.trial,
  online: !!r.online,
  tags: (r.tags as string[]) ?? [],
  cover: r.cover as string,
  availability: (r.availability as TutorProfile['availability']) ?? [],
  avatarEmoji: (r.avatar_emoji as string) ?? '🧑‍🏫',
  createdAt: r.created_at as string
})

const bk2bk = (r: Record<string, unknown>): Booking => ({
  id: r.id as string,
  tutorId: r.tutor_id as string,
  studentId: r.student_id as string,
  startISO: r.start_iso as string,
  durationMin: Number(r.duration_min ?? 30),
  kind: r.kind as Booking['kind'],
  status: r.status as Booking['status'],
  priceUsd: Number(r.price_usd ?? 0),
  note: r.note as string | undefined,
  createdAt: r.created_at as string
})

const fb2fb = (r: Record<string, unknown>): FeedbackSubmission => ({
  id: r.id as string,
  authorId: r.author_id as string,
  kind: r.kind as FeedbackSubmission['kind'],
  topic: r.topic as string,
  content: r.content as string,
  audioUrl: r.audio_url as string | undefined,
  language: r.language as TargetLanguage,
  level: r.level as string,
  reward: Number(r.reward ?? 10),
  status: r.status as FeedbackSubmission['status'],
  reviewCount: Number(r.review_count ?? 0),
  createdAt: r.created_at as string
})

const pr2pr = (r: Record<string, unknown>): PeerReview => ({
  id: r.id as string,
  submissionId: r.submission_id as string,
  reviewerId: r.reviewer_id as string,
  rating: Number(r.rating ?? 0),
  text: r.text as string,
  thanked: !!r.thanked,
  createdAt: r.created_at as string
})

const supabaseSocial: SocialBackend = {
  async listTutors(filter): Promise<TutorProfile[]> {
    let q = sb().from('tutors').select('*')
    if (filter?.kind) q = q.eq('kind', filter.kind)
    if (filter?.onlineOnly) q = q.eq('online', true)
    if (filter?.maxPrice != null) q = q.lte('hourly_rate_usd', filter.maxPrice)
    if (filter?.q) q = q.or(`name.ilike.%${filter.q}%,headline.ilike.%${filter.q}%`)
    const { data } = await q.order('rating', { ascending: false })
    return (data ?? []).map(t2t)
  },
  async getTutor(id): Promise<TutorProfile | null> {
    const { data } = await sb().from('tutors').select('*').eq('id', id).maybeSingle()
    return data ? t2t(data) : null
  },
  async listTutorReviews(tutorId): Promise<TutorReview[]> {
    const { data } = await sb().from('tutor_reviews').select('*').eq('tutor_id', tutorId).order('created_at', { ascending: false })
    return (data ?? []).map((r) => ({
      id: r.id, tutorId: r.tutor_id, studentId: r.student_id, rating: r.rating, text: r.text, createdAt: r.created_at
    }))
  },
  async createTutorReview(input): Promise<TutorReview> {
    const row = { id: newId('trv'), tutor_id: input.tutorId, student_id: input.studentId, rating: input.rating, text: input.text, created_at: now() }
    const { data, error } = await sb().from('tutor_reviews').insert(row).select().single()
    if (error) throw error
    return { id: data.id, tutorId: data.tutor_id, studentId: data.student_id, rating: data.rating, text: data.text, createdAt: data.created_at }
  },
  async createBooking(input): Promise<Booking> {
    const row = {
      id: newId('bk'), tutor_id: input.tutorId, student_id: input.studentId, start_iso: input.startISO,
      duration_min: input.durationMin, kind: input.kind, status: input.status ?? (input.kind === 'instant' ? 'confirmed' : 'pending'),
      price_usd: input.priceUsd, note: input.note ?? null, created_at: now()
    }
    const { data, error } = await sb().from('bookings').insert(row).select().single()
    if (error) throw error
    return bk2bk(data)
  },
  async myBookings(studentId): Promise<Booking[]> {
    const { data } = await sb().from('bookings').select('*').eq('student_id', studentId).order('start_iso', { ascending: false })
    return (data ?? []).map(bk2bk)
  },
  async tutorBookings(tutorId): Promise<Booking[]> {
    const { data } = await sb().from('bookings').select('*').eq('tutor_id', tutorId).order('start_iso', { ascending: false })
    return (data ?? []).map(bk2bk)
  },
  async updateBookingStatus(id, status): Promise<Booking> {
    const { data, error } = await sb().from('bookings').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return bk2bk(data)
  },
  async listFeedback(filter): Promise<FeedbackSubmission[]> {
    let q = sb().from('feedback_submissions').select('*')
    if (filter?.kind) q = q.eq('kind', filter.kind)
    if (filter?.status) q = q.eq('status', filter.status)
    if (filter?.excludeAuthor) q = q.neq('author_id', filter.excludeAuthor)
    const { data } = await q.order('created_at', { ascending: false })
    return (data ?? []).map(fb2fb)
  },
  async getFeedback(id): Promise<FeedbackSubmission | null> {
    const { data } = await sb().from('feedback_submissions').select('*').eq('id', id).maybeSingle()
    return data ? fb2fb(data) : null
  },
  async myFeedback(userId): Promise<FeedbackSubmission[]> {
    const { data } = await sb().from('feedback_submissions').select('*').eq('author_id', userId).order('created_at', { ascending: false })
    return (data ?? []).map(fb2fb)
  },
  async createFeedback(input): Promise<FeedbackSubmission> {
    const row = {
      id: newId('fb'), author_id: input.authorId, kind: input.kind, topic: input.topic, content: input.content,
      audio_url: input.audioUrl ?? null, language: input.language, level: input.level, reward: input.reward,
      status: 'open', review_count: 0, created_at: now()
    }
    const { data, error } = await sb().from('feedback_submissions').insert(row).select().single()
    if (error) throw error
    return fb2fb(data)
  },
  async listPeerReviews(submissionId): Promise<PeerReview[]> {
    const { data } = await sb().from('peer_reviews').select('*').eq('submission_id', submissionId).order('created_at', { ascending: false })
    return (data ?? []).map(pr2pr)
  },
  async reviewsForMe(userId): Promise<{ review: PeerReview; submission: FeedbackSubmission }[]> {
    const subs = await this.myFeedback(userId)
    const byId = new Map(subs.map((s) => [s.id, s]))
    if (!subs.length) return []
    const { data } = await sb().from('peer_reviews').select('*').in('submission_id', subs.map((s) => s.id))
    return (data ?? [])
      .map(pr2pr)
      .filter((r) => byId.has(r.submissionId))
      .map((review) => ({ review, submission: byId.get(review.submissionId)! }))
  },
  async createPeerReview(input): Promise<{ review: PeerReview; karma: KarmaWallet }> {
    const row = { id: newId('pr'), submission_id: input.submissionId, reviewer_id: input.reviewerId, rating: input.rating, text: input.text, thanked: false, created_at: now() }
    const { data, error } = await sb().from('peer_reviews').insert(row).select().single()
    if (error) throw error
    const sub = await this.getFeedback(input.submissionId)
    await sb().from('feedback_submissions').update({ status: 'reviewed', review_count: (sub?.reviewCount ?? 0) + 1 }).eq('id', input.submissionId)
    const karma = await this.getKarma(input.reviewerId)
    const reward = sub?.reward ?? 10
    const updated = { ...karma, balance: karma.balance + reward, earnedTotal: karma.earnedTotal + reward, updatedAt: now() }
    await sb().from('karma_wallets').upsert({ user_id: updated.userId, balance: updated.balance, earned_total: updated.earnedTotal, spent_total: updated.spentTotal, submitted_today: updated.submittedToday, last_submit_day: updated.lastSubmitDay ?? null, updated_at: updated.updatedAt })
    return { review: pr2pr(data), karma: updated }
  },
  async thankReview(reviewId): Promise<void> {
    await sb().from('peer_reviews').update({ thanked: true }).eq('id', reviewId)
  },
  async getKarma(userId): Promise<KarmaWallet> {
    const { data } = await sb().from('karma_wallets').select('*').eq('user_id', userId).maybeSingle()
    if (!data) {
      const fresh = freshKarma(userId)
      await sb().from('karma_wallets').upsert({ user_id: userId, balance: fresh.balance, earned_total: fresh.earnedTotal, spent_total: fresh.spentTotal, submitted_today: 0, updated_at: fresh.updatedAt })
      return fresh
    }
    return {
      userId: data.user_id, balance: data.balance, earnedTotal: data.earned_total, spentTotal: data.spent_total,
      submittedToday: data.submitted_today ?? 0, lastSubmitDay: data.last_submit_day ?? undefined, updatedAt: data.updated_at
    }
  },
  async challengeLeaderboard(challengeId): Promise<LeaderboardRow[]> {
    return computeLeaderboard(challengeId)
  },
  async search(query, opts): Promise<SearchResults> {
    return computeSearch(query, opts?.limit)
  },
  async listCertificates(userId): Promise<Certificate[]> {
    return computeCertificates(userId)
  },
  async getSkillRadar(userId): Promise<SkillRadar> {
    return computeSkillRadar(userId)
  },
  async listBadges(userId): Promise<Badge[]> {
    return computeBadges(userId)
  }
}

export const social: SocialBackend = backendKind === 'supabase' ? supabaseSocial : socialLocal

// ─── First-run community seeding ─────────────────────────────────────────────
// Groups + challenges live in the *core* backend (shared by every session), but
// that store ships them empty. Rather than edit the shared seed.ts (which other
// feature sessions also touch), we populate them once via the public contract.
// Idempotent: a no-op once groups/challenges exist. Safe to call on every mount.

/**
 * The viewer's id. Real auth sets a current user on boot; if we're somewhere
 * that hasn't (e.g. the standalone browser preview before bootstrap runs), fall
 * back to a canonical seed student so social pages still have a real identity to
 * read/write against rather than crashing on a null id.
 */
export const meId = (): string => backend.currentUserId() ?? 'u_priya'

let seedingPromise: Promise<void> | null = null

export function ensureCommunitySeed(): Promise<void> {
  if (seedingPromise) return seedingPromise
  seedingPromise = (async () => {
    try {
      const groups = await backend.listGroups()
      if (groups.length === 0) {
        for (const g of SEED_GROUPS) await backend.upsertGroup(g)
        for (const m of SEED_GROUP_MEMBERS) await backend.joinGroup(m.userId, m.groupId).catch(() => undefined)
      }
      const challenges = await backend.listChallenges()
      if (challenges.length === 0) {
        for (const c of SEED_CHALLENGES) await backend.upsertChallenge(c)
        for (const p of SEED_CHALLENGE_PROGRESS) {
          await backend.joinChallenge(p.userId, p.challengeId).catch(() => undefined)
          await backend.updateChallengeProgress(p.userId, p.challengeId, p.progress).catch(() => undefined)
        }
      }
    } catch {
      /* best-effort — pages still render with whatever exists */
    }
  })()
  return seedingPromise
}

const dmSeedDone = new Set<string>()

/**
 * Give a viewer a populated inbox on first open: a couple of starter threads
 * with seed teachers/buddies, with the *other* party as the sender so the
 * messages render as incoming (and leave an unread badge). Idempotent per user
 * and a no-op once the user already has any thread.
 */
export async function ensureDmSeed(userId: string): Promise<void> {
  if (dmSeedDone.has(userId)) return
  dmSeedDone.add(userId)
  try {
    const existing = await backend.listThreads(userId)
    if (existing.length > 0) return
    const starters: { partner: string; lines: string[] }[] = [
      {
        partner: 'u_james',
        lines: [
          'Hey! Ready to push for band 7 this week? 💪',
          "Send me a Part 2 recording and I'll mark it tonight 🙏"
        ]
      },
      {
        partner: 'u_emma',
        lines: ['Welcome to the community! Ask me anything about Business English.']
      },
      {
        partner: 'u_wei',
        lines: ['Hi! Want to be speaking-streak buddies? 🔥']
      }
    ]
    for (const s of starters) {
      if (s.partner === userId) continue
      const thread = await backend.getOrCreateThread(userId, s.partner)
      for (const text of s.lines) {
        await backend.sendMessage({ threadId: thread.id, senderId: s.partner, text })
      }
    }
  } catch {
    /* best-effort */
  }
}

const learnerSeedDone = new Set<string>()

/**
 * Seed a little real learning history so the profile's derived data (streak,
 * XP, certificates, badges, activity timeline) reflects actual backend state
 * instead of being empty. Guarded: only runs when the user has *no* activity
 * and *no* enrollments, so it never double-counts with another session's seed.
 */
export async function ensureLearnerSeed(userId: string): Promise<void> {
  if (learnerSeedDone.has(userId)) return
  learnerSeedDone.add(userId)
  try {
    const [activity, enrollments] = await Promise.all([
      backend.listActivity(userId, { limit: 1 }),
      backend.myEnrollments(userId)
    ])
    if (activity.length > 0 || enrollments.length > 0) return

    // A handful of recent activity events → gives streak / xp / words / lessons.
    const events: { kind: Parameters<typeof backend.recordActivity>[0]['kind']; xp: number; minutes?: number; meta?: Record<string, unknown> }[] = [
      { kind: 'lesson_complete', xp: 40, minutes: 12, meta: { lesson: 'Greetings' } },
      { kind: 'word_learned', xp: 20, minutes: 6, meta: { count: 18 } },
      { kind: 'speaking_session', xp: 30, minutes: 10 },
      { kind: 'practice_session', xp: 25, minutes: 8 },
      { kind: 'lesson_complete', xp: 40, minutes: 14, meta: { lesson: 'Past tenses' } }
    ]
    for (const e of events) {
      await backend.recordActivity({ userId, language: 'en', ...e })
    }

    // Enroll in two courses; complete one → a real certificate.
    const courses = await backend.listCourses()
    const free = courses.find((c) => c.pricing.kind === 'free') ?? courses[0]
    const other = courses.find((c) => c.id !== free?.id)
    if (free) {
      await backend.enroll(userId, free.id)
      await backend.setEnrollmentProgress(userId, free.id, 100)
    }
    if (other) {
      await backend.enroll(userId, other.id)
      await backend.setEnrollmentProgress(userId, other.id, 45)
    }

    // One exam attempt → a certificate + skill-radar signal.
    await backend.recordExamAttempt({
      userId,
      kind: 'ielts',
      language: 'en',
      overall: 6.5,
      sections: { listening: 7, reading: 6.5, writing: 6, speaking: 6.5 },
      cefr: 'B2',
      feedback: 'Strong listening; tighten essay structure and linking words.',
      durationMin: 165
    })
  } catch {
    /* best-effort */
  }
}

/** One call pages can fire on mount to populate everything social. */
export async function ensureSocialBootstrap(userId = meId()): Promise<void> {
  await Promise.all([ensureCommunitySeed(), ensureDmSeed(userId), ensureLearnerSeed(userId)])
}
