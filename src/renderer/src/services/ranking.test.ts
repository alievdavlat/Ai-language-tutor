import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Course, LibraryItem } from '@shared/types'
import { courseScore, rankCourses, rankLibraryByRecency, rankByFollowers } from './ranking'

/** Minimal Course fixture — only the fields the ranking math reads. */
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

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-12T00:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('courseScore', () => {
  it('is enrollments only when there are no reviews and no publish date', () => {
    expect(courseScore(course('c', { enrollmentCount: 100 }))).toBe(100)
  })

  it('adds rating·reviews·4 as the social term', () => {
    const c = course('c', { enrollmentCount: 100, rating: 4.5, reviewCount: 10 })
    expect(courseScore(c)).toBe(100 + 4.5 * 10 * 4) // 280
  })

  it('gives newer courses a recency bonus that decays over 30 days', () => {
    const fresh = course('f', { publishedAt: '2026-06-10T00:00:00Z' }) // 2 days old
    const old = course('o', { publishedAt: '2025-01-01T00:00:00Z' })
    expect(courseScore(fresh)).toBe(28)
    expect(courseScore(old)).toBe(0)
  })

  it('rating with zero reviews contributes nothing', () => {
    expect(courseScore(course('c', { rating: 5, reviewCount: 0 }))).toBe(0)
  })
})

describe('rankCourses', () => {
  it('sorts by score descending without mutating the input', () => {
    const low = course('low', { enrollmentCount: 1 })
    const high = course('high', { enrollmentCount: 500 })
    const mid = course('mid', { enrollmentCount: 50, rating: 5, reviewCount: 10 }) // 50+200=250
    const input = [low, high, mid]
    const ranked = rankCourses(input)
    expect(ranked.map((c) => c.id)).toEqual(['high', 'mid', 'low'])
    expect(input.map((c) => c.id)).toEqual(['low', 'high', 'mid']) // untouched
  })
})

describe('rankLibraryByRecency', () => {
  it('orders by createdAt, newest first', () => {
    const items = [
      { id: 'a', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'c', createdAt: '2026-05-01T00:00:00Z' },
      { id: 'b', createdAt: '2026-03-01T00:00:00Z' }
    ] as LibraryItem[]
    expect(rankLibraryByRecency(items).map((i) => i.id)).toEqual(['c', 'b', 'a'])
    expect(items.map((i) => i.id)).toEqual(['a', 'c', 'b']) // input untouched
  })
})

describe('rankByFollowers', () => {
  it('orders by follower count descending', () => {
    const rows = [
      { name: 'x', followers: 10 },
      { name: 'y', followers: 999 },
      { name: 'z', followers: 0 }
    ]
    expect(rankByFollowers(rows).map((r) => r.name)).toEqual(['y', 'x', 'z'])
  })
})
