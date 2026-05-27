import type { CEFRLevel } from '@shared/types'

export interface LevelQuestion {
  level: CEFRLevel
  area: 'Grammar' | 'Vocabulary'
  prompt: string
  options: string[]
  correct: number
}

/**
 * Graded multiple-choice bank, easy → hard, modelled on the classic
 * Europa-School-style placement test (CEFR A1–C2). Hardcoded preview set;
 * the real test pulls a larger bank from `window.api.placement` in Phase 0.
 */
export const QUESTIONS: LevelQuestion[] = [
  { level: 'A1', area: 'Grammar', prompt: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], correct: 0 },
  { level: 'A1', area: 'Grammar', prompt: 'She ___ coffee every morning.', options: ['drink', 'drinks', 'drinking', 'drank'], correct: 1 },
  { level: 'A2', area: 'Grammar', prompt: 'We ___ to London last year.', options: ['go', 'gone', 'went', 'going'], correct: 2 },
  { level: 'A2', area: 'Grammar', prompt: "There ___ any milk in the fridge.", options: ["isn't", "aren't", "wasn't", "hasn't"], correct: 0 },
  { level: 'B1', area: 'Grammar', prompt: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], correct: 1 },
  { level: 'B1', area: 'Vocabulary', prompt: "I've lived here ___ 2019.", options: ['for', 'since', 'from', 'at'], correct: 1 },
  { level: 'B2', area: 'Grammar', prompt: 'By the time we arrived, the film ___.', options: ['started', 'has started', 'had started', 'starts'], correct: 2 },
  { level: 'B2', area: 'Grammar', prompt: 'She suggested ___ a taxi.', options: ['to take', 'taking', 'take', 'took'], correct: 1 },
  { level: 'C1', area: 'Grammar', prompt: '___ harder, he would have passed.', options: ['If he studied', 'Had he studied', 'Did he study', 'He had studied'], correct: 1 },
  { level: 'C1', area: 'Vocabulary', prompt: 'The proposal was turned ___ by the board.', options: ['off', 'up', 'down', 'over'], correct: 2 },
  { level: 'C2', area: 'Grammar', prompt: 'Little ___ that he was being watched.', options: ['he knew', 'did he know', 'he did know', 'knew he'], correct: 1 },
  { level: 'C2', area: 'Vocabulary', prompt: 'Her argument was ___ flawed.', options: ['fundamentally', 'fundamental', 'foundation', 'found'], correct: 0 }
]

export interface LevelResult {
  level: CEFRLevel
  label: string
  ielts: string
  blurb: string
}

const LEVEL_META: Record<CEFRLevel, { label: string; ielts: string; blurb: string }> = {
  A1: { label: 'Elementary', ielts: '3.0', blurb: 'You know basic words and simple phrases. Great starting point!' },
  A2: { label: 'Pre-intermediate', ielts: '3.5–4.0', blurb: 'You can handle everyday situations with simple language.' },
  B1: { label: 'Intermediate', ielts: '4.5–5.0', blurb: 'You can hold conversations on familiar topics. Keep building!' },
  B2: { label: 'Upper-intermediate', ielts: '5.5–6.5', blurb: 'You communicate fluently and understand complex text.' },
  C1: { label: 'Advanced', ielts: '7.0–7.5', blurb: 'You use English flexibly and effectively for most purposes.' },
  C2: { label: 'Proficiency', ielts: '8.0+', blurb: 'You understand virtually everything with ease. Outstanding!' }
}

const ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** Map a 0–1 score ratio to a CEFR level + IELTS estimate. */
export function scoreToResult(correct: number, total: number): LevelResult {
  const ratio = total > 0 ? correct / total : 0
  let level: CEFRLevel = 'A1'
  if (ratio >= 0.9) level = 'C2'
  else if (ratio >= 0.75) level = 'C1'
  else if (ratio >= 0.58) level = 'B2'
  else if (ratio >= 0.42) level = 'B1'
  else if (ratio >= 0.25) level = 'A2'
  else level = 'A1'

  return { level, ...LEVEL_META[level] }
}

export { ORDER as CEFR_ORDER, LEVEL_META }
