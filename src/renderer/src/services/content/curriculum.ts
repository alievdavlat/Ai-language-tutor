/**
 * Real curriculum (units + lessons) for the seeded courses. The backend's
 * `listUnits` / `listLessons` read these so every course has a clickable,
 * orderable path. Lesson ids are stable string keys so `lessonContent.ts` and
 * the progress store can reference them.
 *
 * `videoUrl` ids were verified embeddable via the YouTube oEmbed endpoint.
 */
import type { Lesson, Unit } from '@shared/types'

const yt = (id: string): string => `https://www.youtube.com/watch?v=${id}`

// Verified-embeddable pool (TED talks + music videos used as listening input).
export const VIDEO_IDS = {
  villani: 'Kc0Kthyo0hU',
  brown: 'iCvmsMzlF7o',
  duckworth: 'H14bBuluwB8',
  urban: 'arj7oStGLkU',
  happy: 'ZbZSe6N_BXs',
  stressed: 'pXRviuL6vMY',
  bohemian: 'fJ9rUzIMcZQ'
} as const

// ─── Units ───────────────────────────────────────────────────────────────────

export const SEED_UNITS: Unit[] = [
  // c_business — Business English 101 (the single seeded real course, 2026-05-31)
  { id: 'u_business_1', courseId: 'c_business', index: 0, title: 'Unit 1 · Email & messaging', about: 'Professional tone in writing.' },
  { id: 'u_business_2', courseId: 'c_business', index: 1, title: 'Unit 2 · Meetings', about: 'Lead, interrupt politely and summarise.' }
]

// ─── Lessons ─────────────────────────────────────────────────────────────────
// kind: 'video' opens the Classroom player · 'rule' opens the BookReader ·
// 'practice' opens the exercise player · 'exam' is a unit checkpoint.

export const SEED_LESSONS: Lesson[] = [
  // ── c_business / Unit 1 ── (first lesson is a free preview)
  { id: 'l_business_1_1', unitId: 'u_business_1', index: 0, title: 'Email tone & structure', kind: 'video', videoUrl: yt(VIDEO_IDS.brown), durationMin: 6, preview: true },
  { id: 'l_business_1_2', unitId: 'u_business_1', index: 1, title: 'Practice: rewrite an email', kind: 'practice', durationMin: 6 },
  { id: 'l_business_1_3', unitId: 'u_business_1', index: 2, title: 'Unit 1 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_business / Unit 2 ──
  { id: 'l_business_2_1', unitId: 'u_business_2', index: 0, title: 'Running a meeting', kind: 'video', videoUrl: yt(VIDEO_IDS.duckworth), durationMin: 7 },
  { id: 'l_business_2_2', unitId: 'u_business_2', index: 1, title: 'Unit 2 checkpoint', kind: 'exam', durationMin: 5 }
]
