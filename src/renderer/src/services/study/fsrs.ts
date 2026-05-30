/**
 * FSRS (Free Spaced Repetition Scheduler) — a faithful implementation of the
 * modern FSRS-5 algorithm used by Anki's add-on and the `fsrs` libraries.
 *
 * It models each card with three latent variables:
 *   • Stability (S)      — days until recall probability decays to 90%.
 *   • Difficulty (D)     — 1–10, how hard the item is intrinsically.
 *   • Retrievability (R) — current predicted recall probability, 0–1.
 *
 * On every review the user gives a grade (1=Again, 2=Hard, 3=Good, 4=Easy) and
 * we update S/D and compute the next due date for a target retention.
 *
 * Operates directly on the Foundation `VocabItem` FSRS fields so the result can
 * be persisted with `backend.upsertVocab`.
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */
import type { VocabItem } from '@shared/types'
import type { ReviewGrade } from '@shared/types/study.types'

/** Default FSRS-5 weights (19 parameters), the published defaults. */
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616,
  0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567
]

/** Target retention — schedule so predicted recall is ~90% at the due date. */
const REQUEST_RETENTION = 0.9
/** Curve constants from the FSRS forgetting curve. */
const DECAY = -0.5
const FACTOR = 19 / 81 // = 0.9^(1/DECAY) - 1
/** Cap stability growth so intervals don't explode to absurd values. */
const MAX_STABILITY = 36500 // 100 years in days

const MS_PER_DAY = 86_400_000

function clampDifficulty(d: number): number {
  return Math.min(Math.max(d, 1), 10)
}

/** Predicted recall probability of a card with stability `s` after `t` days. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY)
}

/** Days until retrievability falls to the target retention, given stability. */
function nextInterval(stability: number): number {
  const ivl = (stability / FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1)
  return Math.max(1, Math.round(Math.min(ivl, MAX_STABILITY)))
}

// ── Initial values for a brand-new card's first review ──────────────────────

function initialStability(grade: ReviewGrade): number {
  return Math.max(W[grade - 1], 0.1)
}

function initialDifficulty(grade: ReviewGrade): number {
  return clampDifficulty(W[4] - Math.exp(W[5] * (grade - 1)) + 1)
}

// ── Update rules for an existing card ───────────────────────────────────────

function nextDifficulty(d: number, grade: ReviewGrade): number {
  // Linear damping toward the "Good"-anchored mean (mean reversion).
  const deltaD = -W[6] * (grade - 3)
  const dampened = d + deltaD * ((10 - d) / 9)
  const meanReverted = W[7] * initialDifficulty(4) + (1 - W[7]) * dampened
  return clampDifficulty(meanReverted)
}

function stabilityAfterRecall(d: number, s: number, r: number, grade: ReviewGrade): number {
  const hardPenalty = grade === 2 ? W[15] : 1
  const easyBonus = grade === 4 ? W[16] : 1
  const next =
    s *
    (1 +
      Math.exp(W[8]) *
        (11 - d) *
        Math.pow(s, -W[9]) *
        (Math.exp(W[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus)
  return Math.min(Math.max(next, 0.1), MAX_STABILITY)
}

function stabilityAfterLapse(d: number, s: number, r: number): number {
  const next =
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r))
  return Math.min(Math.max(next, 0.1), s) // a lapse never increases stability
}

export interface ScheduleResult {
  /** The updated card, ready to persist. */
  card: VocabItem
  /** Interval applied, in days. */
  intervalDays: number
}

/**
 * Apply a review grade to a card at time `nowMs`, returning the rescheduled
 * card. Pure — does not mutate the input.
 */
export function schedule(card: VocabItem, grade: ReviewGrade, nowMs: number): ScheduleResult {
  const nowIso = new Date(nowMs).toISOString()
  const isNew = card.state === 'new' || card.reps === 0

  let stability: number
  let difficulty: number
  let state: VocabItem['state']
  let lapses = card.lapses

  if (isNew) {
    stability = initialStability(grade)
    difficulty = initialDifficulty(grade)
    state = grade === 1 ? 'learning' : 'review'
  } else {
    const lastMs = card.lastReviewedAt ? Date.parse(card.lastReviewedAt) : nowMs
    const elapsedDays = Math.max(0, (nowMs - lastMs) / MS_PER_DAY)
    const r = retrievability(elapsedDays, card.stability)
    difficulty = nextDifficulty(card.difficulty, grade)
    if (grade === 1) {
      stability = stabilityAfterLapse(difficulty, card.stability, r)
      state = 'relearning'
      lapses += 1
    } else {
      stability = stabilityAfterRecall(difficulty, card.stability, r, grade)
      state = 'review'
    }
  }

  // "Again" on any card gets a short (same/next-day) interval so it comes back
  // soon; everything else uses the forgetting-curve interval.
  const intervalDays = grade === 1 ? 1 : nextInterval(stability)
  const due = new Date(nowMs + intervalDays * MS_PER_DAY).toISOString()

  return {
    intervalDays,
    card: {
      ...card,
      stability,
      difficulty,
      state,
      reps: card.reps + 1,
      lapses,
      elapsedDays: 0,
      scheduledDays: intervalDays,
      lastReviewedAt: nowIso,
      due
    }
  }
}

/**
 * Preview the next interval for each grade without committing — used to label
 * the four review buttons ("Again 1d · Hard 3d · Good 8d · Easy 21d").
 */
export function previewIntervals(card: VocabItem, nowMs: number): Record<ReviewGrade, number> {
  return {
    1: schedule(card, 1, nowMs).intervalDays,
    2: schedule(card, 2, nowMs).intervalDays,
    3: schedule(card, 3, nowMs).intervalDays,
    4: schedule(card, 4, nowMs).intervalDays
  }
}

/** Human label for a day count: "10m", "1d", "3w", "5mo". */
export function formatInterval(days: number): string {
  if (days < 1) return '<1d'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.round(days / 7)}w`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

/** A fresh FSRS card for a new term. */
export function newVocabItem(input: {
  id: string
  userId: string
  language: VocabItem['language']
  term: string
  translation: string
  example?: string
  deck?: string
  nowMs: number
}): VocabItem {
  const iso = new Date(input.nowMs).toISOString()
  return {
    id: input.id,
    userId: input.userId,
    language: input.language,
    term: input.term,
    translation: input.translation,
    example: input.example,
    deck: input.deck,
    due: iso, // due immediately so it enters the new-card queue
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: 'new',
    createdAt: iso
  }
}
