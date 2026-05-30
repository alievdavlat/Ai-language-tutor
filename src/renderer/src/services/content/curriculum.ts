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
  // c_everyday — Everyday Conversation
  { id: 'u_everyday_1', courseId: 'c_everyday', index: 0, title: 'Unit 1 · Greetings & small talk', about: 'Open a conversation, introduce yourself, keep small talk flowing.' },
  { id: 'u_everyday_2', courseId: 'c_everyday', index: 1, title: 'Unit 2 · Out and about', about: 'Cafés, shopping and getting around town.' },

  // c_ielts7 — IELTS Speaking Bootcamp
  { id: 'u_ielts_1', courseId: 'c_ielts7', index: 0, title: 'Part 1 · Interview', about: 'Familiar topics, fluency and natural answers.' },
  { id: 'u_ielts_2', courseId: 'c_ielts7', index: 1, title: 'Part 2 · Long turn', about: 'The cue card: structure a 2-minute talk.' },

  // c_business — Business English 101
  { id: 'u_business_1', courseId: 'c_business', index: 0, title: 'Unit 1 · Email & messaging', about: 'Professional tone in writing.' },
  { id: 'u_business_2', courseId: 'c_business', index: 1, title: 'Unit 2 · Meetings', about: 'Lead, interrupt politely and summarise.' },

  // c_pronun — Pronunciation Mastery
  { id: 'u_pronun_1', courseId: 'c_pronun', index: 0, title: 'Unit 1 · Tricky sounds', about: 'Th, vowels and word stress.' },

  // c_egiu — English Grammar in Use (coursebook)
  { id: 'u_egiu_1', courseId: 'c_egiu', index: 0, title: 'Unit 1 · Present', about: 'Present continuous and present simple.' },
  { id: 'u_egiu_2', courseId: 'c_egiu', index: 1, title: 'Unit 2 · Past', about: 'Past simple and past continuous.' }
]

// ─── Lessons ─────────────────────────────────────────────────────────────────
// kind: 'video' opens the Classroom player · 'rule' opens the BookReader ·
// 'practice' opens the exercise player · 'exam' is a unit checkpoint.

export const SEED_LESSONS: Lesson[] = [
  // ── c_everyday / Unit 1 ──
  { id: 'l_everyday_1_1', unitId: 'u_everyday_1', index: 0, title: 'Saying hello', kind: 'video', videoUrl: yt(VIDEO_IDS.brown), durationMin: 7 },
  { id: 'l_everyday_1_2', unitId: 'u_everyday_1', index: 1, title: 'Talking about yourself', kind: 'video', videoUrl: yt(VIDEO_IDS.duckworth), durationMin: 6 },
  { id: 'l_everyday_1_3', unitId: 'u_everyday_1', index: 2, title: 'Practice: introductions', kind: 'practice', durationMin: 5 },
  { id: 'l_everyday_1_4', unitId: 'u_everyday_1', index: 3, title: 'Unit 1 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_everyday / Unit 2 ──
  { id: 'l_everyday_2_1', unitId: 'u_everyday_2', index: 0, title: 'At a café', kind: 'video', videoUrl: yt(VIDEO_IDS.happy), durationMin: 4 },
  { id: 'l_everyday_2_2', unitId: 'u_everyday_2', index: 1, title: 'Shopping', kind: 'video', videoUrl: yt(VIDEO_IDS.stressed), durationMin: 5 },
  { id: 'l_everyday_2_3', unitId: 'u_everyday_2', index: 2, title: 'Practice: ordering', kind: 'practice', durationMin: 5 },
  { id: 'l_everyday_2_4', unitId: 'u_everyday_2', index: 3, title: 'Unit 2 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_ielts7 / Part 1 ──
  { id: 'l_ielts_1_1', unitId: 'u_ielts_1', index: 0, title: 'How the interview works', kind: 'video', videoUrl: yt(VIDEO_IDS.urban), durationMin: 8 },
  { id: 'l_ielts_1_2', unitId: 'u_ielts_1', index: 1, title: 'Extending your answers', kind: 'video', videoUrl: yt(VIDEO_IDS.brown), durationMin: 7 },
  { id: 'l_ielts_1_3', unitId: 'u_ielts_1', index: 2, title: 'Practice: Part 1 questions', kind: 'practice', durationMin: 6 },
  { id: 'l_ielts_1_4', unitId: 'u_ielts_1', index: 3, title: 'Part 1 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_ielts7 / Part 2 ──
  { id: 'l_ielts_2_1', unitId: 'u_ielts_2', index: 0, title: 'Reading the cue card', kind: 'video', videoUrl: yt(VIDEO_IDS.duckworth), durationMin: 7 },
  { id: 'l_ielts_2_2', unitId: 'u_ielts_2', index: 1, title: 'Structuring 2 minutes', kind: 'video', videoUrl: yt(VIDEO_IDS.villani), durationMin: 9 },
  { id: 'l_ielts_2_3', unitId: 'u_ielts_2', index: 2, title: 'Part 2 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_business / Unit 1 ──
  { id: 'l_business_1_1', unitId: 'u_business_1', index: 0, title: 'Email tone & structure', kind: 'video', videoUrl: yt(VIDEO_IDS.brown), durationMin: 6 },
  { id: 'l_business_1_2', unitId: 'u_business_1', index: 1, title: 'Practice: rewrite an email', kind: 'practice', durationMin: 6 },
  { id: 'l_business_1_3', unitId: 'u_business_1', index: 2, title: 'Unit 1 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_business / Unit 2 ──
  { id: 'l_business_2_1', unitId: 'u_business_2', index: 0, title: 'Running a meeting', kind: 'video', videoUrl: yt(VIDEO_IDS.duckworth), durationMin: 7 },
  { id: 'l_business_2_2', unitId: 'u_business_2', index: 1, title: 'Unit 2 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_pronun / Unit 1 ──
  { id: 'l_pronun_1_1', unitId: 'u_pronun_1', index: 0, title: 'The /θ/ and /ð/ sounds', kind: 'video', videoUrl: yt(VIDEO_IDS.villani), durationMin: 6 },
  { id: 'l_pronun_1_2', unitId: 'u_pronun_1', index: 1, title: 'Word stress', kind: 'video', videoUrl: yt(VIDEO_IDS.urban), durationMin: 7 },
  { id: 'l_pronun_1_3', unitId: 'u_pronun_1', index: 2, title: 'Unit 1 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_egiu / Unit 1 (coursebook → rule pages) ──
  { id: 'l_egiu_1_1', unitId: 'u_egiu_1', index: 0, title: 'Present continuous (I am doing)', kind: 'rule', durationMin: 6 },
  { id: 'l_egiu_1_2', unitId: 'u_egiu_1', index: 1, title: 'Present simple (I do)', kind: 'rule', durationMin: 6 },
  { id: 'l_egiu_1_3', unitId: 'u_egiu_1', index: 2, title: 'Practice: present tenses', kind: 'practice', durationMin: 5 },
  { id: 'l_egiu_1_4', unitId: 'u_egiu_1', index: 3, title: 'Unit 1 checkpoint', kind: 'exam', durationMin: 5 },

  // ── c_egiu / Unit 2 ──
  { id: 'l_egiu_2_1', unitId: 'u_egiu_2', index: 0, title: 'Past simple (I did)', kind: 'rule', durationMin: 6 },
  { id: 'l_egiu_2_2', unitId: 'u_egiu_2', index: 1, title: 'Past continuous (I was doing)', kind: 'rule', durationMin: 6 },
  { id: 'l_egiu_2_3', unitId: 'u_egiu_2', index: 2, title: 'Unit 2 checkpoint', kind: 'exam', durationMin: 5 }
]
