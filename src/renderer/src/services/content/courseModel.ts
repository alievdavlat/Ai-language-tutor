/**
 * Pure helpers that turn (units + lessons + saved progress) into the view model
 * the course pages render: per-lesson lock state, the "continue here" lesson,
 * course progress %, whether the final exam is unlocked, and completion.
 *
 * Sequential unlock: a lesson opens once the previous one is complete. Because
 * a unit's checkpoint is its last lesson and only counts complete when *passed*
 * (see progress.recordCheckpoint), this automatically gates the next unit.
 */
import type { Lesson, Unit } from '@shared/types'
import { getCertificate, getFinalExam, isLessonComplete } from './progress'
import { hasFinalExam } from './exams'

export type LessonState = 'done' | 'current' | 'locked'

export interface LessonView extends Lesson {
  state: LessonState
}

export interface CourseView {
  units: { unit: Unit; lessons: LessonView[] }[]
  /** Flattened lesson order. */
  ordered: Lesson[]
  /** Next incomplete (unlocked) lesson, or null when all lessons are done. */
  next: Lesson | null
  completedCount: number
  totalCount: number
  /** 0–100, accounts for the final exam when the course has one. */
  progress: number
  /** All lessons complete → the final exam can be attempted. */
  finalUnlocked: boolean
  hasFinal: boolean
  finalPassed: boolean
  /** Course fully complete (lessons done + final passed when present). */
  completed: boolean
  hasCertificate: boolean
}

export function buildCourseView(courseId: string, units: Unit[], lessons: Lesson[]): CourseView {
  const sortedUnits = [...units].sort((a, b) => a.index - b.index)
  const ordered: Lesson[] = []
  for (const u of sortedUnits) {
    const us = lessons.filter((l) => l.unitId === u.id).sort((a, b) => a.index - b.index)
    ordered.push(...us)
  }

  // Find the first incomplete lesson — that's "current"; everything after is locked.
  const firstIncompleteIdx = ordered.findIndex((l) => !isLessonComplete(l.id))

  const stateFor = (globalIdx: number, lessonId: string): LessonState => {
    if (isLessonComplete(lessonId)) return 'done'
    if (globalIdx === firstIncompleteIdx) return 'current'
    return 'locked'
  }

  const idxOf = new Map(ordered.map((l, i) => [l.id, i]))
  const unitViews = sortedUnits.map((unit) => ({
    unit,
    lessons: lessons
      .filter((l) => l.unitId === unit.id)
      .sort((a, b) => a.index - b.index)
      .map<LessonView>((l) => ({ ...l, state: stateFor(idxOf.get(l.id)!, l.id) }))
  }))

  const completedCount = ordered.filter((l) => isLessonComplete(l.id)).length
  const totalCount = ordered.length
  const allLessonsDone = totalCount > 0 && completedCount === totalCount

  const hasFinal = hasFinalExam(courseId)
  const finalResult = getFinalExam(courseId)
  const finalPassed = !!finalResult?.passed
  const completed = allLessonsDone && (!hasFinal || finalPassed)

  // Progress: lessons fill up to 90% when a final exists; the final is the last 10%.
  let progress: number
  if (totalCount === 0) progress = 0
  else if (hasFinal) {
    const lessonPart = Math.round((completedCount / totalCount) * 90)
    progress = Math.min(90, lessonPart) + (finalPassed ? 10 : 0)
  } else {
    progress = Math.round((completedCount / totalCount) * 100)
  }

  return {
    units: unitViews,
    ordered,
    next: firstIncompleteIdx >= 0 ? ordered[firstIncompleteIdx] : null,
    completedCount,
    totalCount,
    progress,
    finalUnlocked: allLessonsDone,
    hasFinal,
    finalPassed,
    completed,
    hasCertificate: !!getCertificate(courseId)
  }
}
