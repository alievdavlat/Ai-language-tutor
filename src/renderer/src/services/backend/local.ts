/**
 * In-process backend backed by localStorage. Implements the full `Backend`
 * contract so renderer pages can pretend Supabase is already there. Replace
 * the export in `services/backend/index.ts` with a real Supabase impl later.
 */
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
import { SEED_COURSES, SEED_LIVE, SEED_POSTS, SEED_ANNOUNCEMENTS, SEED_USERS, SEED_NOTIFS } from './seed'

// ─── Storage ───────────────────────────────────────────────────────────────

const LS_KEY = 'speakai.backend.v1'

interface Db {
  users: PlatformUser[]
  currentUserId: ID | null
  courses: Course[]
  units: Unit[]
  lessons: Lesson[]
  enrollments: Enrollment[]
  posts: Post[]
  likes: Like[]
  saves: Save[]
  follows: Follow[]
  streams: LiveStream[]
  announcements: LiveAnnouncement[]
  notifs: Notif[]
}

function emptyDb(): Db {
  return {
    users: [...SEED_USERS],
    currentUserId: null,
    courses: [...SEED_COURSES],
    units: [],
    lessons: [],
    enrollments: [],
    posts: [...SEED_POSTS],
    likes: [],
    saves: [],
    follows: [],
    streams: [...SEED_LIVE],
    announcements: [...SEED_ANNOUNCEMENTS],
    notifs: [...SEED_NOTIFS]
  }
}

function loadDb(): Db {
  if (typeof window === 'undefined' || !window.localStorage) return emptyDb()
  const raw = window.localStorage.getItem(LS_KEY)
  if (!raw) {
    const fresh = emptyDb()
    saveDb(fresh)
    return fresh
  }
  try {
    return JSON.parse(raw) as Db
  } catch {
    const fresh = emptyDb()
    saveDb(fresh)
    return fresh
  }
}

function saveDb(db: Db): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(db)) } catch { /* quota */ }
}

let dbCache: Db | null = null
function db(): Db {
  if (!dbCache) dbCache = loadDb()
  return dbCache
}
function persist(): void {
  if (dbCache) saveDb(dbCache)
}

function newId(prefix: string): ID {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
const now = (): string => new Date().toISOString()

// ─── Implementation ────────────────────────────────────────────────────────

export const localBackend: Backend = {
  currentUserId(): ID | null {
    return db().currentUserId
  },

  async signUp(input): Promise<PlatformUser> {
    const existing = db().users.find((u) => u.email === input.email)
    if (existing) {
      db().currentUserId = existing.id
      persist()
      return existing
    }
    const user: PlatformUser = {
      id: newId('u'),
      name: input.name,
      email: input.email,
      role: input.role,
      nativeLanguage: 'uz',
      targetLanguage: 'en',
      createdAt: now(),
      avatarEmoji: input.role === 'teacher' ? '🎓' : '📚'
    }
    db().users.push(user)
    db().currentUserId = user.id
    persist()
    return user
  },

  async signIn(email): Promise<PlatformUser | null> {
    const u = db().users.find((x) => x.email === email)
    if (!u) return null
    db().currentUserId = u.id
    persist()
    return u
  },

  async getUser(id): Promise<PlatformUser | null> {
    return db().users.find((u) => u.id === id) ?? null
  },

  async updateUser(id, patch): Promise<PlatformUser> {
    const i = db().users.findIndex((u) => u.id === id)
    if (i < 0) throw new Error(`User not found: ${id}`)
    db().users[i] = { ...db().users[i], ...patch }
    persist()
    return db().users[i]
  },

  async listCourses(filter): Promise<Course[]> {
    let list = db().courses.filter((c) => c.publishedAt)
    if (filter?.language) list = list.filter((c) => c.targetLanguage === filter.language)
    if (filter?.level) list = list.filter((c) => c.level === filter.level)
    if (filter?.teacherId) list = list.filter((c) => c.teacherId === filter.teacherId)
    if (filter?.q) {
      const q = filter.q.toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    }
    // Most enrollments first by default
    return [...list].sort((a, b) => b.enrollmentCount - a.enrollmentCount)
  },

  async getCourse(id): Promise<Course | null> {
    return db().courses.find((c) => c.id === id) ?? null
  },

  async upsertCourse(course): Promise<Course> {
    const i = db().courses.findIndex((c) => c.id === course.id)
    if (i < 0) db().courses.push(course)
    else db().courses[i] = course
    persist()
    return course
  },

  async publishCourse(id): Promise<Course> {
    const i = db().courses.findIndex((c) => c.id === id)
    if (i < 0) throw new Error(`Course not found: ${id}`)
    db().courses[i] = { ...db().courses[i], publishedAt: now() }
    persist()
    return db().courses[i]
  },

  async myCourses(teacherId): Promise<Course[]> {
    return db().courses.filter((c) => c.teacherId === teacherId)
  },

  async listUnits(courseId): Promise<Unit[]> {
    return db().units.filter((u) => u.courseId === courseId).sort((a, b) => a.index - b.index)
  },

  async listLessons(unitId): Promise<Lesson[]> {
    return db().lessons.filter((l) => l.unitId === unitId).sort((a, b) => a.index - b.index)
  },

  async upsertUnit(unit): Promise<Unit> {
    const i = db().units.findIndex((u) => u.id === unit.id)
    if (i < 0) db().units.push(unit)
    else db().units[i] = unit
    persist()
    return unit
  },

  async upsertLesson(lesson): Promise<Lesson> {
    const i = db().lessons.findIndex((l) => l.id === lesson.id)
    if (i < 0) db().lessons.push(lesson)
    else db().lessons[i] = lesson
    persist()
    return lesson
  },

  async enroll(userId, courseId): Promise<Enrollment> {
    const existing = db().enrollments.find((e) => e.userId === userId && e.courseId === courseId)
    if (existing) return existing
    const e: Enrollment = {
      userId,
      courseId,
      progress: 0,
      lastActiveAt: now(),
      enrolledAt: now()
    }
    db().enrollments.push(e)
    // bump enrollment counter on the course
    const ci = db().courses.findIndex((c) => c.id === courseId)
    if (ci >= 0) db().courses[ci] = { ...db().courses[ci], enrollmentCount: db().courses[ci].enrollmentCount + 1 }
    persist()
    return e
  },

  async unenroll(userId, courseId): Promise<void> {
    const before = db().enrollments.length
    db().enrollments = db().enrollments.filter((e) => !(e.userId === userId && e.courseId === courseId))
    if (db().enrollments.length < before) {
      const ci = db().courses.findIndex((c) => c.id === courseId)
      if (ci >= 0) db().courses[ci] = { ...db().courses[ci], enrollmentCount: Math.max(0, db().courses[ci].enrollmentCount - 1) }
    }
    persist()
  },

  async myEnrollments(userId): Promise<Enrollment[]> {
    return db().enrollments.filter((e) => e.userId === userId)
  },

  async studentsOf(teacherId): Promise<{ enrollment: Enrollment; user: PlatformUser; course: Course }[]> {
    const teacherCourses = db().courses.filter((c) => c.teacherId === teacherId)
    const ids = new Set(teacherCourses.map((c) => c.id))
    return db().enrollments
      .filter((e) => ids.has(e.courseId))
      .map((enrollment) => {
        const user = db().users.find((u) => u.id === enrollment.userId)!
        const course = teacherCourses.find((c) => c.id === enrollment.courseId)!
        return { enrollment, user, course }
      })
  },

  async listFeed(opts): Promise<Post[]> {
    let list = [...db().posts]
    if (opts?.authorRole) {
      const ids = new Set(db().users.filter((u) => u.role === opts.authorRole).map((u) => u.id))
      list = list.filter((p) => ids.has(p.authorId))
    }
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (opts?.limit) list = list.slice(0, opts.limit)
    return list
  },

  async createPost(input): Promise<Post> {
    const p: Post = {
      ...input,
      id: newId('p'),
      createdAt: now(),
      likeCount: 0,
      commentCount: 0
    }
    db().posts.unshift(p)
    persist()
    return p
  },

  async like(userId, postId): Promise<{ liked: boolean; likeCount: number }> {
    const i = db().likes.findIndex((l) => l.userId === userId && l.postId === postId)
    const pi = db().posts.findIndex((p) => p.id === postId)
    if (i >= 0) {
      db().likes.splice(i, 1)
      if (pi >= 0) db().posts[pi] = { ...db().posts[pi], likeCount: Math.max(0, db().posts[pi].likeCount - 1) }
      persist()
      return { liked: false, likeCount: db().posts[pi]?.likeCount ?? 0 }
    }
    db().likes.push({ userId, postId, createdAt: now() })
    if (pi >= 0) db().posts[pi] = { ...db().posts[pi], likeCount: db().posts[pi].likeCount + 1 }
    persist()
    return { liked: true, likeCount: db().posts[pi]?.likeCount ?? 0 }
  },

  async save(userId, target): Promise<{ saved: boolean }> {
    const match = (s: Save): boolean => s.userId === userId && s.target.kind === target.kind && s.target.id === target.id
    const i = db().saves.findIndex(match)
    if (i >= 0) { db().saves.splice(i, 1); persist(); return { saved: false } }
    db().saves.push({ userId, target, createdAt: now() })
    persist()
    return { saved: true }
  },

  async isSaved(userId, target): Promise<boolean> {
    return db().saves.some((s) => s.userId === userId && s.target.kind === target.kind && s.target.id === target.id)
  },

  async isLiked(userId, postId): Promise<boolean> {
    return db().likes.some((l) => l.userId === userId && l.postId === postId)
  },

  async listSaved(userId): Promise<Save[]> {
    return db().saves.filter((s) => s.userId === userId)
  },

  async listLikes(userId): Promise<Like[]> {
    return db().likes.filter((l) => l.userId === userId)
  },

  async follow(followerId, followingId): Promise<{ following: boolean }> {
    if (followerId === followingId) return { following: false }
    const i = db().follows.findIndex((f) => f.followerId === followerId && f.followingId === followingId)
    if (i >= 0) { db().follows.splice(i, 1); persist(); return { following: false } }
    db().follows.push({ followerId, followingId, createdAt: now() })
    persist()
    return { following: true }
  },

  async isFollowing(followerId, followingId): Promise<boolean> {
    return db().follows.some((f) => f.followerId === followerId && f.followingId === followingId)
  },

  async followers(userId): Promise<PlatformUser[]> {
    const ids = db().follows.filter((f) => f.followingId === userId).map((f) => f.followerId)
    return db().users.filter((u) => ids.includes(u.id))
  },

  async following(userId): Promise<PlatformUser[]> {
    const ids = db().follows.filter((f) => f.followerId === userId).map((f) => f.followingId)
    return db().users.filter((u) => ids.includes(u.id))
  },

  async followCounts(userId): Promise<{ followers: number; following: number }> {
    return {
      followers: db().follows.filter((f) => f.followingId === userId).length,
      following: db().follows.filter((f) => f.followerId === userId).length
    }
  },

  async listLiveNow(filter): Promise<LiveStream[]> {
    let list = [...db().streams]
    if (filter?.language) list = list.filter((s) => s.language === filter.language)
    return list
  },

  async listAnnouncements(): Promise<LiveAnnouncement[]> {
    return [...db().announcements]
  },

  async listNotifs(userId): Promise<Notif[]> {
    return db().notifs.filter((n) => n.userId === userId)
  },

  async markAllRead(userId): Promise<void> {
    db().notifs = db().notifs.map((n) => n.userId === userId ? { ...n, read: true } : n)
    persist()
  }
}
