/**
 * Simple, real ranking signals used by Home rails + Explore so "Popular",
 * "Top", "Trending" reflect actual data instead of insertion order. As real
 * enrollments / reviews / views accrue, ordering shifts automatically.
 */
import type { Course, LibraryItem } from '@shared/types'

function daysSince(iso?: string): number {
  if (!iso) return 9999
  return Math.max(0, (Date.now() - Date.parse(iso)) / 86_400_000)
}

/** Popularity score: enrollments + rating·reviews + a recency bonus for new courses. */
export function courseScore(c: Course): number {
  const enroll = c.enrollmentCount
  const social = c.reviewCount > 0 ? c.rating * c.reviewCount * 4 : 0
  const recency = Math.max(0, 30 - daysSince(c.publishedAt)) // newer = small boost
  return enroll + social + recency
}

export function rankCourses(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => courseScore(b) - courseScore(a))
}

/** Library "trending/new": most-recent first (swap to views when we track them). */
export function rankLibraryByRecency(items: LibraryItem[]): LibraryItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** People ranked by follower count (desc). */
export function rankByFollowers<T extends { followers: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.followers - a.followers)
}
