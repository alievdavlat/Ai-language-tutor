/**
 * Study-feature helper types — the small, non-overlapping additions the
 * Grammar / Vocabulary / Exams feature slice needs on top of the Foundation
 * platform model (`platform-ext.types.ts` owns `VocabItem`, `ExamAttempt`,
 * `ActivityEvent`). These are UI/scheduler helpers, not new persisted tables.
 */

// ─── FSRS review ────────────────────────────────────────────────────────────

/** FSRS review grade. 1=Again 2=Hard 3=Good 4=Easy. */
export type ReviewGrade = 1 | 2 | 3 | 4

// ─── Exam UI ─────────────────────────────────────────────────────────────────

/**
 * Rich per-section result for the exam report screen. We persist the lean
 * `Record<string, number>` that `ExamAttempt.sections` expects, but render from
 * this fuller shape during the run.
 */
export interface SectionResult {
  /** Section id, e.g. "listening", "reading", "math", "verbal", "writing". */
  id: string
  label: string
  /** Raw correct / total for objective sections (undefined for essay/speaking). */
  correct?: number
  total?: number
  /** Display score for the section (band, scaled score, etc.). */
  score: string
  /** Numeric score persisted into ExamAttempt.sections. */
  numeric: number
  /** 0–100 for progress bars. */
  pct: number
  /** True when an LLM graded it (writing/speaking). */
  aiGraded?: boolean
}

// ─── Grammar progress (local-only; Foundation has no per-lesson grammar table) ─

export interface LessonProgress {
  /** `${unitId}:${lessonId}` */
  key: string
  unitId: string
  lessonId: string
  completedAt: string
  /** 0–100 score on the lesson's exercises. */
  score: number
}

export interface ChallengeProgress {
  /** Topic id, e.g. "present-tenses". */
  topicId: string
  /** Days completed, by day number (1-based). */
  completedDays: number[]
  /** ISO date of the most recent completed day — used to pace one day per calendar day. */
  lastCompletedAt: string | null
}
