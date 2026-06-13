/**
 * Adaptive CEFR level estimator (Task #4).
 *
 * Replaces the old "12 fixed questions → correct/total ratio → band" scorer with
 * a real computerized-adaptive-test (CAT) loop built on a 1-parameter logistic
 * (Rasch) item-response model — the standard approach for language placement
 * (see IRT + CAT research: items have a difficulty `b`, the test estimates the
 * learner's ability `θ`, picks the next item whose difficulty is nearest the
 * running estimate, and stops once the estimate is confident enough).
 *
 * Everything here is pure and deterministic given the responses, so it is unit
 * tested in `engine.test.ts` and needs NO LLM / backend / network — the app is
 * cloud-AI for tutoring, but leveling is a self-contained algorithm.
 */
import type { CEFRLevel } from '@shared/types'
import { LEVEL_META, CEFR_ORDER } from './questions'

export { CEFR_ORDER }

export type Skill = 'Grammar' | 'Vocabulary' | 'Reading'

export interface Item {
  id: string
  level: CEFRLevel
  /** Fine-grained topic — drives the "areas to focus on" weak-area output. */
  area: string
  skill: Skill
  prompt: string
  options: string[]
  correct: number
}

// Rasch difficulty (logits) per CEFR band: evenly spaced, A1 easiest → C2 hardest.
const LEVEL_DIFFICULTY: Record<CEFRLevel, number> = {
  A1: -2.5,
  A2: -1.5,
  B1: -0.5,
  B2: 0.5,
  C1: 1.5,
  C2: 2.5
}
export const difficultyFor = (lvl: CEFRLevel): number => LEVEL_DIFFICULTY[lvl]

/** Map an ability estimate (θ, logits) to a CEFR band at the band midpoints. */
export function abilityToCEFR(theta: number): CEFRLevel {
  if (theta < -2.0) return 'A1'
  if (theta < -1.0) return 'A2'
  if (theta < 0.0) return 'B1'
  if (theta < 1.0) return 'B2'
  if (theta < 2.0) return 'C1'
  return 'C2'
}

/** Logistic probability of a correct response under the Rasch model. */
const prob = (theta: number, b: number): number => 1 / (1 + Math.exp(-(theta - b)))

export interface Response {
  id: string
  b: number
  area: string
  skill: Skill
  correct: boolean
}

export interface Session {
  asked: string[]
  responses: Response[]
  /** Current ability estimate (logits). Starts at 0 ≈ the B1/B2 boundary. */
  theta: number
  /** Standard error of the θ estimate; shrinks as evidence accumulates. */
  se: number
}

// Test length: ask at least MIN items, stop early once the estimate is precise
// (SE below the target), never exceed MAX (or the bank size).
export const MIN_ITEMS = 8
export const MAX_ITEMS = 14
const TARGET_SE = 0.55

export function createSession(): Session {
  return { asked: [], responses: [], theta: 0, se: 99 }
}

/**
 * Choose the next item: the unused one whose difficulty is closest to the
 * current ability estimate (maximum Fisher information for a Rasch model is at
 * b ≈ θ). Ties broken to spread skills/areas so the test isn't all-grammar.
 */
export function selectNext(bank: Item[], s: Session): Item | null {
  const remaining = bank.filter((i) => !s.asked.includes(i.id))
  if (remaining.length === 0) return null
  const seenSkills = new Set(s.responses.map((r) => r.skill))
  remaining.sort((a, c) => {
    const da = Math.abs(difficultyFor(a.level) - s.theta)
    const dc = Math.abs(difficultyFor(c.level) - s.theta)
    if (Math.abs(da - dc) > 0.01) return da - dc
    // Tie-break: prefer a skill we haven't sampled yet (coverage).
    const aNew = seenSkills.has(a.skill) ? 1 : 0
    const cNew = seenSkills.has(c.skill) ? 1 : 0
    return aNew - cNew
  })
  return remaining[0]
}

/**
 * Re-estimate θ from ALL responses via a few Newton–Raphson MLE steps, then
 * derive the SE from the test information. Clamped to [-4, 4]; when every answer
 * is right (or wrong) the MLE diverges, so the clamp + a bias toward 0 keep it
 * finite and the SE stays high (correctly signalling low confidence).
 */
export function applyResponse(s: Session, item: Item, correct: boolean): Session {
  const responses: Response[] = [
    ...s.responses,
    { id: item.id, b: difficultyFor(item.level), area: item.area, skill: item.skill, correct }
  ]

  let theta = s.theta
  for (let iter = 0; iter < 12; iter++) {
    let num = 0
    let den = 0
    for (const r of responses) {
      const pr = prob(theta, r.b)
      num += (r.correct ? 1 : 0) - pr
      den += pr * (1 - pr)
    }
    if (den < 1e-6) break
    const step = num / den
    theta += step
    if (theta > 4) theta = 4
    if (theta < -4) theta = -4
    if (Math.abs(step) < 1e-4) break
  }

  const info = responses.reduce((acc, r) => {
    const pr = prob(theta, r.b)
    return acc + pr * (1 - pr)
  }, 0)
  const se = info > 1e-6 ? 1 / Math.sqrt(info) : 99

  return { asked: [...s.asked, item.id], responses, theta, se }
}

/** Whether the adaptive loop should stop after the current responses. */
export function isComplete(s: Session, bankSize: number): boolean {
  if (s.responses.length >= Math.min(MAX_ITEMS, bankSize)) return true
  if (s.responses.length >= MIN_ITEMS && s.se <= TARGET_SE) return true
  return false
}

export interface LevelEstimate {
  level: CEFRLevel
  label: string
  ielts: string
  blurb: string
  correct: number
  total: number
  theta: number
  /** Topics the learner missed, hardest-missed first — feeds "areas to focus on". */
  weakAreas: string[]
}

export function finalize(s: Session): LevelEstimate {
  const level = abilityToCEFR(s.theta)
  const correct = s.responses.filter((r) => r.correct).length
  const meta = LEVEL_META[level]
  // Weak areas: distinct topics the learner got wrong, hardest first.
  const wrong = s.responses.filter((r) => !r.correct).sort((a, b) => b.b - a.b)
  const weakAreas = [...new Set(wrong.map((r) => r.area))].slice(0, 4)
  return {
    level,
    label: meta.label,
    ielts: meta.ielts,
    blurb: meta.blurb,
    correct,
    total: s.responses.length,
    theta: s.theta,
    weakAreas
  }
}

/**
 * Graded item bank (≈ 6 per CEFR band, mixed Grammar / Vocabulary / Reading).
 * `area` is a fine topic slug used for weak-area reporting (the onboarding
 * CompleteStep already has friendly labels for many of these).
 */
export const ITEM_BANK: Item[] = [
  // ── A1 ──────────────────────────────────────────────────────────────────
  { id: 'a1-be', level: 'A1', area: 'be-verb', skill: 'Grammar', prompt: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], correct: 0 },
  { id: 'a1-pres', level: 'A1', area: 'present-simple', skill: 'Grammar', prompt: 'She ___ coffee every morning.', options: ['drink', 'drinks', 'drinking', 'drank'], correct: 1 },
  { id: 'a1-this', level: 'A1', area: 'demonstratives', skill: 'Grammar', prompt: '___ is my brother.', options: ['This', 'These', 'They', 'Those'], correct: 0 },
  { id: 'a1-vocab', level: 'A1', area: 'everyday-vocab', skill: 'Vocabulary', prompt: 'You sleep in a ___.', options: ['kitchen', 'bed', 'car', 'spoon'], correct: 1 },
  { id: 'a1-have', level: 'A1', area: 'have-got', skill: 'Grammar', prompt: 'They ___ two cats.', options: ['has', 'have', 'haves', 'having'], correct: 1 },
  { id: 'a1-num', level: 'A1', area: 'everyday-vocab', skill: 'Vocabulary', prompt: 'What colour is the sky on a clear day?', options: ['Green', 'Blue', 'Brown', 'Black'], correct: 1 },

  // ── A2 ──────────────────────────────────────────────────────────────────
  { id: 'a2-past', level: 'A2', area: 'past-simple', skill: 'Grammar', prompt: 'We ___ to London last year.', options: ['go', 'gone', 'went', 'going'], correct: 2 },
  { id: 'a2-quant', level: 'A2', area: 'quantifiers', skill: 'Grammar', prompt: "There ___ any milk in the fridge.", options: ["isn't", "aren't", "wasn't", "hasn't"], correct: 0 },
  { id: 'a2-comp', level: 'A2', area: 'comparatives', skill: 'Grammar', prompt: 'A car is ___ than a bike.', options: ['fast', 'faster', 'fastest', 'more fast'], correct: 1 },
  { id: 'a2-going', level: 'A2', area: 'future-going-to', skill: 'Grammar', prompt: 'Look at the clouds — it ___ rain.', options: ['is going to', 'go to', 'will going', 'goes'], correct: 0 },
  { id: 'a2-vocab', level: 'A2', area: 'everyday-vocab', skill: 'Vocabulary', prompt: 'A doctor works in a ___.', options: ['hospital', 'garage', 'library', 'farm'], correct: 0 },
  { id: 'a2-prep', level: 'A2', area: 'prepositions', skill: 'Grammar', prompt: 'The meeting is ___ Monday.', options: ['in', 'at', 'on', 'to'], correct: 2 },

  // ── B1 ──────────────────────────────────────────────────────────────────
  { id: 'b1-cond', level: 'B1', area: 'first-conditional', skill: 'Grammar', prompt: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], correct: 1 },
  { id: 'b1-since', level: 'B1', area: 'present-perfect', skill: 'Grammar', prompt: "I've lived here ___ 2019.", options: ['for', 'since', 'from', 'at'], correct: 1 },
  { id: 'b1-vocab', level: 'B1', area: 'phrasal-verbs', skill: 'Vocabulary', prompt: 'Please ___ your shoes before entering.', options: ['take off', 'take on', 'take up', 'take in'], correct: 0 },
  { id: 'b1-modal', level: 'B1', area: 'modal-verbs', skill: 'Grammar', prompt: 'You ___ smoke here — it is forbidden.', options: ["mustn't", "don't have to", 'could', 'might'], correct: 0 },
  { id: 'b1-read', level: 'B1', area: 'reading-gist', skill: 'Reading', prompt: '"The shop is open daily except Sundays." When is it closed?', options: ['Saturdays', 'Sundays', 'Weekdays', 'Never'], correct: 1 },
  { id: 'b1-used', level: 'B1', area: 'used-to', skill: 'Grammar', prompt: 'I ___ play tennis when I was young.', options: ['use to', 'used to', 'am used to', 'using to'], correct: 1 },

  // ── B2 ──────────────────────────────────────────────────────────────────
  { id: 'b2-past', level: 'B2', area: 'past-perfect', skill: 'Grammar', prompt: 'By the time we arrived, the film ___.', options: ['started', 'has started', 'had started', 'starts'], correct: 2 },
  { id: 'b2-gerund', level: 'B2', area: 'gerund-infinitive', skill: 'Grammar', prompt: 'She suggested ___ a taxi.', options: ['to take', 'taking', 'take', 'took'], correct: 1 },
  { id: 'b2-vocab', level: 'B2', area: 'collocations', skill: 'Vocabulary', prompt: 'They reached a ___ after long talks.', options: ['compromise', 'comprise', 'composite', 'compose'], correct: 0 },
  { id: 'b2-rel', level: 'B2', area: 'relative-clauses', skill: 'Grammar', prompt: 'The man ___ car was stolen called the police.', options: ['who', 'whom', 'whose', 'which'], correct: 2 },
  { id: 'b2-read', level: 'B2', area: 'reading-inference', skill: 'Reading', prompt: '"Despite the setback, morale remained high." The team felt:', options: ['Discouraged', 'Still positive', 'Confused', 'Angry'], correct: 1 },
  { id: 'b2-pass', level: 'B2', area: 'passive-voice', skill: 'Grammar', prompt: 'The bridge ___ in 1932.', options: ['built', 'was built', 'has built', 'is building'], correct: 1 },

  // ── C1 ──────────────────────────────────────────────────────────────────
  { id: 'c1-inv', level: 'C1', area: 'third-conditional', skill: 'Grammar', prompt: '___ harder, he would have passed.', options: ['If he studied', 'Had he studied', 'Did he study', 'He had studied'], correct: 1 },
  { id: 'c1-phrasal', level: 'C1', area: 'phrasal-verbs', skill: 'Vocabulary', prompt: 'The proposal was turned ___ by the board.', options: ['off', 'up', 'down', 'over'], correct: 2 },
  { id: 'c1-vocab', level: 'C1', area: 'advanced-vocab', skill: 'Vocabulary', prompt: 'Her remarks were rather ___ — open to several readings.', options: ['ambiguous', 'ambitious', 'amicable', 'amiable'], correct: 0 },
  { id: 'c1-cleft', level: 'C1', area: 'cleft-sentences', skill: 'Grammar', prompt: '___ surprised me was how calm she stayed.', options: ['That', 'What', 'Which', 'It'], correct: 1 },
  { id: 'c1-read', level: 'C1', area: 'reading-tone', skill: 'Reading', prompt: '"Hardly a model of efficiency, the system limps along." The tone is:', options: ['Approving', 'Neutral', 'Critical', 'Excited'], correct: 2 },
  { id: 'c1-conn', level: 'C1', area: 'discourse-markers', skill: 'Grammar', prompt: 'The plan is costly; ___, it may be worth it.', options: ['however', 'therefore', 'moreover', 'hence'], correct: 0 },

  // ── C2 ──────────────────────────────────────────────────────────────────
  { id: 'c2-inv', level: 'C2', area: 'inversion', skill: 'Grammar', prompt: 'Little ___ that he was being watched.', options: ['he knew', 'did he know', 'he did know', 'knew he'], correct: 1 },
  { id: 'c2-vocab', level: 'C2', area: 'collocations', skill: 'Vocabulary', prompt: 'Her argument was ___ flawed.', options: ['fundamentally', 'fundamental', 'foundation', 'found'], correct: 0 },
  { id: 'c2-idiom', level: 'C2', area: 'idioms', skill: 'Vocabulary', prompt: 'The negotiations were touch and ___ until the end.', options: ['go', 'run', 'move', 'turn'], correct: 0 },
  { id: 'c2-subj', level: 'C2', area: 'subjunctive', skill: 'Grammar', prompt: 'The board insisted that he ___ present.', options: ['is', 'be', 'was', 'will be'], correct: 1 },
  { id: 'c2-read', level: 'C2', area: 'reading-nuance', skill: 'Reading', prompt: '"For all its bluster, the report says little." This means the report is:', options: ['Loud but empty', 'Detailed', 'Persuasive', 'Concise'], correct: 0 },
  { id: 'c2-conc', level: 'C2', area: 'concession', skill: 'Grammar', prompt: '___ as he was, he finished the race.', options: ['Exhausted', 'Although exhausted', 'Being exhaust', 'Exhaust'], correct: 0 }
]
