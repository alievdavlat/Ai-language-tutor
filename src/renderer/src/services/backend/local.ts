/**
 * In-process backend backed by localStorage. Implements the full `Backend`
 * contract so renderer pages can pretend Supabase is already there. Replace
 * the export in `services/backend/index.ts` with a real Supabase impl later.
 */
import type {
  ActivityEvent,
  Challenge,
  ChallengeParticipant,
  Comment,
  CommentTargetKind,
  CommentView,
  Course,
  DmMessage,
  DmThread,
  Enrollment,
  ExamAttempt,
  ExamKind,
  Follow,
  Group,
  GroupMember,
  GroupMembership,
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
  TargetLanguage,
  Unit,
  UserStats,
  VocabItem
} from '@shared/types'
import type { Backend, CourseFilter, ID } from './types'
import { computeStats } from './stats'
import { SEED_COURSES, SEED_LIVE, SEED_POSTS, SEED_ANNOUNCEMENTS, SEED_USERS, SEED_NOTIFS } from './seed'
import { SEED_UNITS, SEED_LESSONS } from '../content/curriculum'

// ─── Storage ───────────────────────────────────────────────────────────────

const LS_KEY = 'speakai.backend.v1'

interface Db {
  users: PlatformUser[]
  currentUserId: ID | null
  courses: Course[]
  units: Unit[]
  lessons: Lesson[]
  enrollments: Enrollment[]
  reviews: Review[]
  posts: Post[]
  likes: Like[]
  saves: Save[]
  follows: Follow[]
  /** One emoji reaction per user per post. */
  postReactions: { userId: ID; postId: ID; emoji: string }[]
  /** One poll vote per user per post. */
  pollVotes: { userId: ID; postId: ID; optionId: string }[]
  /** Threaded comments for any target (course/video/lesson/book/post). */
  comments: Comment[]
  commentLikes: { userId: ID; commentId: ID }[]
  groups: Group[]
  groupMembers: GroupMembership[]
  groupMessages: GroupMessage[]
  challenges: Challenge[]
  challengeParticipants: ChallengeParticipant[]
  examAttempts: ExamAttempt[]
  vocab: VocabItem[]
  threads: DmThread[]
  messages: DmMessage[]
  media: MediaAsset[]
  activity: ActivityEvent[]
  stats: UserStats[]
  streams: LiveStream[]
  announcements: LiveAnnouncement[]
  notifs: Notif[]
}

function emptyDb(): Db {
  return {
    users: [...SEED_USERS],
    currentUserId: null,
    courses: [...SEED_COURSES],
    units: [...SEED_UNITS],
    lessons: [...SEED_LESSONS],
    enrollments: [],
    reviews: [],
    posts: [...SEED_POSTS],
    likes: [],
    saves: [],
    follows: [],
    postReactions: [],
    pollVotes: [],
    comments: [],
    commentLikes: [],
    groups: [],
    groupMembers: [],
    groupMessages: [],
    challenges: [],
    challengeParticipants: [],
    examAttempts: [],
    vocab: [],
    threads: [],
    messages: [],
    media: [],
    activity: [],
    stats: [],
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
    return hydrateContent(JSON.parse(raw) as Db)
  } catch {
    const fresh = emptyDb()
    saveDb(fresh)
    return fresh
  }
}

/**
 * Back-fill the learning-content seed (courses curriculum) into an existing
 * store created before the content slice landed, without disturbing the user's
 * own rows (enrollments, vocab, etc.). Adds any missing seed courses and, when
 * the curriculum is empty, the units + lessons.
 */
function hydrateContent(stored: Db): Db {
  const next = { ...stored }
  const seedById = new Map(SEED_COURSES.map((c) => [c.id, c]))
  const existing = next.courses ?? []
  const courseIds = new Set(existing.map((c) => c.id))
  // Refresh the editorial/display fields of SEED courses already in the store
  // (truthful counts + cover/banner images) WITHOUT touching user-created
  // courses or any user rows (enrollments, progress, reviews live separately).
  next.courses = existing.map((c) => {
    const s = seedById.get(c.id)
    if (!s) return c // user-created course — leave it alone
    return { ...c, rating: s.rating, reviewCount: s.reviewCount, enrollmentCount: s.enrollmentCount, cover: s.cover, thumbnailUrl: s.thumbnailUrl, bannerUrl: s.bannerUrl }
  })
  const missingCourses = SEED_COURSES.filter((c) => !courseIds.has(c.id))
  if (missingCourses.length) next.courses = [...next.courses, ...missingCourses]
  if (!next.units || next.units.length === 0) next.units = [...SEED_UNITS]
  if (!next.lessons || next.lessons.length === 0) next.lessons = [...SEED_LESSONS]
  // Group chat shipped after some stores were created — guarantee the array.
  if (!next.groupMessages) next.groupMessages = []
  // Refresh seed announcements (adds hero images to pre-existing stores).
  const annById = new Map(SEED_ANNOUNCEMENTS.map((a) => [a.id, a]))
  if (next.announcements?.length) {
    next.announcements = next.announcements.map((a) => {
      const s = annById.get(a.id)
      return s ? { ...a, cover: s.cover, imageUrl: s.imageUrl } : a
    })
  }
  // Default the Connect-feed collections for stores created before #A28.
  if (!Array.isArray(next.postReactions)) next.postReactions = []
  if (!Array.isArray(next.pollVotes)) next.pollVotes = []
  if (!Array.isArray(next.commentLikes)) next.commentLikes = []
  if (!Array.isArray(next.comments)) {
    next.comments = []
    // One-time import of the legacy localStorage comments store (course comments
    // lived in `speakai.comments.v1` before comments moved into the backend).
    try {
      const legacyRaw = window.localStorage.getItem('speakai.comments.v1')
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as { comments?: Comment[]; likes?: { userId: ID; commentId: ID }[] }
        if (Array.isArray(legacy.comments)) next.comments = legacy.comments
        if (Array.isArray(legacy.likes)) next.commentLikes = legacy.likes
      }
    } catch { /* ignore malformed legacy store */ }
  }
  return next
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

/**
 * Apply an optional `{ limit, offset }` window to an already-sorted list.
 * No window ⇒ returns the list untouched (backward-compatible default).
 */
function paginate<T>(list: T[], page?: { limit?: number; offset?: number }): T[] {
  const offset = page?.offset && page.offset > 0 ? page.offset : 0
  if (offset === 0 && page?.limit == null) return list
  return page?.limit != null ? list.slice(offset, offset + page.limit) : list.slice(offset)
}

/** Real member count for a group = number of membership rows (owner included). */
function groupMemberCount(groupId: ID): number {
  return db().groupMembers.filter((m) => m.groupId === groupId).length
}
/** Return a copy of the group whose `memberCount` is the true membership-row
 *  count, never the seed's invented vanity number. */
function withRealCount(g: Group): Group {
  return { ...g, memberCount: groupMemberCount(g.id) }
}

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

  async signOut(): Promise<void> {
    db().currentUserId = null
    persist()
  },

  async getUser(id): Promise<PlatformUser | null> {
    return db().users.find((u) => u.id === id) ?? null
  },

  async listUsers(filter): Promise<PlatformUser[]> {
    let list = [...db().users]
    if (filter?.role) list = list.filter((u) => u.role === filter.role)
    if (filter?.q) {
      const q = filter.q.toLowerCase()
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return paginate(list, filter)
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
    const sorted = [...list].sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    return paginate(sorted, filter)
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

  async deleteCourse(id): Promise<void> {
    const unitIds = new Set(db().units.filter((u) => u.courseId === id).map((u) => u.id))
    db().courses = db().courses.filter((c) => c.id !== id)
    db().units = db().units.filter((u) => u.courseId !== id)
    db().lessons = db().lessons.filter((l) => !unitIds.has(l.unitId))
    db().enrollments = db().enrollments.filter((e) => e.courseId !== id)
    db().reviews = db().reviews.filter((r) => r.courseId !== id)
    persist()
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

  async setEnrollmentProgress(userId, courseId, progress): Promise<Enrollment> {
    const i = db().enrollments.findIndex((e) => e.userId === userId && e.courseId === courseId)
    const clamped = Math.max(0, Math.min(100, Math.round(progress)))
    if (i < 0) {
      const e: Enrollment = { userId, courseId, progress: clamped, lastActiveAt: now(), enrolledAt: now(), completedAt: clamped >= 100 ? now() : undefined }
      db().enrollments.push(e)
      persist()
      return e
    }
    db().enrollments[i] = {
      ...db().enrollments[i],
      progress: clamped,
      lastActiveAt: now(),
      completedAt: clamped >= 100 ? (db().enrollments[i].completedAt ?? now()) : undefined
    }
    persist()
    return db().enrollments[i]
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
    // Group-scoped posts live in their group's feed, not the global one.
    let list = db().posts.filter((p) => !p.groupId)
    if (opts?.authorRole) {
      const ids = new Set(db().users.filter((u) => u.role === opts.authorRole).map((u) => u.id))
      list = list.filter((p) => ids.has(p.authorId))
    }
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(list, opts)
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

  async reactToPost(userId, postId, emoji): Promise<{ reactions: Record<string, number>; myReaction: string | null }> {
    const rows = db().postReactions
    const existing = rows.find((r) => r.userId === userId && r.postId === postId)
    let myReaction: string | null = emoji
    if (existing) {
      if (existing.emoji === emoji) {
        // Same emoji tapped again → withdraw the reaction.
        db().postReactions = rows.filter((r) => !(r.userId === userId && r.postId === postId))
        myReaction = null
      } else {
        existing.emoji = emoji
      }
    } else {
      rows.push({ userId, postId, emoji })
    }
    // Recompute the counts map and persist it onto the post so listFeed returns it.
    const counts: Record<string, number> = {}
    for (const r of db().postReactions.filter((r) => r.postId === postId)) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1
    }
    const pi = db().posts.findIndex((p) => p.id === postId)
    if (pi >= 0) db().posts[pi] = { ...db().posts[pi], reactions: counts }
    persist()
    return { reactions: counts, myReaction }
  },

  async myReaction(userId, postId): Promise<string | null> {
    return db().postReactions.find((r) => r.userId === userId && r.postId === postId)?.emoji ?? null
  },

  async votePoll(userId, postId, optionId): Promise<{ poll: Poll; myVote: string | null }> {
    const pi = db().posts.findIndex((p) => p.id === postId)
    const post = pi >= 0 ? db().posts[pi] : undefined
    if (!post?.poll) throw new Error('Post has no poll')
    const votes = db().pollVotes
    const existing = votes.find((v) => v.userId === userId && v.postId === postId)
    let myVote: string | null = optionId
    if (existing) {
      if (existing.optionId === optionId) {
        db().pollVotes = votes.filter((v) => !(v.userId === userId && v.postId === postId))
        myVote = null
      } else {
        existing.optionId = optionId
      }
    } else {
      votes.push({ userId, postId, optionId })
    }
    // Recompute per-option tallies from the vote rows + persist on the post.
    const tally: Record<string, number> = {}
    for (const v of db().pollVotes.filter((v) => v.postId === postId)) {
      tally[v.optionId] = (tally[v.optionId] ?? 0) + 1
    }
    const poll: Poll = {
      ...post.poll,
      options: post.poll.options.map((o) => ({ ...o, votes: tally[o.id] ?? 0 }))
    }
    db().posts[pi] = { ...post, poll }
    persist()
    return { poll, myVote }
  },

  async myPollVote(userId, postId): Promise<string | null> {
    return db().pollVotes.find((v) => v.userId === userId && v.postId === postId)?.optionId ?? null
  },

  async joinStudySession(userId, postId): Promise<{ joined: boolean; joinedIds: ID[] }> {
    const pi = db().posts.findIndex((p) => p.id === postId)
    const post = pi >= 0 ? db().posts[pi] : undefined
    if (!post?.studySession) throw new Error('Post has no study session')
    const set = new Set(post.studySession.joinedIds)
    let joined: boolean
    if (set.has(userId)) { set.delete(userId); joined = false }
    else { set.add(userId); joined = true }
    const joinedIds = Array.from(set)
    db().posts[pi] = { ...post, studySession: { ...post.studySession, joinedIds } }
    persist()
    return { joined, joinedIds }
  },

  async listComments(targetKind, targetId, viewerId): Promise<CommentView[]> {
    return db().comments
      .filter((c) => c.targetKind === targetKind && c.targetId === targetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((c) => ({
        ...c,
        likeCount: db().commentLikes.filter((l) => l.commentId === c.id).length,
        likedByMe: !!viewerId && db().commentLikes.some((l) => l.commentId === c.id && l.userId === viewerId)
      }))
  },

  async addComment(input): Promise<Comment> {
    const c: Comment = {
      id: newId('cm'),
      targetKind: input.targetKind,
      targetId: input.targetId,
      authorId: input.authorId,
      text: input.text.trim(),
      parentId: input.parentId,
      createdAt: now()
    }
    db().comments.unshift(c)
    // Keep post.commentCount in sync for the feed action bar.
    if (input.targetKind === 'post') {
      const pi = db().posts.findIndex((p) => p.id === input.targetId)
      if (pi >= 0) db().posts[pi] = { ...db().posts[pi], commentCount: db().posts[pi].commentCount + 1 }
    }
    persist()
    return c
  },

  async removeComment(commentId): Promise<void> {
    const c = db().comments.find((x) => x.id === commentId)
    // Removing a top-level comment also removes its replies.
    const removedIds = new Set<ID>([commentId, ...db().comments.filter((x) => x.parentId === commentId).map((x) => x.id)])
    db().comments = db().comments.filter((x) => !removedIds.has(x.id))
    db().commentLikes = db().commentLikes.filter((l) => !removedIds.has(l.commentId))
    if (c?.targetKind === 'post') {
      const pi = db().posts.findIndex((p) => p.id === c.targetId)
      if (pi >= 0) db().posts[pi] = { ...db().posts[pi], commentCount: Math.max(0, db().posts[pi].commentCount - removedIds.size) }
    }
    persist()
  },

  async toggleCommentLike(commentId, userId): Promise<{ liked: boolean; count: number }> {
    const i = db().commentLikes.findIndex((l) => l.commentId === commentId && l.userId === userId)
    if (i >= 0) db().commentLikes.splice(i, 1)
    else db().commentLikes.push({ userId, commentId })
    persist()
    return {
      liked: i < 0,
      count: db().commentLikes.filter((l) => l.commentId === commentId).length
    }
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

  async createLiveStream(input): Promise<LiveStream> {
    const s: LiveStream = {
      id: newId('ls'),
      hostId: input.hostId,
      title: input.title,
      category: input.category,
      language: input.language,
      viewerCount: 0,
      startedAt: now(),
      cover: input.cover ?? 'from-brand-700 to-indigo-900',
      imageUrl: input.imageUrl
    }
    db().streams.unshift(s)
    persist()
    return s
  },

  async endLiveStream(id): Promise<void> {
    const d = db()
    d.streams = d.streams.filter((s) => s.id !== id)
    persist()
  },

  async listAnnouncements(): Promise<LiveAnnouncement[]> {
    return [...db().announcements]
  },

  async createAnnouncement(input): Promise<LiveAnnouncement> {
    const a: LiveAnnouncement = { ...input, id: newId('a') }
    db().announcements.unshift(a)
    persist()
    return a
  },

  async listNotifs(userId): Promise<Notif[]> {
    return db().notifs.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async createNotif(input): Promise<Notif> {
    const n: Notif = { ...input, id: newId('n'), read: false, createdAt: now() }
    db().notifs.unshift(n)
    persist()
    return n
  },

  async markNotif(id, read = true): Promise<void> {
    db().notifs = db().notifs.map((n) => (n.id === id ? { ...n, read } : n))
    persist()
  },

  async markAllRead(userId): Promise<void> {
    db().notifs = db().notifs.map((n) => n.userId === userId ? { ...n, read: true } : n)
    persist()
  },

  // ─── Reviews ───────────────────────────────────────────────────────────────

  async listReviews(courseId): Promise<Review[]> {
    return db().reviews.filter((r) => r.courseId === courseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async createReview(input): Promise<Review> {
    // One review per user per course — replace if it exists.
    const existing = db().reviews.findIndex((r) => r.courseId === input.courseId && r.userId === input.userId)
    const review: Review = { ...input, id: existing >= 0 ? db().reviews[existing].id : newId('rv'), createdAt: now() }
    if (existing >= 0) db().reviews[existing] = review
    else db().reviews.push(review)
    // Recompute the course rating + reviewCount.
    const courseReviews = db().reviews.filter((r) => r.courseId === input.courseId)
    const ci = db().courses.findIndex((c) => c.id === input.courseId)
    if (ci >= 0) {
      const avg = courseReviews.reduce((s, r) => s + r.rating, 0) / courseReviews.length
      db().courses[ci] = { ...db().courses[ci], rating: Math.round(avg * 10) / 10, reviewCount: courseReviews.length }
    }
    persist()
    return review
  },

  async myReview(userId, courseId): Promise<Review | null> {
    return db().reviews.find((r) => r.userId === userId && r.courseId === courseId) ?? null
  },

  // ─── Groups / clubs ──────────────────────────────────────────────────────────

  // `memberCount` is NEVER a stored vanity number — it is always recomputed from
  // the real `groupMembers` rows so the count on every card / header reflects
  // actual membership (owner + everyone who joined). #A53.
  // (`groupMemberCount` + `withRealCount` are module helpers defined below.)

  async listGroups(filter): Promise<Group[]> {
    let list = db().groups.filter((g) => g.visibility === 'public')
    if (filter?.language) list = list.filter((g) => g.language === filter.language)
    if (filter?.q) {
      const q = filter.q.toLowerCase()
      list = list.filter((g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
    }
    return list.map(withRealCount).sort((a, b) => b.memberCount - a.memberCount)
  },

  async getGroup(id): Promise<Group | null> {
    const g = db().groups.find((x) => x.id === id)
    return g ? withRealCount(g) : null
  },

  async upsertGroup(group): Promise<Group> {
    const i = db().groups.findIndex((g) => g.id === group.id)
    if (i < 0) {
      db().groups.push(group)
      // Owner auto-joins.
      if (!db().groupMembers.some((m) => m.groupId === group.id && m.userId === group.ownerId)) {
        db().groupMembers.push({ groupId: group.id, userId: group.ownerId, role: 'owner', joinedAt: now() })
      }
    } else db().groups[i] = group
    persist()
    return withRealCount(group)
  },

  async joinGroup(userId, groupId): Promise<{ joined: boolean; memberCount: number }> {
    const already = db().groupMembers.some((m) => m.groupId === groupId && m.userId === userId)
    if (!already) db().groupMembers.push({ groupId, userId, role: 'member', joinedAt: now() })
    persist()
    return { joined: true, memberCount: groupMemberCount(groupId) }
  },

  async leaveGroup(userId, groupId): Promise<void> {
    // The owner can't leave their own group (would orphan it).
    const m = db().groupMembers.find((x) => x.groupId === groupId && x.userId === userId)
    if (m?.role === 'owner') return
    db().groupMembers = db().groupMembers.filter((x) => !(x.groupId === groupId && x.userId === userId))
    persist()
  },

  async myGroups(userId): Promise<Group[]> {
    const ids = new Set(db().groupMembers.filter((m) => m.userId === userId).map((m) => m.groupId))
    return db().groups.filter((g) => ids.has(g.id)).map(withRealCount)
  },

  async groupMembers(groupId): Promise<PlatformUser[]> {
    const ids = db().groupMembers.filter((m) => m.groupId === groupId).map((m) => m.userId)
    return db().users.filter((u) => ids.includes(u.id))
  },

  async groupMembership(groupId): Promise<GroupMember[]> {
    const roleRank: Record<GroupMembership['role'], number> = { owner: 0, moderator: 1, member: 2 }
    const byId = new Map(db().users.map((u) => [u.id, u]))
    return db().groupMembers
      .filter((m) => m.groupId === groupId)
      .map((m) => ({ user: byId.get(m.userId), role: m.role, joinedAt: m.joinedAt }))
      .filter((m): m is GroupMember => Boolean(m.user))
      .sort((a, b) => roleRank[a.role] - roleRank[b.role] || a.joinedAt.localeCompare(b.joinedAt))
  },

  async listGroupFeed(groupId, opts): Promise<Post[]> {
    let list = db().posts.filter((p) => p.groupId === groupId)
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (opts?.limit) list = list.slice(0, opts.limit)
    return list
  },

  async listGroupMessages(groupId): Promise<GroupMessage[]> {
    return db().groupMessages
      .filter((m) => m.groupId === groupId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async sendGroupMessage(input): Promise<GroupMessage> {
    const msg: GroupMessage = { ...input, id: newId('gm'), createdAt: now() }
    db().groupMessages.push(msg)
    persist()
    return msg
  },

  async deleteGroup(id): Promise<void> {
    db().groups = db().groups.filter((g) => g.id !== id)
    db().groupMembers = db().groupMembers.filter((m) => m.groupId !== id)
    persist()
  },

  // ─── Challenges ────────────────────────────────────────────────────────────

  async listChallenges(filter): Promise<Challenge[]> {
    let list = [...db().challenges]
    if (filter?.language) list = list.filter((c) => c.language === filter.language)
    if (filter?.active) {
      const t = now()
      list = list.filter((c) => c.startsAt <= t && c.endsAt >= t)
    }
    return list.sort((a, b) => b.participantCount - a.participantCount)
  },

  async getChallenge(id): Promise<Challenge | null> {
    return db().challenges.find((c) => c.id === id) ?? null
  },

  async upsertChallenge(challenge): Promise<Challenge> {
    const i = db().challenges.findIndex((c) => c.id === challenge.id)
    if (i < 0) db().challenges.push(challenge)
    else db().challenges[i] = challenge
    persist()
    return challenge
  },

  async joinChallenge(userId, challengeId): Promise<ChallengeParticipant> {
    const existing = db().challengeParticipants.find((p) => p.challengeId === challengeId && p.userId === userId)
    if (existing) return existing
    const p: ChallengeParticipant = { challengeId, userId, progress: 0, joinedAt: now() }
    db().challengeParticipants.push(p)
    const ci = db().challenges.findIndex((c) => c.id === challengeId)
    if (ci >= 0) db().challenges[ci] = { ...db().challenges[ci], participantCount: db().challenges[ci].participantCount + 1 }
    persist()
    return p
  },

  async leaveChallenge(userId, challengeId): Promise<void> {
    const before = db().challengeParticipants.length
    db().challengeParticipants = db().challengeParticipants.filter((p) => !(p.challengeId === challengeId && p.userId === userId))
    if (db().challengeParticipants.length < before) {
      const ci = db().challenges.findIndex((c) => c.id === challengeId)
      if (ci >= 0) db().challenges[ci] = { ...db().challenges[ci], participantCount: Math.max(0, db().challenges[ci].participantCount - 1) }
    }
    persist()
  },

  async updateChallengeProgress(userId, challengeId, progress): Promise<ChallengeParticipant> {
    const i = db().challengeParticipants.findIndex((p) => p.challengeId === challengeId && p.userId === userId)
    if (i < 0) {
      const p: ChallengeParticipant = { challengeId, userId, progress, joinedAt: now() }
      db().challengeParticipants.push(p)
      persist()
      return p
    }
    const challenge = db().challenges.find((c) => c.id === challengeId)
    const done = challenge ? progress >= challenge.goal : false
    db().challengeParticipants[i] = {
      ...db().challengeParticipants[i],
      progress,
      completedAt: done ? (db().challengeParticipants[i].completedAt ?? now()) : db().challengeParticipants[i].completedAt
    }
    persist()
    return db().challengeParticipants[i]
  },

  async myChallenges(userId): Promise<{ challenge: Challenge; participant: ChallengeParticipant }[]> {
    return db().challengeParticipants
      .filter((p) => p.userId === userId)
      .map((participant) => ({ challenge: db().challenges.find((c) => c.id === participant.challengeId)!, participant }))
      .filter((x) => !!x.challenge)
  },

  async deleteChallenge(id): Promise<void> {
    db().challenges = db().challenges.filter((c) => c.id !== id)
    db().challengeParticipants = db().challengeParticipants.filter((p) => p.challengeId !== id)
    persist()
  },

  // ─── Exam attempts ───────────────────────────────────────────────────────────

  async recordExamAttempt(input): Promise<ExamAttempt> {
    const attempt: ExamAttempt = { ...input, id: newId('ea'), takenAt: input.takenAt ?? now() }
    db().examAttempts.unshift(attempt)
    persist()
    return attempt
  },

  async listExamAttempts(userId, kind): Promise<ExamAttempt[]> {
    return db().examAttempts
      .filter((a) => a.userId === userId && (!kind || a.kind === kind))
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
  },

  // ─── Vocabulary (FSRS) ───────────────────────────────────────────────────────

  async listVocab(userId, opts): Promise<VocabItem[]> {
    let list = db().vocab.filter((v) => v.userId === userId)
    if (opts?.language) list = list.filter((v) => v.language === opts.language)
    if (opts?.deck) list = list.filter((v) => v.deck === opts.deck)
    return list.sort((a, b) => a.due.localeCompare(b.due))
  },

  async upsertVocab(item): Promise<VocabItem> {
    const i = db().vocab.findIndex((v) => v.id === item.id)
    if (i < 0) db().vocab.push(item)
    else db().vocab[i] = item
    persist()
    return item
  },

  async deleteVocab(id): Promise<void> {
    db().vocab = db().vocab.filter((v) => v.id !== id)
    persist()
  },

  async dueVocab(userId, language): Promise<VocabItem[]> {
    const t = now()
    return db().vocab
      .filter((v) => v.userId === userId && (!language || v.language === language) && v.due <= t)
      .sort((a, b) => a.due.localeCompare(b.due))
  },

  // ─── Direct messages ─────────────────────────────────────────────────────────

  async listThreads(userId): Promise<DmThread[]> {
    return db().threads
      .filter((th) => th.participantIds.includes(userId))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
  },

  async getOrCreateThread(userId, otherUserId): Promise<DmThread> {
    const existing = db().threads.find(
      (th) => th.participantIds.length === 2 && th.participantIds.includes(userId) && th.participantIds.includes(otherUserId)
    )
    if (existing) return existing
    const th: DmThread = { id: newId('th'), participantIds: [userId, otherUserId], lastMessageAt: now(), createdAt: now() }
    db().threads.push(th)
    persist()
    return th
  },

  async listMessages(threadId): Promise<DmMessage[]> {
    return db().messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async sendMessage(input): Promise<DmMessage> {
    const msg: DmMessage = {
      id: newId('m'),
      threadId: input.threadId,
      senderId: input.senderId,
      text: input.text,
      attachment: input.attachment,
      readBy: [input.senderId],
      createdAt: now()
    }
    db().messages.push(msg)
    const ti = db().threads.findIndex((th) => th.id === input.threadId)
    if (ti >= 0) db().threads[ti] = { ...db().threads[ti], lastMessageAt: msg.createdAt, lastMessageText: input.text }
    persist()
    return msg
  },

  async markThreadRead(threadId, userId): Promise<void> {
    db().messages = db().messages.map((m) =>
      m.threadId === threadId && !m.readBy.includes(userId) ? { ...m, readBy: [...m.readBy, userId] } : m
    )
    persist()
  },

  // ─── Media assets ──────────────────────────────────────────────────────────

  async listMedia(ownerId, kind): Promise<MediaAsset[]> {
    return db().media
      .filter((m) => m.ownerId === ownerId && (!kind || m.kind === kind))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async createMedia(input): Promise<MediaAsset> {
    const asset: MediaAsset = { ...input, id: newId('md'), createdAt: now() }
    db().media.unshift(asset)
    persist()
    return asset
  },

  async deleteMedia(id): Promise<void> {
    db().media = db().media.filter((m) => m.id !== id)
    persist()
  },

  // ─── Stats & activity ────────────────────────────────────────────────────────

  async getStats(userId): Promise<UserStats> {
    const existing = db().stats.find((s) => s.userId === userId)
    if (existing) return existing
    const fresh = computeStats(userId, db().activity, null, now())
    db().stats.push(fresh)
    persist()
    return fresh
  },

  async recordActivity(event): Promise<{ event: ActivityEvent; stats: UserStats }> {
    const ev: ActivityEvent = { ...event, id: newId('ac'), createdAt: now() }
    db().activity.push(ev)
    const prev = db().stats.find((s) => s.userId === ev.userId) ?? null
    const stats = computeStats(ev.userId, db().activity, prev, now())
    const si = db().stats.findIndex((s) => s.userId === ev.userId)
    if (si < 0) db().stats.push(stats)
    else db().stats[si] = stats
    persist()
    return { event: ev, stats }
  },

  async listActivity(userId, opts): Promise<ActivityEvent[]> {
    let list = db().activity.filter((e) => e.userId === userId)
    if (opts?.since) list = list.filter((e) => e.createdAt >= opts.since!)
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(list, opts)
  },

  async setDailyGoal(userId, minutes): Promise<UserStats> {
    const si = db().stats.findIndex((s) => s.userId === userId)
    const base = si >= 0 ? db().stats[si] : computeStats(userId, db().activity, null, now())
    const updated: UserStats = { ...base, dailyGoalMin: Math.max(5, Math.round(minutes)), updatedAt: now() }
    if (si < 0) db().stats.push(updated)
    else db().stats[si] = updated
    persist()
    return updated
  },

  // ─── Privacy / GDPR ──────────────────────────────────────────────────────────

  async exportUserData(userId): Promise<Record<string, unknown>> {
    const d = db()
    return {
      exportedAt: now(),
      user: d.users.find((u) => u.id === userId) ?? null,
      enrollments: d.enrollments.filter((e) => e.userId === userId),
      reviews: d.reviews.filter((r) => r.userId === userId),
      posts: d.posts.filter((p) => p.authorId === userId),
      likes: d.likes.filter((l) => l.userId === userId),
      saves: d.saves.filter((s) => s.userId === userId),
      follows: d.follows.filter((f) => f.followerId === userId || f.followingId === userId),
      groups: d.groupMembers.filter((m) => m.userId === userId),
      challenges: d.challengeParticipants.filter((p) => p.userId === userId),
      examAttempts: d.examAttempts.filter((a) => a.userId === userId),
      vocab: d.vocab.filter((v) => v.userId === userId),
      messages: d.messages.filter((m) => m.senderId === userId),
      media: d.media.filter((m) => m.ownerId === userId),
      activity: d.activity.filter((e) => e.userId === userId),
      stats: d.stats.find((s) => s.userId === userId) ?? null,
      notifications: d.notifs.filter((n) => n.userId === userId),
      comments: d.comments.filter((c) => c.authorId === userId),
      reactions: d.postReactions.filter((r) => r.userId === userId),
      pollVotes: d.pollVotes.filter((v) => v.userId === userId)
    }
  },

  async deleteUserData(userId): Promise<void> {
    const d = db()
    d.enrollments = d.enrollments.filter((e) => e.userId !== userId)
    d.reviews = d.reviews.filter((r) => r.userId !== userId)
    d.posts = d.posts.filter((p) => p.authorId !== userId)
    d.likes = d.likes.filter((l) => l.userId !== userId)
    d.saves = d.saves.filter((s) => s.userId !== userId)
    d.follows = d.follows.filter((f) => f.followerId !== userId && f.followingId !== userId)
    d.groupMembers = d.groupMembers.filter((m) => m.userId !== userId)
    d.groupMessages = d.groupMessages.filter((m) => m.senderId !== userId)
    d.challengeParticipants = d.challengeParticipants.filter((p) => p.userId !== userId)
    d.examAttempts = d.examAttempts.filter((a) => a.userId !== userId)
    d.vocab = d.vocab.filter((v) => v.userId !== userId)
    d.messages = d.messages.filter((m) => m.senderId !== userId)
    d.threads = d.threads.filter((th) => !th.participantIds.includes(userId))
    d.media = d.media.filter((m) => m.ownerId !== userId)
    d.activity = d.activity.filter((e) => e.userId !== userId)
    d.stats = d.stats.filter((s) => s.userId !== userId)
    d.notifs = d.notifs.filter((n) => n.userId !== userId)
    d.comments = d.comments.filter((c) => c.authorId !== userId)
    d.commentLikes = d.commentLikes.filter((l) => l.userId !== userId)
    d.postReactions = d.postReactions.filter((r) => r.userId !== userId)
    d.pollVotes = d.pollVotes.filter((v) => v.userId !== userId)
    d.users = d.users.filter((u) => u.id !== userId)
    if (d.currentUserId === userId) d.currentUserId = null
    persist()
  }
}
