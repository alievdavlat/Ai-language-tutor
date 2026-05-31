/**
 * Learning-paths store (#A1). localStorage-backed (mirrors services/stories,
 * exams, roleplay) so the curated multi-course specializations stay real +
 * editable, and teachers/admins can later author NEW paths.
 *
 * A path is an ORDERED list of REAL course IDs (see services/backend/seed.ts).
 * Everything else is derived from those courses at render time:
 *   • course count  = courseIds.length
 *   • hours         = Σ course.hours
 *   • level span    = min→max member-course level
 *   • rating        = mean of member-course ratings (hidden until > 0)
 *   • YOUR progress = mean of your enrollment % across the member courses
 *                     (a course you haven't enrolled in counts as 0%).
 *
 * Path enrolment is persisted separately (speakai.pathEnrollments.v1) so
 * "Enroll in path" actually enrols the learner in every member course.
 */
import { useEffect, useState } from 'react'
import type { Course, Enrollment, ID } from '@shared/types'

const PATHS_KEY = 'speakai.paths.v1'
const ENROLL_KEY = 'speakai.pathEnrollments.v1'

/** Goal tag used by the placement quiz to match a learner to a path. */
export type PathGoal = 'exam' | 'business' | 'travel' | 'foundations'

export interface LearningPath {
  id: string
  title: string
  subtitle: string
  /** Display level span, e.g. "B1 → C1". */
  level: string
  /** Gradient fallback class (e.g. "from-rose-500 to-pink-700"). */
  cover: string
  thumbnailUrl?: string
  capstone: string
  /** Ordered REAL course IDs that make up the path. */
  courseIds: ID[]
  /** Placement-quiz goal this path serves. */
  goal: PathGoal
  builtIn?: boolean
  authorId?: string
  createdAt?: string
}

/** Curated paths, wired to the real seed courses (services/backend/seed.ts). */
const SEED_PATHS: LearningPath[] = [
  {
    id: 'ielts-7',
    title: 'IELTS 7.0 Track',
    subtitle: 'Speaking, pronunciation & grammar — built around the mock exam',
    level: 'B1 → C1',
    cover: 'from-rose-500 to-pink-700',
    thumbnailUrl: 'https://picsum.photos/seed/path-ielts/800/450',
    capstone: 'Full IELTS mock exam + Band-7 portfolio review',
    courseIds: ['c_ielts7', 'c_pronun', 'c_egiu'],
    goal: 'exam'
  },
  {
    id: 'business',
    title: 'Business English Career',
    subtitle: 'Negotiations, meetings, emails — get hired internationally',
    level: 'B1 → C1',
    cover: 'from-sky-500 to-blue-700',
    thumbnailUrl: 'https://picsum.photos/seed/path-business/800/450',
    capstone: 'Stakeholder presentation + business email portfolio',
    courseIds: ['c_business', 'c_everyday', 'c_egiu'],
    goal: 'business'
  },
  {
    id: 'travel',
    title: 'Travel & Survival English',
    subtitle: 'Restaurants, taxis, hotels — sound natural on the go',
    level: 'A1 → A2',
    cover: 'from-emerald-500 to-teal-700',
    thumbnailUrl: 'https://picsum.photos/seed/path-travel/800/450',
    capstone: 'Real-life roleplay marathon',
    courseIds: ['c_everyday', 'c_pronun'],
    goal: 'travel'
  },
  {
    id: 'foundations',
    title: 'English Foundations',
    subtitle: 'Build your A1 → B1 base step by step',
    level: 'A1 → B1',
    cover: 'from-amber-500 to-orange-700',
    thumbnailUrl: 'https://picsum.photos/seed/path-foundations/800/450',
    capstone: 'CEFR placement test + skill diploma',
    courseIds: ['c_egiu', 'c_everyday', 'c_pronun'],
    goal: 'foundations'
  }
]

function seed(): LearningPath[] {
  return SEED_PATHS.map((p) => ({ ...p, builtIn: true, authorId: 'system' }))
}

function db(): LearningPath[] {
  try {
    const raw = window.localStorage?.getItem(PATHS_KEY)
    if (raw) return JSON.parse(raw) as LearningPath[]
  } catch {
    /* seed */
  }
  const s = seed()
  try { window.localStorage?.setItem(PATHS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}

function save(list: LearningPath[]): void {
  try { window.localStorage?.setItem(PATHS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

interface PathEnrollment {
  userId: ID
  pathId: string
  enrolledAt: string
}

function enrollDb(): PathEnrollment[] {
  try {
    const raw = window.localStorage?.getItem(ENROLL_KEY)
    if (raw) return JSON.parse(raw) as PathEnrollment[]
  } catch {
    /* none */
  }
  return []
}

function saveEnroll(list: PathEnrollment[]): void {
  try { window.localStorage?.setItem(ENROLL_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export const paths = {
  list(): LearningPath[] {
    return db()
  },
  get(id: string): LearningPath | undefined {
    return db().find((p) => p.id === id)
  },
  upsert(path: LearningPath): LearningPath {
    const list = db()
    const idx = list.findIndex((p) => p.id === path.id)
    if (idx >= 0) { list[idx] = path; save(list); return path }
    const created = { ...path, createdAt: new Date(0).toISOString() }
    save([created, ...list])
    return created
  },
  remove(id: string): void {
    save(db().filter((p) => p.id !== id))
  },

  // ── Enrolment ──────────────────────────────────────────────────────────
  isEnrolled(userId: ID, pathId: string): boolean {
    return enrollDb().some((e) => e.userId === userId && e.pathId === pathId)
  },
  enroll(userId: ID, pathId: string): void {
    const list = enrollDb()
    if (list.some((e) => e.userId === userId && e.pathId === pathId)) return
    saveEnroll([{ userId, pathId, enrolledAt: new Date(0).toISOString() }, ...list])
  },
  unenroll(userId: ID, pathId: string): void {
    saveEnroll(enrollDb().filter((e) => !(e.userId === userId && e.pathId === pathId)))
  },
  myPaths(userId: ID): string[] {
    return enrollDb().filter((e) => e.userId === userId).map((e) => e.pathId)
  },
  /** How many learners are enrolled in this path (real count). */
  enrolledCount(pathId: string): number {
    return enrollDb().filter((e) => e.pathId === pathId).length
  }
}

// ─── Derivations from member courses ────────────────────────────────────────

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export interface PathStats {
  courses: number
  hours: number
  /** Mean member-course rating, or 0 when none are rated yet. */
  rating: number
  /** Derived level span e.g. "A1 → B1", or the path's stored level. */
  levelSpan: string
}

/** Member courses (in path order), skipping any id that no longer exists. */
export function pathCourses(path: LearningPath, byId: Map<ID, Course>): Course[] {
  return path.courseIds.map((id) => byId.get(id)).filter((c): c is Course => !!c)
}

export function pathStats(path: LearningPath, byId: Map<ID, Course>): PathStats {
  const courses = pathCourses(path, byId)
  const hours = courses.reduce((sum, c) => sum + (c.hours || 0), 0)
  const rated = courses.filter((c) => c.rating > 0)
  const rating = rated.length ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 10) / 10 : 0
  const levels = courses
    .map((c) => LEVEL_ORDER.indexOf(c.level as (typeof LEVEL_ORDER)[number]))
    .filter((i) => i >= 0)
  let levelSpan = path.level
  if (levels.length) {
    const lo = LEVEL_ORDER[Math.min(...levels)]
    const hi = LEVEL_ORDER[Math.max(...levels)]
    levelSpan = lo === hi ? lo : `${lo} → ${hi}`
  }
  return { courses: courses.length, hours, rating, levelSpan }
}

/**
 * YOUR progress on a path = mean of your enrollment % across the member
 * courses. A course you haven't enrolled in counts as 0%. Returns null when
 * the path has no resolvable courses.
 */
export function pathProgress(path: LearningPath, byId: Map<ID, Course>, enrollments: Enrollment[]): number | null {
  const courses = pathCourses(path, byId)
  if (!courses.length) return null
  const total = courses.reduce((sum, c) => {
    const e = enrollments.find((en) => en.courseId === c.id)
    return sum + (e?.progress ?? 0)
  }, 0)
  return Math.round(total / courses.length)
}

/** React hook: full path list, refreshable after edits/enrolment. */
export function usePaths(): { list: LearningPath[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<LearningPath[]>(() => paths.list())
  useEffect(() => { setList(paths.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
