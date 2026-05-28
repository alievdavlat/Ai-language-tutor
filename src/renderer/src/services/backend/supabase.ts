/**
 * Real Supabase implementation of the Backend contract.
 *
 * Maps the JS-side camelCase fields (defined in shared/types/platform.types.ts)
 * to the Postgres-side snake_case columns (defined in
 * supabase/migrations/0001_initial.sql).
 *
 * Flipped on by VITE_USE_SUPABASE=1 in .env.local. See services/backend/index.ts.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Course,
  Enrollment,
  Follow,
  Lesson,
  Like,
  LiveAnnouncement,
  LiveStream,
  Notif,
  PlatformUser,
  Post,
  Save,
  Unit
} from '@shared/types'
import type { Backend, CourseFilter, ID } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  // Surfacing this early — the index.ts factory will not pick supabaseBackend
  // unless these are defined, so this should never throw at runtime.
  console.warn('[supabase] missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

const sb: SupabaseClient = createClient(url ?? '', key ?? '', {
  auth: { persistSession: true, autoRefreshToken: true }
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
  createdAt: r.created_at as string
})

const c2c = (r: Record<string, unknown>): Course => ({
  id: r.id as string,
  teacherId: r.teacher_id as string,
  title: r.title as string,
  description: r.description as string,
  level: r.level as string,
  targetLanguage: r.target_language as Course['targetLanguage'],
  cover: r.cover as string,
  pricing: r.pricing as Course['pricing'],
  rating: Number(r.rating ?? 0),
  reviewCount: r.review_count as number,
  enrollmentCount: r.enrollment_count as number,
  hours: r.hours as number,
  publishedAt: r.published_at as string | undefined,
  capstone: r.capstone as string | undefined
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
  dripDays: r.drip_days as number | undefined
})

const s2s = (r: Record<string, unknown>): LiveStream => ({
  id: r.id as string,
  hostId: r.host_id as string,
  title: r.title as string,
  category: r.category as string,
  language: r.language as LiveStream['language'],
  viewerCount: r.viewer_count as number,
  startedAt: r.started_at as string,
  cover: r.cover as string
})

const a2a = (r: Record<string, unknown>): LiveAnnouncement => ({
  id: r.id as string,
  teacherId: r.teacher_id as string,
  title: r.title as string,
  body: r.body as string,
  whenISO: r.when_iso as string,
  cover: r.cover as string
})

const n2n = (r: Record<string, unknown>): Notif => ({
  id: r.id as string,
  userId: r.user_id as string,
  type: r.type as Notif['type'],
  title: r.title as string,
  body: r.body as string,
  link: r.link as string | undefined,
  read: r.read as boolean,
  createdAt: r.created_at as string
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

  async getUser(id): Promise<PlatformUser | null> {
    const { data } = await sb.from('users').select('*').eq('id', id).maybeSingle()
    return data ? u2u(data) : null
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
    const { data, error } = await q.order('enrollment_count', { ascending: false })
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
      level: course.level,
      target_language: course.targetLanguage,
      cover: course.cover,
      pricing: course.pricing,
      rating: course.rating,
      review_count: course.reviewCount,
      enrollment_count: course.enrollmentCount,
      hours: course.hours,
      published_at: course.publishedAt ?? null,
      capstone: course.capstone ?? null
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
      drip_days: lesson.dripDays ?? null
    }
    const { data, error } = await sb.from('lessons').upsert(row).select().single()
    if (error) throw error
    return l2l(data)
  },

  async enroll(userId, courseId): Promise<Enrollment> {
    const row = { user_id: userId, course_id: courseId, progress: 0, last_active_at: now(), enrolled_at: now() }
    const { data, error } = await sb.from('enrollments').upsert(row).select().single()
    if (error) throw error
    // Bump enrollment_count atomically — using an RPC would be safer, this is best-effort.
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
    let q = sb.from('posts').select('*').order('created_at', { ascending: false })
    if (opts?.limit) q = q.limit(opts.limit)
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
      reactions: input.reactions ?? {},
      share_count: input.shareCount ?? 0,
      created_at: now()
    }
    const { data, error } = await sb.from('posts').insert(row).select().single()
    if (error) throw error
    return p2p(data)
  },

  async like(userId, postId): Promise<{ liked: boolean; likeCount: number }> {
    const { data: existing } = await sb.from('likes').select('user_id').eq('user_id', userId).eq('post_id', postId).maybeSingle()
    if (existing) {
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
      .eq('user_id', userId).eq('target_kind', target.kind).eq('target_id', target.id).maybeSingle()
    if (existing) {
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

  async follow(followerId, followingId): Promise<{ following: boolean }> {
    if (followerId === followingId) return { following: false }
    const { data: existing } = await sb.from('follows').select('follower_id')
      .eq('follower_id', followerId).eq('following_id', followingId).maybeSingle()
    if (existing) {
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
  async listAnnouncements(): Promise<LiveAnnouncement[]> {
    const { data } = await sb.from('live_announcements').select('*').order('when_iso', { ascending: true })
    return (data ?? []).map(a2a)
  },

  async listNotifs(userId): Promise<Notif[]> {
    const { data } = await sb.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    return (data ?? []).map(n2n)
  },
  async markAllRead(userId): Promise<void> {
    await sb.from('notifications').update({ read: true }).eq('user_id', userId)
  }
}
