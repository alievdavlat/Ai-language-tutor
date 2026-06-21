/**
 * Real Supabase implementation of the Backend contract.
 *
 * Maps the JS-side camelCase fields (defined in shared/types/platform.types.ts)
 * to the Postgres-side snake_case columns (defined in
 * supabase/migrations/0001_initial.sql).
 *
 * Flipped on by VITE_USE_SUPABASE=1 in .env.local. See services/backend/index.ts.
 */
import { type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from './client'
import type {
  ActivityEvent,
  Challenge,
  ChallengeParticipant,
  Comment,
  CommentView,
  Course,
  DmMessage,
  DmThread,
  Enrollment,
  ExamAttempt,
  Follow,
  Group,
  GroupMember,
  GroupMessage,
  Lesson,
  Like,
  LiveAnnouncement,
  LiveStream,
  MediaAsset,
  Notif,
  PlatformUser,
  Poll,
  Post,
  Review,
  Save,
  Unit,
  UserStats,
  VocabItem
} from '@shared/types'
import type { Backend, CourseFilter, ID } from './types'
import { computeStats } from './stats'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  // Surfacing this early — the index.ts factory will not pick supabaseBackend
  // unless these are defined, so this should never throw at runtime.
  console.warn('[supabase] missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// The client itself is lazily constructed in ./client. The index.ts factory only
// selects supabaseBackend when both env vars are present, so it's created on first
// use — never during the standalone browser preview. See services/backend/index.ts.
const sb = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

// ─── Row ↔ object mappers ──────────────────────────────────────────────────

const u2u = (r: Record<string, unknown>): PlatformUser => ({
  id: r.id as string,
  name: r.name as string,
  email: r.email as string,
  role: r.role as PlatformUser['role'],
  avatarEmoji: r.avatar_emoji as string | undefined,
  bio: r.bio as string | undefined,
  nativeLanguage: r.native_language as string,
  targetLanguage: r.target_language as PlatformUser['targetLanguage'],
  level: r.level as PlatformUser['level'],
  country: r.country as string | undefined,
  avatarUrl: r.avatar_url as string | undefined,
  bannerUrl: r.banner_url as string | undefined,
  createdAt: r.created_at as string
})

const c2c = (r: Record<string, unknown>): Course => ({
  id: r.id as string,
  teacherId: r.teacher_id as string,
  title: r.title as string,
  description: r.description as string,
  about: r.about as string | undefined,
  level: r.level as string,
  targetLanguage: r.target_language as Course['targetLanguage'],
  cover: r.cover as string,
  thumbnailUrl: (r.thumbnail_url as string | null) ?? undefined,
  bannerUrl: (r.banner_url as string | null) ?? undefined,
  pricing: r.pricing as Course['pricing'],
  rating: Number(r.rating ?? 0),
  reviewCount: r.review_count as number,
  enrollmentCount: r.enrollment_count as number,
  hours: r.hours as number,
  publishedAt: r.published_at as string | undefined,
  capstone: r.capstone as string | undefined,
  contentHash: r.content_hash as string | undefined
})

const e2e = (r: Record<string, unknown>): Enrollment => ({
  userId: r.user_id as string,
  courseId: r.course_id as string,
  progress: r.progress as number,
  lastActiveAt: r.last_active_at as string,
  enrolledAt: r.enrolled_at as string,
  completedAt: r.completed_at as string | undefined
})

const p2p = (r: Record<string, unknown>): Post => ({
  id: r.id as string,
  authorId: r.author_id as string,
  kind: r.kind as Post['kind'],
  text: r.text as string,
  resource: r.resource as Post['resource'],
  poll: r.poll as Post['poll'],
  studySession: r.study_session as Post['studySession'],
  achievement: r.achievement as Post['achievement'],
  voice: r.voice as Post['voice'],
  groupId: (r.group_id as string | null) ?? undefined,
  reactions: (r.reactions as Record<string, number>) ?? {},
  likeCount: r.like_count as number,
  commentCount: r.comment_count as number,
  shareCount: r.share_count as number,
  createdAt: r.created_at as string
})

const u2unit = (r: Record<string, unknown>): Unit => ({
  id: r.id as string,
  courseId: r.course_id as string,
  index: r.index as number,
  title: r.title as string,
  about: r.about as string | undefined
})

const l2l = (r: Record<string, unknown>): Lesson => ({
  id: r.id as string,
  unitId: r.unit_id as string,
  index: r.index as number,
  title: r.title as string,
  kind: r.kind as Lesson['kind'],
  videoUrl: r.video_url as string | undefined,
  durationMin: r.duration_min as number | undefined,
  dripDays: r.drip_days as number | undefined,
  content: r.content as Lesson['content']
})

const s2s = (r: Record<string, unknown>): LiveStream => ({
  id: r.id as string,
  hostId: r.host_id as string,
  title: r.title as string,
  category: r.category as string,
  language: r.language as LiveStream['language'],
  viewerCount: r.viewer_count as number,
  startedAt: r.started_at as string,
  cover: r.cover as string,
  imageUrl: (r.image_url as string | null) ?? undefined
})

const a2a = (r: Record<string, unknown>): LiveAnnouncement => ({
  id: r.id as string,
  teacherId: r.teacher_id as string,
  title: r.title as string,
  body: r.body as string,
  whenISO: r.when_iso as string,
  cover: r.cover as string,
  imageUrl: (r.image_url as string | null) ?? undefined
})

const n2n = (r: Record<string, unknown>): Notif => ({
  id: r.id as string,
  userId: r.user_id as string,
  type: r.type as Notif['type'],
  kind: (r.kind as Notif['kind']) ?? undefined,
  title: r.title as string,
  body: r.body as string,
  link: r.link as string | undefined,
  read: r.read as boolean,
  createdAt: r.created_at as string
})

const rv2rv = (r: Record<string, unknown>): Review => ({
  id: r.id as string,
  courseId: r.course_id as string,
  userId: r.user_id as string,
  rating: r.rating as number,
  text: r.text as string,
  createdAt: r.created_at as string
})

const g2g = (r: Record<string, unknown>): Group => ({
  id: r.id as string,
  name: r.name as string,
  description: r.description as string,
  language: r.language as Group['language'],
  ownerId: r.owner_id as string,
  cover: r.cover as string,
  imageUrl: (r.image_url as string | null) ?? undefined,
  visibility: r.visibility as Group['visibility'],
  memberCount: r.member_count as number,
  createdAt: r.created_at as string
})

const ch2ch = (r: Record<string, unknown>): Challenge => ({
  id: r.id as string,
  title: r.title as string,
  description: r.description as string,
  kind: r.kind as Challenge['kind'],
  goal: r.goal as number,
  language: r.language as Challenge['language'],
  createdBy: r.created_by as string,
  startsAt: r.starts_at as string,
  endsAt: r.ends_at as string,
  cover: r.cover as string,
  imageUrl: (r.image_url as string | null) ?? undefined,
  participantCount: r.participant_count as number,
  createdAt: r.created_at as string
})

const cp2cp = (r: Record<string, unknown>): ChallengeParticipant => ({
  challengeId: r.challenge_id as string,
  userId: r.user_id as string,
  progress: r.progress as number,
  completedAt: r.completed_at as string | undefined,
  joinedAt: r.joined_at as string
})

const ea2ea = (r: Record<string, unknown>): ExamAttempt => ({
  id: r.id as string,
  userId: r.user_id as string,
  kind: r.kind as ExamAttempt['kind'],
  language: r.language as ExamAttempt['language'],
  overall: Number(r.overall ?? 0),
  sections: (r.sections as Record<string, number>) ?? {},
  cefr: r.cefr as ExamAttempt['cefr'],
  feedback: r.feedback as string | undefined,
  durationMin: r.duration_min as number | undefined,
  takenAt: r.taken_at as string
})

const v2v = (r: Record<string, unknown>): VocabItem => ({
  id: r.id as string,
  userId: r.user_id as string,
  language: r.language as VocabItem['language'],
  term: r.term as string,
  translation: r.translation as string,
  example: r.example as string | undefined,
  deck: r.deck as string | undefined,
  due: r.due as string,
  stability: Number(r.stability ?? 0),
  difficulty: Number(r.difficulty ?? 0),
  elapsedDays: Number(r.elapsed_days ?? 0),
  scheduledDays: Number(r.scheduled_days ?? 0),
  reps: r.reps as number,
  lapses: r.lapses as number,
  state: r.state as VocabItem['state'],
  lastReviewedAt: r.last_reviewed_at as string | undefined,
  createdAt: r.created_at as string
})

const th2th = (r: Record<string, unknown>): DmThread => ({
  id: r.id as string,
  participantIds: (r.participant_ids as string[]) ?? [],
  lastMessageAt: r.last_message_at as string,
  lastMessageText: r.last_message_text as string | undefined,
  createdAt: r.created_at as string
})

const m2m = (r: Record<string, unknown>): DmMessage => ({
  id: r.id as string,
  threadId: r.thread_id as string,
  senderId: r.sender_id as string,
  text: r.text as string,
  attachment: r.attachment as DmMessage['attachment'],
  readBy: (r.read_by as string[]) ?? [],
  createdAt: r.created_at as string
})

const md2md = (r: Record<string, unknown>): MediaAsset => ({
  id: r.id as string,
  ownerId: r.owner_id as string,
  kind: r.kind as MediaAsset['kind'],
  url: r.url as string,
  name: r.name as string,
  sizeBytes: r.size_bytes as number,
  contentType: r.content_type as string | undefined,
  createdAt: r.created_at as string,
  contentHash: r.content_hash as string | undefined
})

const ac2ac = (r: Record<string, unknown>): ActivityEvent => ({
  id: r.id as string,
  userId: r.user_id as string,
  kind: r.kind as ActivityEvent['kind'],
  language: r.language as ActivityEvent['language'],
  meta: (r.meta as Record<string, unknown>) ?? undefined,
  minutes: r.minutes as number | undefined,
  xp: r.xp as number | undefined,
  createdAt: r.created_at as string
})

const st2st = (r: Record<string, unknown>): UserStats => ({
  userId: r.user_id as string,
  xp: r.xp as number,
  streak: r.streak as number,
  longestStreak: r.longest_streak as number,
  lastActiveDay: r.last_active_day as string | undefined,
  totalMinutes: r.total_minutes as number,
  wordsLearned: r.words_learned as number,
  lessonsCompleted: r.lessons_completed as number,
  dailyGoalMin: r.daily_goal_min as number,
  updatedAt: r.updated_at as string
})

// ─── Local state for the current user ──────────────────────────────────────
// Until Clerk lands, we maintain currentUserId in localStorage so the rest of
// the app keeps working the same way as the local backend.

const LS_CURRENT = 'speakai.backend.supabase.currentUserId'
const readCurrent = (): ID | null => (typeof window === 'undefined' ? null : window.localStorage.getItem(LS_CURRENT))
const writeCurrent = (id: ID | null): void => {
  if (typeof window === 'undefined') return
  if (id) window.localStorage.setItem(LS_CURRENT, id)
  else window.localStorage.removeItem(LS_CURRENT)
}

const newId = (prefix: string): ID => `${prefix}_${Math.random().toString(36).slice(2, 10)}`
const now = (): string => new Date().toISOString()

/**
 * Apply an optional `{ limit, offset }` window to a Postgrest query via `.range`
 * (server-side LIMIT/OFFSET). No `limit` ⇒ query returned untouched, so existing
 * callers keep their full result set. Scaling — #A64.
 */
function withRange<Q>(q: Q, page?: { limit?: number; offset?: number }): Q {
  if (page?.limit == null) return q
  const from = page.offset && page.offset > 0 ? page.offset : 0
  return (q as unknown as { range: (a: number, b: number) => Q }).range(from, from + page.limit - 1)
}

// ─── Implementation ────────────────────────────────────────────────────────

export const supabaseBackend: Backend = {
  currentUserId(): ID | null { return readCurrent() },

  async signUp(input): Promise<PlatformUser> {
    const existing = await sb.from('users').select('*').eq('email', input.email).maybeSingle()
    if (existing.data) {
      writeCurrent(existing.data.id as string)
      return u2u(existing.data)
    }
    const id = newId('u')
    const row = {
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      avatar_emoji: input.role === 'teacher' ? '🎓' : '📚',
      native_language: 'uz',
      target_language: 'en',
      created_at: now()
    }
    const { data, error } = await sb.from('users').insert(row).select().single()
    if (error) throw error
    writeCurrent(data.id as string)
    return u2u(data)
  },

  async signIn(email): Promise<PlatformUser | null> {
    const { data } = await sb.from('users').select('*').eq('email', email).maybeSingle()
    if (!data) return null
    writeCurrent(data.id as string)
    return u2u(data)
  },

  async signOut(): Promise<void> {
    await sb.auth.signOut().then(() => undefined, () => undefined)
    writeCurrent(null)
  },

  async getUser(id): Promise<PlatformUser | null> {
    const { data } = await sb.from('users').select('*').eq('id', id).maybeSingle()
    return data ? u2u(data) : null
  },

  async listUsers(filter): Promise<PlatformUser[]> {
    let q = sb.from('users').select('*')
    if (filter?.role) q = q.eq('role', filter.role)
    if (filter?.q) q = q.or(`name.ilike.%${filter.q}%,email.ilike.%${filter.q}%`)
    q = withRange(q, filter)
    const { data } = await q
    return (data ?? []).map(u2u)
  },

  async updateUser(id, patch): Promise<PlatformUser> {
    const row: Record<string, unknown> = {}
    if (patch.name != null) row.name = patch.name
    if (patch.email != null) row.email = patch.email
    if (patch.role != null) row.role = patch.role
    if (patch.avatarEmoji != null) row.avatar_emoji = patch.avatarEmoji
    if (patch.bio != null) row.bio = patch.bio
    if (patch.nativeLanguage != null) row.native_language = patch.nativeLanguage
    if (patch.targetLanguage != null) row.target_language = patch.targetLanguage
    if (patch.level != null) row.level = patch.level
    if (patch.country != null) row.country = patch.country
    if (patch.avatarUrl != null) row.avatar_url = patch.avatarUrl
    if (patch.bannerUrl != null) row.banner_url = patch.bannerUrl
    const { data, error } = await sb.from('users').update(row).eq('id', id).select().single()
    if (error) throw error
    return u2u(data)
  },

  async listCourses(filter): Promise<Course[]> {
    let q = sb.from('courses').select('*').not('published_at', 'is', null)
    if (filter?.language) q = q.eq('target_language', filter.language)
    if (filter?.level) q = q.eq('level', filter.level)
    if (filter?.teacherId) q = q.eq('teacher_id', filter.teacherId)
    if (filter?.q) q = q.or(`title.ilike.%${filter.q}%,description.ilike.%${filter.q}%`)
    const { data, error } = await withRange(q.order('enrollment_count', { ascending: false }), filter)
    if (error) throw error
    return (data ?? []).map(c2c)
  },

  async getCourse(id): Promise<Course | null> {
    const { data } = await sb.from('courses').select('*').eq('id', id).maybeSingle()
    return data ? c2c(data) : null
  },

  async upsertCourse(course): Promise<Course> {
    const row = {
      id: course.id,
      teacher_id: course.teacherId,
      title: course.title,
      description: course.description,
      about: course.about ?? null,
      level: course.level,
      target_language: course.targetLanguage,
      cover: course.cover,
      thumbnail_url: course.thumbnailUrl ?? null,
      banner_url: course.bannerUrl ?? null,
      pricing: course.pricing,
      rating: course.rating,
      review_count: course.reviewCount,
      enrollment_count: course.enrollmentCount,
      hours: course.hours,
      published_at: course.publishedAt ?? null,
      capstone: course.capstone ?? null,
      content_hash: course.contentHash ?? null
    }
    const { data, error } = await sb.from('courses').upsert(row).select().single()
    if (error) throw error
    return c2c(data)
  },

  async publishCourse(id): Promise<Course> {
    const { data, error } = await sb.from('courses').update({ published_at: now() }).eq('id', id).select().single()
    if (error) throw error
    return c2c(data)
  },

  async deleteCourse(id): Promise<void> {
    await sb.from('courses').delete().eq('id', id)
  },

  async myCourses(teacherId): Promise<Course[]> {
    const { data, error } = await sb.from('courses').select('*').eq('teacher_id', teacherId)
    if (error) throw error
    return (data ?? []).map(c2c)
  },

  async listUnits(courseId): Promise<Unit[]> {
    const { data } = await sb.from('units').select('*').eq('course_id', courseId).order('index')
    return (data ?? []).map(u2unit)
  },
  async listLessons(unitId): Promise<Lesson[]> {
    const { data } = await sb.from('lessons').select('*').eq('unit_id', unitId).order('index')
    return (data ?? []).map(l2l)
  },
  async upsertUnit(unit): Promise<Unit> {
    const row = { id: unit.id, course_id: unit.courseId, index: unit.index, title: unit.title, about: unit.about }
    const { data, error } = await sb.from('units').upsert(row).select().single()
    if (error) throw error
    return u2unit(data)
  },
  async upsertLesson(lesson): Promise<Lesson> {
    const row = {
      id: lesson.id, unit_id: lesson.unitId, index: lesson.index, title: lesson.title,
      kind: lesson.kind, video_url: lesson.videoUrl ?? null, duration_min: lesson.durationMin ?? null,
      drip_days: lesson.dripDays ?? null, content: lesson.content ?? null
    }
    const { data, error } = await sb.from('lessons').upsert(row).select().single()
    if (error) throw error
    return l2l(data)
  },

  async enroll(userId, courseId): Promise<Enrollment> {
    // Idempotent: re-enrolling must not re-bump the course counter (matches local backend).
    const { data: existing } = await sb
      .from('enrollments').select().eq('user_id', userId).eq('course_id', courseId).maybeSingle()
    if (existing) return e2e(existing)
    const row = { user_id: userId, course_id: courseId, progress: 0, last_active_at: now(), enrolled_at: now() }
    const { data, error } = await sb.from('enrollments').insert(row).select().single()
    if (error) throw error
    await sb.rpc('increment_course_enrollment', { p_course_id: courseId }).then(() => undefined, () => undefined)
    return e2e(data)
  },
  async unenroll(userId, courseId): Promise<void> {
    await sb.from('enrollments').delete().eq('user_id', userId).eq('course_id', courseId)
  },
  async myEnrollments(userId): Promise<Enrollment[]> {
    const { data } = await sb.from('enrollments').select('*').eq('user_id', userId)
    return (data ?? []).map(e2e)
  },
  async setEnrollmentProgress(userId, courseId, progress): Promise<Enrollment> {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)))
    const row = {
      user_id: userId, course_id: courseId, progress: clamped, last_active_at: now(),
      completed_at: clamped >= 100 ? now() : null
    }
    const { data, error } = await sb.from('enrollments').upsert(row).select().single()
    if (error) throw error
    return e2e(data)
  },
  async studentsOf(teacherId): Promise<{ enrollment: Enrollment; user: PlatformUser; course: Course }[]> {
    const { data: courses } = await sb.from('courses').select('*').eq('teacher_id', teacherId)
    if (!courses || courses.length === 0) return []
    const courseIds = courses.map((c) => c.id as string)
    const { data: enrolls } = await sb.from('enrollments').select('*').in('course_id', courseIds)
    if (!enrolls || enrolls.length === 0) return []
    const userIds = Array.from(new Set(enrolls.map((e) => e.user_id as string)))
    const { data: users } = await sb.from('users').select('*').in('id', userIds)
    return enrolls.map((e) => ({
      enrollment: e2e(e),
      user: u2u((users ?? []).find((u) => u.id === e.user_id) ?? users![0]),
      course: c2c(courses.find((c) => c.id === e.course_id)!)
    }))
  },

  async listFeed(opts): Promise<Post[]> {
    // Group-scoped posts live in their group's feed, not the global one.
    let q = sb.from('posts').select('*').is('group_id', null).order('created_at', { ascending: false })
    q = withRange(q, opts)
    const { data } = await q
    let posts = (data ?? []).map(p2p)
    if (opts?.authorRole) {
      const { data: users } = await sb.from('users').select('id').eq('role', opts.authorRole)
      const ids = new Set((users ?? []).map((u) => u.id as string))
      posts = posts.filter((p) => ids.has(p.authorId))
    }
    return posts
  },

  async createPost(input): Promise<Post> {
    const row = {
      id: newId('p'),
      author_id: input.authorId,
      kind: input.kind,
      text: input.text,
      resource: input.resource ?? null,
      poll: input.poll ?? null,
      study_session: input.studySession ?? null,
      achievement: input.achievement ?? null,
      voice: input.voice ?? null,
      group_id: input.groupId ?? null,
      reactions: input.reactions ?? {},
      share_count: input.shareCount ?? 0,
      created_at: now()
    }
    const { data, error } = await sb.from('posts').insert(row).select().single()
    if (error) throw error
    return p2p(data)
  },

  async like(userId, postId): Promise<{ liked: boolean; likeCount: number }> {
    const { data: existing } = await sb.from('likes').select('user_id').eq('user_id', userId).eq('post_id', postId).limit(1)
    if (existing && existing.length > 0) {
      await sb.from('likes').delete().eq('user_id', userId).eq('post_id', postId)
      const { data: post } = await sb.from('posts').select('like_count').eq('id', postId).maybeSingle()
      const newCount = Math.max(0, ((post?.like_count as number) ?? 1) - 1)
      await sb.from('posts').update({ like_count: newCount }).eq('id', postId)
      return { liked: false, likeCount: newCount }
    }
    await sb.from('likes').insert({ user_id: userId, post_id: postId, created_at: now() })
    const { data: post } = await sb.from('posts').select('like_count').eq('id', postId).maybeSingle()
    const newCount = ((post?.like_count as number) ?? 0) + 1
    await sb.from('posts').update({ like_count: newCount }).eq('id', postId)
    return { liked: true, likeCount: newCount }
  },

  async save(userId, target): Promise<{ saved: boolean }> {
    const { data: existing } = await sb
      .from('saves').select('user_id')
      .eq('user_id', userId).eq('target_kind', target.kind).eq('target_id', target.id).limit(1)
    if (existing && existing.length > 0) {
      await sb.from('saves').delete().eq('user_id', userId).eq('target_kind', target.kind).eq('target_id', target.id)
      return { saved: false }
    }
    await sb.from('saves').insert({ user_id: userId, target_kind: target.kind, target_id: target.id, created_at: now() })
    return { saved: true }
  },
  async isSaved(userId, target): Promise<boolean> {
    const { data } = await sb.from('saves').select('user_id')
      .eq('user_id', userId).eq('target_kind', target.kind).eq('target_id', target.id).maybeSingle()
    return data != null
  },
  async isLiked(userId, postId): Promise<boolean> {
    const { data } = await sb.from('likes').select('user_id').eq('user_id', userId).eq('post_id', postId).maybeSingle()
    return data != null
  },
  async listSaved(userId): Promise<Save[]> {
    const { data } = await sb.from('saves').select('*').eq('user_id', userId)
    return (data ?? []).map((r) => ({
      userId: r.user_id as string,
      target: { kind: r.target_kind as 'course' | 'post', id: r.target_id as string },
      createdAt: r.created_at as string
    } as Save))
  },
  async listLikes(userId): Promise<Like[]> {
    const { data } = await sb.from('likes').select('*').eq('user_id', userId)
    return (data ?? []).map((r) => ({ userId: r.user_id as string, postId: r.post_id as string, createdAt: r.created_at as string }))
  },

  async reactToPost(userId, postId, emoji): Promise<{ reactions: Record<string, number>; myReaction: string | null }> {
    const { data: rows } = await sb.from('post_reactions').select('emoji').eq('post_id', postId).eq('user_id', userId).limit(1)
    const prev = rows && rows.length > 0 ? (rows[0].emoji as string) : null
    let myReaction: string | null = emoji
    if (prev === emoji) {
      await sb.from('post_reactions').delete().eq('post_id', postId).eq('user_id', userId)
      myReaction = null
    } else if (prev) {
      await sb.from('post_reactions').update({ emoji }).eq('post_id', postId).eq('user_id', userId)
    } else {
      await sb.from('post_reactions').insert({ post_id: postId, user_id: userId, emoji, created_at: now() })
    }
    const { data: all } = await sb.from('post_reactions').select('emoji').eq('post_id', postId)
    const reactions: Record<string, number> = {}
    for (const r of all ?? []) reactions[r.emoji as string] = (reactions[r.emoji as string] ?? 0) + 1
    await sb.from('posts').update({ reactions }).eq('id', postId)
    return { reactions, myReaction }
  },

  async myReaction(userId, postId): Promise<string | null> {
    const { data } = await sb.from('post_reactions').select('emoji').eq('post_id', postId).eq('user_id', userId).limit(1)
    return data && data.length > 0 ? (data[0].emoji as string) : null
  },

  async votePoll(userId, postId, optionId): Promise<{ poll: Poll; myVote: string | null }> {
    const { data: post } = await sb.from('posts').select('poll').eq('id', postId).maybeSingle()
    const basePoll = post?.poll as Poll | null
    if (!basePoll) throw new Error('Post has no poll')
    const { data: rows } = await sb.from('poll_votes').select('option_id').eq('post_id', postId).eq('user_id', userId).limit(1)
    const prev = rows && rows.length > 0 ? (rows[0].option_id as string) : null
    let myVote: string | null = optionId
    if (prev === optionId) {
      await sb.from('poll_votes').delete().eq('post_id', postId).eq('user_id', userId)
      myVote = null
    } else if (prev) {
      await sb.from('poll_votes').update({ option_id: optionId }).eq('post_id', postId).eq('user_id', userId)
    } else {
      await sb.from('poll_votes').insert({ post_id: postId, user_id: userId, option_id: optionId, created_at: now() })
    }
    const { data: all } = await sb.from('poll_votes').select('option_id').eq('post_id', postId)
    const tally: Record<string, number> = {}
    for (const v of all ?? []) tally[v.option_id as string] = (tally[v.option_id as string] ?? 0) + 1
    const poll: Poll = { ...basePoll, options: basePoll.options.map((o) => ({ ...o, votes: tally[o.id] ?? 0 })) }
    await sb.from('posts').update({ poll }).eq('id', postId)
    return { poll, myVote }
  },

  async myPollVote(userId, postId): Promise<string | null> {
    const { data } = await sb.from('poll_votes').select('option_id').eq('post_id', postId).eq('user_id', userId).limit(1)
    return data && data.length > 0 ? (data[0].option_id as string) : null
  },

  async joinStudySession(userId, postId): Promise<{ joined: boolean; joinedIds: ID[] }> {
    const { data: post } = await sb.from('posts').select('study_session').eq('id', postId).maybeSingle()
    const session = post?.study_session as Post['studySession'] | null
    if (!session) throw new Error('Post has no study session')
    const set = new Set(session.joinedIds)
    let joined: boolean
    if (set.has(userId)) { set.delete(userId); joined = false }
    else { set.add(userId); joined = true }
    const joinedIds = Array.from(set)
    await sb.from('posts').update({ study_session: { ...session, joinedIds } }).eq('id', postId)
    return { joined, joinedIds }
  },

  async listComments(targetKind, targetId, viewerId): Promise<CommentView[]> {
    const { data } = await sb.from('comments').select('*')
      .eq('target_kind', targetKind).eq('target_id', targetId)
      .order('created_at', { ascending: false })
    const list = data ?? []
    const ids = list.map((c) => c.id as string)
    const { data: likes } = ids.length
      ? await sb.from('comment_likes').select('comment_id,user_id').in('comment_id', ids)
      : { data: [] as { comment_id: string; user_id: string }[] }
    const counts: Record<string, number> = {}
    const mine = new Set<string>()
    for (const l of likes ?? []) {
      counts[l.comment_id as string] = (counts[l.comment_id as string] ?? 0) + 1
      if (viewerId && l.user_id === viewerId) mine.add(l.comment_id as string)
    }
    return list.map((c) => ({
      id: c.id as string,
      targetKind: c.target_kind as CommentView['targetKind'],
      targetId: c.target_id as string,
      authorId: c.author_id as string,
      text: c.text as string,
      parentId: (c.parent_id as string | null) ?? undefined,
      createdAt: c.created_at as string,
      likeCount: counts[c.id as string] ?? 0,
      likedByMe: mine.has(c.id as string)
    }))
  },

  async addComment(input): Promise<Comment> {
    const row = {
      id: newId('cm'),
      target_kind: input.targetKind,
      target_id: input.targetId,
      author_id: input.authorId,
      text: input.text.trim(),
      parent_id: input.parentId ?? null,
      created_at: now()
    }
    const { data, error } = await sb.from('comments').insert(row).select().single()
    if (error) throw error
    if (input.targetKind === 'post') {
      const { data: post } = await sb.from('posts').select('comment_count').eq('id', input.targetId).maybeSingle()
      await sb.from('posts').update({ comment_count: ((post?.comment_count as number) ?? 0) + 1 }).eq('id', input.targetId)
    }
    return {
      id: data.id as string,
      targetKind: data.target_kind as Comment['targetKind'],
      targetId: data.target_id as string,
      authorId: data.author_id as string,
      text: data.text as string,
      parentId: (data.parent_id as string | null) ?? undefined,
      createdAt: data.created_at as string
    }
  },

  async removeComment(commentId): Promise<void> {
    const { data: c } = await sb.from('comments').select('target_kind,target_id').eq('id', commentId).maybeSingle()
    const { data: replies } = await sb.from('comments').select('id').eq('parent_id', commentId)
    const ids = [commentId, ...(replies ?? []).map((r) => r.id as string)]
    await sb.from('comment_likes').delete().in('comment_id', ids)
    await sb.from('comments').delete().in('id', ids)
    if (c?.target_kind === 'post') {
      const { data: post } = await sb.from('posts').select('comment_count').eq('id', c.target_id).maybeSingle()
      await sb.from('posts').update({ comment_count: Math.max(0, ((post?.comment_count as number) ?? ids.length) - ids.length) }).eq('id', c.target_id as string)
    }
  },

  async toggleCommentLike(commentId, userId): Promise<{ liked: boolean; count: number }> {
    const { data: existing } = await sb.from('comment_likes').select('user_id').eq('comment_id', commentId).eq('user_id', userId).limit(1)
    let liked: boolean
    if (existing && existing.length > 0) {
      await sb.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
      liked = false
    } else {
      await sb.from('comment_likes').insert({ comment_id: commentId, user_id: userId, created_at: now() })
      liked = true
    }
    const { count } = await sb.from('comment_likes').select('*', { count: 'exact', head: true }).eq('comment_id', commentId)
    return { liked, count: count ?? 0 }
  },

  async follow(followerId, followingId): Promise<{ following: boolean }> {
    if (followerId === followingId) return { following: false }
    // Use an array check (not maybeSingle): if duplicate follow rows ever
    // accumulated (no unique constraint), maybeSingle() returns null and the
    // toggle would re-insert forever — making unfollow impossible. Delete ALL
    // matching rows on toggle so it always flips + cleans duplicates.
    const { data: existing } = await sb.from('follows').select('follower_id')
      .eq('follower_id', followerId).eq('following_id', followingId).limit(1)
    if (existing && existing.length > 0) {
      await sb.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
      return { following: false }
    }
    await sb.from('follows').insert({ follower_id: followerId, following_id: followingId, created_at: now() })
    return { following: true }
  },
  async isFollowing(followerId, followingId): Promise<boolean> {
    const { data } = await sb.from('follows').select('follower_id')
      .eq('follower_id', followerId).eq('following_id', followingId).maybeSingle()
    return data != null
  },
  async followers(userId): Promise<PlatformUser[]> {
    const { data } = await sb.from('follows').select('follower_id').eq('following_id', userId)
    const ids = (data ?? []).map((r) => r.follower_id as string)
    if (ids.length === 0) return []
    const { data: users } = await sb.from('users').select('*').in('id', ids)
    return (users ?? []).map(u2u)
  },
  async following(userId): Promise<PlatformUser[]> {
    const { data } = await sb.from('follows').select('following_id').eq('follower_id', userId)
    const ids = (data ?? []).map((r) => r.following_id as string)
    if (ids.length === 0) return []
    const { data: users } = await sb.from('users').select('*').in('id', ids)
    return (users ?? []).map(u2u)
  },
  async followCounts(userId): Promise<{ followers: number; following: number }> {
    const [{ count: fol }, { count: fwg }] = await Promise.all([
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
    ])
    return { followers: fol ?? 0, following: fwg ?? 0 }
  },

  async listLiveNow(filter): Promise<LiveStream[]> {
    let q = sb.from('live_streams').select('*')
    if (filter?.language) q = q.eq('language', filter.language)
    const { data } = await q
    return (data ?? []).map(s2s)
  },
  async createLiveStream(input): Promise<LiveStream> {
    const row = {
      id: newId('ls'),
      host_id: input.hostId,
      title: input.title,
      category: input.category,
      language: input.language,
      viewer_count: 0,
      started_at: now(),
      cover: input.cover ?? 'from-brand-700 to-indigo-900',
      image_url: input.imageUrl ?? null
    }
    const { data, error } = await sb.from('live_streams').insert(row).select().single()
    if (error) throw error
    return s2s(data)
  },
  async endLiveStream(id): Promise<void> {
    await sb.from('live_streams').delete().eq('id', id)
  },
  async listAnnouncements(): Promise<LiveAnnouncement[]> {
    const { data } = await sb.from('live_announcements').select('*').order('when_iso', { ascending: true })
    return (data ?? []).map(a2a)
  },
  async createAnnouncement(input): Promise<LiveAnnouncement> {
    const row = {
      id: newId('a'), teacher_id: input.teacherId, title: input.title,
      body: input.body, when_iso: input.whenISO, cover: input.cover,
      image_url: input.imageUrl ?? null
    }
    const { data, error } = await sb.from('live_announcements').insert(row).select().single()
    if (error) throw error
    return a2a(data)
  },

  async listNotifs(userId): Promise<Notif[]> {
    const { data } = await sb.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    return (data ?? []).map(n2n)
  },
  async createNotif(input): Promise<Notif> {
    const row = {
      id: newId('n'), user_id: input.userId, type: input.type, kind: input.kind ?? null, title: input.title,
      body: input.body, link: input.link ?? null, read: false, created_at: now()
    }
    const { data, error } = await sb.from('notifications').insert(row).select().single()
    if (error) throw error
    return n2n(data)
  },
  async markNotif(id, read = true): Promise<void> {
    await sb.from('notifications').update({ read }).eq('id', id)
  },
  async markAllRead(userId): Promise<void> {
    await sb.from('notifications').update({ read: true }).eq('user_id', userId)
  },

  // ─── Reviews ───────────────────────────────────────────────────────────────
  async listReviews(courseId): Promise<Review[]> {
    const { data } = await sb.from('reviews').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
    return (data ?? []).map(rv2rv)
  },
  async createReview(input): Promise<Review> {
    const row = { id: newId('rv'), course_id: input.courseId, user_id: input.userId, rating: input.rating, text: input.text, created_at: now() }
    const { data, error } = await sb.from('reviews').upsert(row, { onConflict: 'course_id,user_id' }).select().single()
    if (error) throw error
    return rv2rv(data)
  },
  async myReview(userId, courseId): Promise<Review | null> {
    const { data } = await sb.from('reviews').select('*').eq('user_id', userId).eq('course_id', courseId).maybeSingle()
    return data ? rv2rv(data) : null
  },

  // ─── Groups ────────────────────────────────────────────────────────────────
  async listGroups(filter): Promise<Group[]> {
    let q = sb.from('groups').select('*').eq('visibility', 'public')
    if (filter?.language) q = q.eq('language', filter.language)
    if (filter?.q) q = q.or(`name.ilike.%${filter.q}%,description.ilike.%${filter.q}%`)
    const { data } = await q.order('member_count', { ascending: false })
    return (data ?? []).map(g2g)
  },
  async getGroup(id): Promise<Group | null> {
    const { data } = await sb.from('groups').select('*').eq('id', id).maybeSingle()
    return data ? g2g(data) : null
  },
  async upsertGroup(group): Promise<Group> {
    const row = {
      id: group.id, name: group.name, description: group.description, language: group.language,
      owner_id: group.ownerId, cover: group.cover, image_url: group.imageUrl ?? null,
      visibility: group.visibility,
      member_count: group.memberCount, created_at: group.createdAt
    }
    const { data, error } = await sb.from('groups').upsert(row).select().single()
    if (error) throw error
    await sb.from('group_members').upsert({ group_id: group.id, user_id: group.ownerId, role: 'owner', joined_at: now() }).then(() => undefined, () => undefined)
    return g2g(data)
  },
  async joinGroup(userId, groupId): Promise<{ joined: boolean; memberCount: number }> {
    await sb.from('group_members').upsert({ group_id: groupId, user_id: userId, role: 'member', joined_at: now() })
    const { count } = await sb.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId)
    await sb.from('groups').update({ member_count: count ?? 0 }).eq('id', groupId)
    return { joined: true, memberCount: count ?? 0 }
  },
  async leaveGroup(userId, groupId): Promise<void> {
    await sb.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
    const { count } = await sb.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId)
    await sb.from('groups').update({ member_count: count ?? 0 }).eq('id', groupId)
  },
  async myGroups(userId): Promise<Group[]> {
    const { data: mems } = await sb.from('group_members').select('group_id').eq('user_id', userId)
    const ids = (mems ?? []).map((m) => m.group_id as string)
    if (ids.length === 0) return []
    const { data } = await sb.from('groups').select('*').in('id', ids)
    return (data ?? []).map(g2g)
  },
  async groupMembers(groupId): Promise<PlatformUser[]> {
    const { data: mems } = await sb.from('group_members').select('user_id').eq('group_id', groupId)
    const ids = (mems ?? []).map((m) => m.user_id as string)
    if (ids.length === 0) return []
    const { data } = await sb.from('users').select('*').in('id', ids)
    return (data ?? []).map(u2u)
  },
  async groupMembership(groupId): Promise<GroupMember[]> {
    const { data: mems } = await sb.from('group_members').select('user_id, role, joined_at').eq('group_id', groupId)
    const rows = mems ?? []
    const ids = rows.map((m) => m.user_id as string)
    if (ids.length === 0) return []
    const { data: users } = await sb.from('users').select('*').in('id', ids)
    const byId = new Map((users ?? []).map((u) => [u.id as string, u2u(u)]))
    const roleRank: Record<GroupMember['role'], number> = { owner: 0, moderator: 1, member: 2 }
    return rows
      .map((m) => ({ user: byId.get(m.user_id as string), role: (m.role as GroupMember['role']) ?? 'member', joinedAt: (m.joined_at as string) ?? now() }))
      .filter((m): m is GroupMember => Boolean(m.user))
      .sort((a, b) => roleRank[a.role] - roleRank[b.role] || a.joinedAt.localeCompare(b.joinedAt))
  },
  async listGroupFeed(groupId, opts): Promise<Post[]> {
    let q = sb.from('posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false })
    if (opts?.limit) q = q.limit(opts.limit)
    const { data } = await q
    return (data ?? []).map(p2p)
  },
  async listGroupMessages(groupId): Promise<GroupMessage[]> {
    const { data } = await sb.from('group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true })
    return (data ?? []).map((r) => ({
      id: r.id as string,
      groupId: r.group_id as string,
      senderId: r.sender_id as string,
      text: r.text as string,
      createdAt: r.created_at as string
    }))
  },
  async sendGroupMessage(input): Promise<GroupMessage> {
    const row = { id: newId('gm'), group_id: input.groupId, sender_id: input.senderId, text: input.text, created_at: now() }
    const { data, error } = await sb.from('group_messages').insert(row).select().single()
    if (error) throw error
    return { id: data.id as string, groupId: data.group_id as string, senderId: data.sender_id as string, text: data.text as string, createdAt: data.created_at as string }
  },
  async deleteGroup(id): Promise<void> {
    await sb.from('group_members').delete().eq('group_id', id)
    await sb.from('groups').delete().eq('id', id)
  },

  // ─── Challenges ────────────────────────────────────────────────────────────
  async listChallenges(filter): Promise<Challenge[]> {
    let q = sb.from('challenges').select('*')
    if (filter?.language) q = q.eq('language', filter.language)
    if (filter?.active) { const t = now(); q = q.lte('starts_at', t).gte('ends_at', t) }
    const { data } = await q.order('participant_count', { ascending: false })
    return (data ?? []).map(ch2ch)
  },
  async getChallenge(id): Promise<Challenge | null> {
    const { data } = await sb.from('challenges').select('*').eq('id', id).maybeSingle()
    return data ? ch2ch(data) : null
  },
  async upsertChallenge(challenge): Promise<Challenge> {
    const row = {
      id: challenge.id, title: challenge.title, description: challenge.description, kind: challenge.kind,
      goal: challenge.goal, language: challenge.language, created_by: challenge.createdBy,
      starts_at: challenge.startsAt, ends_at: challenge.endsAt, cover: challenge.cover,
      image_url: challenge.imageUrl ?? null,
      participant_count: challenge.participantCount, created_at: challenge.createdAt
    }
    const { data, error } = await sb.from('challenges').upsert(row).select().single()
    if (error) throw error
    return ch2ch(data)
  },
  async joinChallenge(userId, challengeId): Promise<ChallengeParticipant> {
    const row = { challenge_id: challengeId, user_id: userId, progress: 0, joined_at: now() }
    const { data, error } = await sb.from('challenge_participants').upsert(row).select().single()
    if (error) throw error
    const { count } = await sb.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('challenge_id', challengeId)
    await sb.from('challenges').update({ participant_count: count ?? 0 }).eq('id', challengeId)
    return cp2cp(data)
  },
  async deleteChallenge(id): Promise<void> {
    await sb.from('challenge_participants').delete().eq('challenge_id', id)
    await sb.from('challenges').delete().eq('id', id)
  },
  async leaveChallenge(userId, challengeId): Promise<void> {
    await sb.from('challenge_participants').delete().eq('challenge_id', challengeId).eq('user_id', userId)
    const { count } = await sb.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('challenge_id', challengeId)
    await sb.from('challenges').update({ participant_count: count ?? 0 }).eq('id', challengeId)
  },
  async updateChallengeProgress(userId, challengeId, progress): Promise<ChallengeParticipant> {
    const { data: ch } = await sb.from('challenges').select('goal').eq('id', challengeId).maybeSingle()
    const done = ch ? progress >= (ch.goal as number) : false
    const row = { challenge_id: challengeId, user_id: userId, progress, completed_at: done ? now() : null }
    const { data, error } = await sb.from('challenge_participants').upsert(row).select().single()
    if (error) throw error
    return cp2cp(data)
  },
  async myChallenges(userId): Promise<{ challenge: Challenge; participant: ChallengeParticipant }[]> {
    const { data: parts } = await sb.from('challenge_participants').select('*').eq('user_id', userId)
    if (!parts || parts.length === 0) return []
    const ids = parts.map((p) => p.challenge_id as string)
    const { data: chs } = await sb.from('challenges').select('*').in('id', ids)
    return parts
      .map((p) => ({ participant: cp2cp(p), challenge: (chs ?? []).find((c) => c.id === p.challenge_id) }))
      .filter((x) => !!x.challenge)
      .map((x) => ({ participant: x.participant, challenge: ch2ch(x.challenge as Record<string, unknown>) }))
  },

  // ─── Exam attempts ───────────────────────────────────────────────────────────
  async recordExamAttempt(input): Promise<ExamAttempt> {
    const row = {
      id: newId('ea'), user_id: input.userId, kind: input.kind, language: input.language,
      overall: input.overall, sections: input.sections, cefr: input.cefr ?? null,
      feedback: input.feedback ?? null, duration_min: input.durationMin ?? null,
      taken_at: input.takenAt ?? now()
    }
    const { data, error } = await sb.from('exam_attempts').insert(row).select().single()
    if (error) throw error
    return ea2ea(data)
  },
  async listExamAttempts(userId, kind): Promise<ExamAttempt[]> {
    let q = sb.from('exam_attempts').select('*').eq('user_id', userId)
    if (kind) q = q.eq('kind', kind)
    const { data } = await q.order('taken_at', { ascending: false })
    return (data ?? []).map(ea2ea)
  },

  // ─── Vocabulary (FSRS) ───────────────────────────────────────────────────────
  async listVocab(userId, opts): Promise<VocabItem[]> {
    let q = sb.from('vocab_items').select('*').eq('user_id', userId)
    if (opts?.language) q = q.eq('language', opts.language)
    if (opts?.deck) q = q.eq('deck', opts.deck)
    const { data } = await q.order('due', { ascending: true })
    return (data ?? []).map(v2v)
  },
  async upsertVocab(item): Promise<VocabItem> {
    const row = {
      id: item.id, user_id: item.userId, language: item.language, term: item.term, translation: item.translation,
      example: item.example ?? null, deck: item.deck ?? null, due: item.due, stability: item.stability,
      difficulty: item.difficulty, elapsed_days: item.elapsedDays, scheduled_days: item.scheduledDays,
      reps: item.reps, lapses: item.lapses, state: item.state, last_reviewed_at: item.lastReviewedAt ?? null,
      created_at: item.createdAt
    }
    const { data, error } = await sb.from('vocab_items').upsert(row).select().single()
    if (error) throw error
    return v2v(data)
  },
  async deleteVocab(id): Promise<void> {
    await sb.from('vocab_items').delete().eq('id', id)
  },
  async dueVocab(userId, language): Promise<VocabItem[]> {
    let q = sb.from('vocab_items').select('*').eq('user_id', userId).lte('due', now())
    if (language) q = q.eq('language', language)
    const { data } = await q.order('due', { ascending: true })
    return (data ?? []).map(v2v)
  },

  // ─── Direct messages ─────────────────────────────────────────────────────────
  async listThreads(userId): Promise<DmThread[]> {
    const { data } = await sb.from('dm_threads').select('*').contains('participant_ids', [userId]).order('last_message_at', { ascending: false })
    return (data ?? []).map(th2th)
  },
  async getOrCreateThread(userId, otherUserId): Promise<DmThread> {
    const { data: existing } = await sb.from('dm_threads').select('*').contains('participant_ids', [userId, otherUserId])
    const match = (existing ?? []).find((t) => (t.participant_ids as string[]).length === 2)
    if (match) return th2th(match)
    const row = { id: newId('th'), participant_ids: [userId, otherUserId], last_message_at: now(), created_at: now() }
    const { data, error } = await sb.from('dm_threads').insert(row).select().single()
    if (error) throw error
    return th2th(data)
  },
  async listMessages(threadId): Promise<DmMessage[]> {
    const { data } = await sb.from('dm_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true })
    return (data ?? []).map(m2m)
  },
  async sendMessage(input): Promise<DmMessage> {
    const row = {
      id: newId('m'), thread_id: input.threadId, sender_id: input.senderId, text: input.text,
      attachment: input.attachment ?? null, read_by: [input.senderId], created_at: now()
    }
    const { data, error } = await sb.from('dm_messages').insert(row).select().single()
    if (error) throw error
    await sb.from('dm_threads').update({ last_message_at: row.created_at, last_message_text: input.text }).eq('id', input.threadId)
    return m2m(data)
  },
  async markThreadRead(threadId, userId): Promise<void> {
    // Append userId to read_by for messages they haven't read. Best-effort per row.
    const { data } = await sb.from('dm_messages').select('id, read_by').eq('thread_id', threadId)
    for (const r of data ?? []) {
      const readBy = (r.read_by as string[]) ?? []
      if (!readBy.includes(userId)) {
        await sb.from('dm_messages').update({ read_by: [...readBy, userId] }).eq('id', r.id as string)
      }
    }
  },

  // ─── Media assets ──────────────────────────────────────────────────────────
  async listMedia(ownerId, kind): Promise<MediaAsset[]> {
    let q = sb.from('media_assets').select('*').eq('owner_id', ownerId)
    if (kind) q = q.eq('kind', kind)
    const { data } = await q.order('created_at', { ascending: false })
    return (data ?? []).map(md2md)
  },
  async createMedia(input): Promise<MediaAsset> {
    const row = {
      id: newId('md'), owner_id: input.ownerId, kind: input.kind, url: input.url, name: input.name,
      size_bytes: input.sizeBytes, content_type: input.contentType ?? null,
      content_hash: input.contentHash ?? null, created_at: now()
    }
    const { data, error } = await sb.from('media_assets').insert(row).select().single()
    if (error) throw error
    return md2md(data)
  },
  async deleteMedia(id): Promise<void> {
    await sb.from('media_assets').delete().eq('id', id)
  },

  // ─── Stats & activity ────────────────────────────────────────────────────────
  async getStats(userId): Promise<UserStats> {
    const { data } = await sb.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
    if (data) return st2st(data)
    const { data: events } = await sb.from('activity_events').select('*').eq('user_id', userId)
    return computeStats(userId, (events ?? []).map(ac2ac), null, now())
  },
  async recordActivity(event): Promise<{ event: ActivityEvent; stats: UserStats }> {
    const row = {
      id: newId('ac'), user_id: event.userId, kind: event.kind, language: event.language ?? null,
      meta: event.meta ?? null, minutes: event.minutes ?? null, xp: event.xp ?? null, created_at: now()
    }
    const { data, error } = await sb.from('activity_events').insert(row).select().single()
    if (error) throw error
    const ev = ac2ac(data)
    const { data: events } = await sb.from('activity_events').select('*').eq('user_id', event.userId)
    const { data: prev } = await sb.from('user_stats').select('*').eq('user_id', event.userId).maybeSingle()
    const stats = computeStats(event.userId, (events ?? []).map(ac2ac), prev ? st2st(prev) : null, now())
    await sb.from('user_stats').upsert({
      user_id: stats.userId, xp: stats.xp, streak: stats.streak, longest_streak: stats.longestStreak,
      last_active_day: stats.lastActiveDay ?? null, total_minutes: stats.totalMinutes,
      words_learned: stats.wordsLearned, lessons_completed: stats.lessonsCompleted,
      daily_goal_min: stats.dailyGoalMin, updated_at: stats.updatedAt
    })
    return { event: ev, stats }
  },
  async listActivity(userId, opts): Promise<ActivityEvent[]> {
    let q = sb.from('activity_events').select('*').eq('user_id', userId)
    if (opts?.since) q = q.gte('created_at', opts.since)
    q = q.order('created_at', { ascending: false })
    q = withRange(q, opts)
    const { data } = await q
    return (data ?? []).map(ac2ac)
  },
  async setDailyGoal(userId, minutes): Promise<UserStats> {
    const current = await this.getStats(userId)
    const updated: UserStats = { ...current, dailyGoalMin: Math.max(5, Math.round(minutes)), updatedAt: now() }
    await sb.from('user_stats').upsert({
      user_id: updated.userId, xp: updated.xp, streak: updated.streak, longest_streak: updated.longestStreak,
      last_active_day: updated.lastActiveDay ?? null, total_minutes: updated.totalMinutes,
      words_learned: updated.wordsLearned, lessons_completed: updated.lessonsCompleted,
      daily_goal_min: updated.dailyGoalMin, updated_at: updated.updatedAt
    })
    return updated
  },

  // ─── Privacy / GDPR ──────────────────────────────────────────────────────────
  async exportUserData(userId): Promise<Record<string, unknown>> {
    const tables = [
      'enrollments', 'reviews', 'posts', 'likes', 'saves', 'exam_attempts', 'vocab_items',
      'media_assets', 'activity_events', 'notifications', 'group_members', 'challenge_participants'
    ]
    const out: Record<string, unknown> = { exportedAt: now() }
    const { data: user } = await sb.from('users').select('*').eq('id', userId).maybeSingle()
    out.user = user ? u2u(user) : null
    const col = (t: string): string => (t === 'posts' ? 'author_id' : t === 'media_assets' ? 'owner_id' : 'user_id')
    for (const t of tables) {
      const { data } = await sb.from(t).select('*').eq(col(t), userId)
      out[t] = data ?? []
    }
    return out
  },
  async deleteUserData(userId): Promise<void> {
    // FK cascade on users delete handles most child rows (see migration). Posts
    // authored by the user + the user row go last.
    await sb.from('users').delete().eq('id', userId)
    writeCurrent(null)
  }
}
