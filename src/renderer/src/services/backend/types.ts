/**
 * Backend service contract. All renderer pages talk to a `Backend` instance,
 * never directly to localStorage / IPC / Supabase. This is the single seam
 * we swap when moving from the in-memory local store to real Supabase.
 *
 * Method names use Supabase-friendly shapes (the queries are list/get/upsert)
 * so the swap is mechanical.
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

export interface CourseFilter {
  language?: string
  level?: string
  teacherId?: ID
  /** Free-text search across title + teacher name. */
  q?: string
}

export type ID = string

export interface Backend {
  /** Stable id for the current viewer. Null when signed out. */
  currentUserId(): ID | null

  // Users / auth
  signUp(input: { name: string; email: string; role: 'student' | 'teacher' }): Promise<PlatformUser>
  signIn(email: string): Promise<PlatformUser | null>
  getUser(id: ID): Promise<PlatformUser | null>
  updateUser(id: ID, patch: Partial<PlatformUser>): Promise<PlatformUser>

  // Courses
  listCourses(filter?: CourseFilter): Promise<Course[]>
  getCourse(id: ID): Promise<Course | null>
  upsertCourse(course: Course): Promise<Course>
  publishCourse(id: ID): Promise<Course>
  myCourses(teacherId: ID): Promise<Course[]>

  // Curriculum
  listUnits(courseId: ID): Promise<Unit[]>
  listLessons(unitId: ID): Promise<Lesson[]>
  upsertUnit(unit: Unit): Promise<Unit>
  upsertLesson(lesson: Lesson): Promise<Lesson>

  // Enrollments
  enroll(userId: ID, courseId: ID): Promise<Enrollment>
  unenroll(userId: ID, courseId: ID): Promise<void>
  myEnrollments(userId: ID): Promise<Enrollment[]>
  /** Students enrolled in a teacher's catalog. */
  studentsOf(teacherId: ID): Promise<{ enrollment: Enrollment; user: PlatformUser; course: Course }[]>

  // Community
  listFeed(opts?: { authorRole?: 'teacher' | 'student'; limit?: number }): Promise<Post[]>
  createPost(input: Omit<Post, 'id' | 'createdAt' | 'likeCount' | 'commentCount'>): Promise<Post>
  like(userId: ID, postId: ID): Promise<{ liked: boolean; likeCount: number }>
  save(userId: ID, target: Save['target']): Promise<{ saved: boolean }>
  isSaved(userId: ID, target: Save['target']): Promise<boolean>
  isLiked(userId: ID, postId: ID): Promise<boolean>
  listSaved(userId: ID): Promise<Save[]>
  listLikes(userId: ID): Promise<Like[]>

  // Follows
  follow(followerId: ID, followingId: ID): Promise<{ following: boolean }>
  isFollowing(followerId: ID, followingId: ID): Promise<boolean>
  followers(userId: ID): Promise<PlatformUser[]>
  following(userId: ID): Promise<PlatformUser[]>
  followCounts(userId: ID): Promise<{ followers: number; following: number }>

  // Live
  listLiveNow(filter?: { language?: string }): Promise<LiveStream[]>
  listAnnouncements(): Promise<LiveAnnouncement[]>

  // Notifications
  listNotifs(userId: ID): Promise<Notif[]>
  markAllRead(userId: ID): Promise<void>
}
