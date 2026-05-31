/**
 * Backend service contract. All renderer pages talk to a `Backend` instance,
 * never directly to localStorage / IPC / Supabase. This is the single seam
 * we swap when moving from the in-memory local store to real Supabase.
 *
 * Method names use Supabase-friendly shapes (the queries are list/get/upsert)
 * so the swap is mechanical.
 */
import type {
  ActivityEvent,
  Challenge,
  ChallengeParticipant,
  Course,
  DmMessage,
  DmThread,
  Enrollment,
  Follow,
  Group,
  Lesson,
  Like,
  LiveAnnouncement,
  LiveStream,
  MediaAsset,
  Notif,
  PlatformUser,
  Post,
  Review,
  Save,
  TargetLanguage,
  Unit,
  UserStats,
  VocabItem,
  ExamAttempt,
  ExamKind
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
  signOut(): Promise<void>
  getUser(id: ID): Promise<PlatformUser | null>
  updateUser(id: ID, patch: Partial<PlatformUser>): Promise<PlatformUser>
  /** List users (for search / DM start / admin). */
  listUsers(filter?: { role?: 'student' | 'teacher'; q?: string; limit?: number }): Promise<PlatformUser[]>

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
  /** Update a learner's progress on a course (0–100). */
  setEnrollmentProgress(userId: ID, courseId: ID, progress: number): Promise<Enrollment>
  /** Students enrolled in a teacher's catalog. */
  studentsOf(teacherId: ID): Promise<{ enrollment: Enrollment; user: PlatformUser; course: Course }[]>

  // Reviews
  listReviews(courseId: ID): Promise<Review[]>
  createReview(input: Omit<Review, 'id' | 'createdAt'>): Promise<Review>
  myReview(userId: ID, courseId: ID): Promise<Review | null>

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

  // Groups / clubs
  listGroups(filter?: { language?: TargetLanguage; q?: string }): Promise<Group[]>
  getGroup(id: ID): Promise<Group | null>
  upsertGroup(group: Group): Promise<Group>
  joinGroup(userId: ID, groupId: ID): Promise<{ joined: boolean; memberCount: number }>
  leaveGroup(userId: ID, groupId: ID): Promise<void>
  myGroups(userId: ID): Promise<Group[]>
  groupMembers(groupId: ID): Promise<PlatformUser[]>

  // Challenges
  listChallenges(filter?: { language?: TargetLanguage; active?: boolean }): Promise<Challenge[]>
  getChallenge(id: ID): Promise<Challenge | null>
  upsertChallenge(challenge: Challenge): Promise<Challenge>
  joinChallenge(userId: ID, challengeId: ID): Promise<ChallengeParticipant>
  leaveChallenge(userId: ID, challengeId: ID): Promise<void>
  updateChallengeProgress(userId: ID, challengeId: ID, progress: number): Promise<ChallengeParticipant>
  myChallenges(userId: ID): Promise<{ challenge: Challenge; participant: ChallengeParticipant }[]>

  // Exam attempts
  recordExamAttempt(input: Omit<ExamAttempt, 'id' | 'takenAt'> & { takenAt?: string }): Promise<ExamAttempt>
  listExamAttempts(userId: ID, kind?: ExamKind): Promise<ExamAttempt[]>

  // Vocabulary items (FSRS)
  listVocab(userId: ID, opts?: { language?: TargetLanguage; deck?: string }): Promise<VocabItem[]>
  upsertVocab(item: VocabItem): Promise<VocabItem>
  deleteVocab(id: ID): Promise<void>
  /** Items whose `due` is now-or-earlier (the review queue). */
  dueVocab(userId: ID, language?: TargetLanguage): Promise<VocabItem[]>

  // Direct messages
  listThreads(userId: ID): Promise<DmThread[]>
  getOrCreateThread(userId: ID, otherUserId: ID): Promise<DmThread>
  listMessages(threadId: ID): Promise<DmMessage[]>
  sendMessage(input: { threadId: ID; senderId: ID; text: string; attachment?: DmMessage['attachment'] }): Promise<DmMessage>
  markThreadRead(threadId: ID, userId: ID): Promise<void>

  // Media assets
  listMedia(ownerId: ID, kind?: MediaAsset['kind']): Promise<MediaAsset[]>
  createMedia(input: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<MediaAsset>
  deleteMedia(id: ID): Promise<void>

  // Live
  listLiveNow(filter?: { language?: string }): Promise<LiveStream[]>
  listAnnouncements(): Promise<LiveAnnouncement[]>
  createAnnouncement(input: Omit<LiveAnnouncement, 'id'>): Promise<LiveAnnouncement>

  // Notifications
  listNotifs(userId: ID): Promise<Notif[]>
  createNotif(input: Omit<Notif, 'id' | 'createdAt' | 'read'>): Promise<Notif>
  /** Mark a single notification read (or unread). Powers per-item read-on-click. */
  markNotif(id: ID, read?: boolean): Promise<void>
  markAllRead(userId: ID): Promise<void>

  // Stats & activity (foundation for Progress #6 / Gamification #18)
  getStats(userId: ID): Promise<UserStats>
  recordActivity(event: Omit<ActivityEvent, 'id' | 'createdAt'>): Promise<{ event: ActivityEvent; stats: UserStats }>
  listActivity(userId: ID, opts?: { since?: string; limit?: number }): Promise<ActivityEvent[]>
  setDailyGoal(userId: ID, minutes: number): Promise<UserStats>

  // Privacy / GDPR (#39)
  /** Full export of everything tied to a user (right to data portability). */
  exportUserData(userId: ID): Promise<Record<string, unknown>>
  /** Hard-delete everything tied to a user (right to erasure). */
  deleteUserData(userId: ID): Promise<void>
}
