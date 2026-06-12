import { describe, it, expect } from 'vitest'
import type { Course, Enrollment, ID } from '@shared/types'
import { pathCourses, pathStats, pathProgress, type LearningPath } from './store'

/** Minimal Course fixture — only the fields the path math reads. */
function course(id: string, over: Partial<Course> = {}): Course {
  return {
    id,
    teacherId: 'u_t',
    title: id,
    description: '',
    level: 'B1',
    targetLanguage: 'en',
    cover: '',
    pricing: { kind: 'free' },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 0,
    ...over
  } as Course
}

const path: LearningPath = {
  id: 'p1',
  title: 'Test path',
  subtitle: '',
  cover: '',
  level: 'B1',
  goal: 'exam',
  capstone: '',
  authorId: 'system',
  builtIn: true,
  courseIds: ['c1', 'c2', 'missing']
} as LearningPath

describe('paths store math (#A1 — guards the "0 courses" regression)', () => {
  const byId = new Map<ID, Course>([
    ['c1', course('c1', { hours: 10, rating: 4, level: 'A2' })],
    ['c2', course('c2', { hours: 14, rating: 5, level: 'B2' })]
  ])

  it('pathCourses resolves only courses present in the catalog (drops missing ids)', () => {
    const resolved = pathCourses(path, byId)
    expect(resolved.map((c) => c.id)).toEqual(['c1', 'c2'])
    // the 'missing' id must NOT produce a phantom course (the bug that showed "0 courses")
    expect(resolved).toHaveLength(2)
  })

  it('pathStats sums hours, averages rating, spans levels', () => {
    const s = pathStats(path, byId)
    expect(s.courses).toBe(2)
    expect(s.hours).toBe(24)
    expect(s.rating).toBe(4.5)
    expect(s.levelSpan).toBe('A2 → B2')
  })

  it('pathStats reports 0 courses when none resolve (honest empty, not a crash)', () => {
    const empty = pathStats(path, new Map())
    expect(empty.courses).toBe(0)
    expect(empty.hours).toBe(0)
  })

  it('pathProgress is the mean enrollment % across member courses', () => {
    const enrollments = [
      { courseId: 'c1', progress: 100 },
      { courseId: 'c2', progress: 0 }
    ] as Enrollment[]
    expect(pathProgress(path, byId, enrollments)).toBe(50)
  })

  it('pathProgress is null when no member courses resolve', () => {
    expect(pathProgress(path, new Map(), [])).toBeNull()
  })
})
