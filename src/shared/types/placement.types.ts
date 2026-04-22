import type { CEFRLevel } from './cefr.types'

export type PlacementQuestionType = 'multiple-choice' | 'fill-in' | 'open-ended'

export interface PlacementQuestion {
  id: string
  type: PlacementQuestionType
  levelTarget: CEFRLevel
  prompt: string
  options?: string[]
  correctAnswer?: string
  topic?: string
}

export interface PlacementAnswer {
  questionId: string
  answer: string
  isCorrect?: boolean
}

export interface PlacementResult {
  level: CEFRLevel
  score: number
  weakAreas: string[]
  detail: string
}
