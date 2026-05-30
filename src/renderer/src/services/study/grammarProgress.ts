/**
 * Local persistence for Grammar lesson + 30-day-challenge progress.
 *
 * The Foundation backend models courses/lessons generically but has no
 * per-grammar-lesson completion table, so this slice owns its own small store
 * (localStorage key `speakai.grammar.v1`). It is intentionally self-contained:
 * lesson/challenge completion survives reloads without depending on the
 * still-evolving Supabase schema. Activity/XP is still reported through the
 * Foundation `backend.recordActivity()` so Home/Progress see it.
 */
import type { ChallengeProgress, LessonProgress } from '@shared/types/study.types'

const LS_KEY = 'speakai.grammar.v1'

interface GrammarDb {
  lessons: Record<string, LessonProgress>
  challenges: Record<string, ChallengeProgress>
}

function load(): GrammarDb {
  if (typeof window === 'undefined' || !window.localStorage) return { lessons: {}, challenges: {} }
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return { lessons: {}, challenges: {} }
    const parsed = JSON.parse(raw) as Partial<GrammarDb>
    return { lessons: parsed.lessons ?? {}, challenges: parsed.challenges ?? {} }
  } catch {
    return { lessons: {}, challenges: {} }
  }
}

function save(db: GrammarDb): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(db))
  } catch {
    /* quota */
  }
}

const dayKey = (iso: string): string => iso.slice(0, 10)

// ─── Lessons ─────────────────────────────────────────────────────────────────

export function lessonKey(unitId: string, lessonId: string): string {
  return `${unitId}:${lessonId}`
}

export function getLessonProgress(): Record<string, LessonProgress> {
  return load().lessons
}

export function isLessonDone(unitId: string, lessonId: string): boolean {
  return !!load().lessons[lessonKey(unitId, lessonId)]
}

export function completeLesson(unitId: string, lessonId: string, score: number): LessonProgress {
  const db = load()
  const key = lessonKey(unitId, lessonId)
  const entry: LessonProgress = {
    key,
    unitId,
    lessonId,
    score,
    completedAt: new Date().toISOString()
  }
  db.lessons[key] = entry
  save(db)
  return entry
}

/** Count of completed lessons in a unit. */
export function unitDoneCount(unitId: string): number {
  return Object.values(load().lessons).filter((l) => l.unitId === unitId).length
}

// ─── 30-day challenges ────────────────────────────────────────────────────────

export function getChallengeProgress(topicId: string): ChallengeProgress {
  return (
    load().challenges[topicId] ?? { topicId, completedDays: [], lastCompletedAt: null }
  )
}

/**
 * Mark a challenge day complete. Returns the updated progress. Days are paced
 * one per calendar day: the next day unlocks only after the local date rolls
 * over (so a 30-day challenge really takes 30 days), but the CURRENT highest
 * unlocked day is always replayable.
 */
export function completeChallengeDay(topicId: string, day: number): ChallengeProgress {
  const db = load()
  const prev = db.challenges[topicId] ?? { topicId, completedDays: [], lastCompletedAt: null }
  const completedDays = prev.completedDays.includes(day)
    ? prev.completedDays
    : [...prev.completedDays, day].sort((a, b) => a - b)
  const next: ChallengeProgress = {
    topicId,
    completedDays,
    lastCompletedAt: new Date().toISOString()
  }
  db.challenges[topicId] = next
  save(db)
  return next
}

/**
 * The day the user can attempt next (1-based). Equals highest completed + 1,
 * but is gated to one new day per calendar day.
 */
export function nextUnlockedDay(p: ChallengeProgress): number {
  const highest = p.completedDays.length ? Math.max(...p.completedDays) : 0
  if (!p.lastCompletedAt) return Math.max(1, highest + 1)
  const completedToday = dayKey(p.lastCompletedAt) === dayKey(new Date().toISOString())
  // If they already finished a day today, the next day stays locked until tomorrow.
  return completedToday ? highest : highest + 1
}
