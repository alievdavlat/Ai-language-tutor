import type { CEFRLevel, PlacementAnswer, PlacementQuestion } from '@shared/types'
import { CEFR_ORDER } from '@shared/types'

export interface ScoreBreakdown {
  correct: number
  perLevel: Record<CEFRLevel, { seen: number; correct: number }>
}

function buildEmptyPerLevel(): ScoreBreakdown['perLevel'] {
  return Object.fromEntries(
    CEFR_ORDER.map((l) => [l, { seen: 0, correct: 0 }])
  ) as ScoreBreakdown['perLevel']
}

function isAnswerCorrect(q: PlacementQuestion, a: PlacementAnswer): boolean {
  if (!q.correctAnswer) return false
  return a.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
}

export function scoreStaticAnswers(
  questions: PlacementQuestion[],
  answers: PlacementAnswer[]
): ScoreBreakdown {
  const perLevel = buildEmptyPerLevel()
  let correct = 0

  for (const q of questions) {
    if (!q.correctAnswer) continue
    const a = answers.find((x) => x.questionId === q.id)
    if (!a) continue
    perLevel[q.levelTarget].seen++
    if (isAnswerCorrect(q, a)) {
      perLevel[q.levelTarget].correct++
      correct++
    }
  }

  return { correct, perLevel }
}

export function estimateLevelFromBreakdown(breakdown: ScoreBreakdown): CEFRLevel {
  let estimated: CEFRLevel = 'A1'
  for (const l of CEFR_ORDER) {
    const bucket = breakdown.perLevel[l]
    if (bucket.seen === 0) continue
    if (bucket.correct / bucket.seen >= 0.6) estimated = l
  }
  return estimated
}

export function detectWeakAreas(
  questions: PlacementQuestion[],
  answers: PlacementAnswer[]
): string[] {
  const weak: string[] = []
  for (const q of questions) {
    if (!q.correctAnswer || !q.topic) continue
    const a = answers.find((x) => x.questionId === q.id)
    if (!a) continue
    if (!isAnswerCorrect(q, a) && !weak.includes(q.topic)) {
      weak.push(q.topic)
    }
  }
  return weak
}
