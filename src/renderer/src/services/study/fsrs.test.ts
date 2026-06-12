import { describe, it, expect } from 'vitest'
import type { VocabItem } from '@shared/types'
import {
  schedule,
  previewIntervals,
  formatInterval,
  retrievability,
  newVocabItem
} from './fsrs'

const NOW = Date.UTC(2026, 5, 12, 12, 0, 0)
const DAY = 86_400_000

function fresh(): VocabItem {
  return newVocabItem({
    id: 'v1',
    userId: 'u1',
    language: 'en' as VocabItem['language'],
    term: 'serendipity',
    translation: 'omadli tasodif',
    nowMs: NOW
  })
}

describe('newVocabItem', () => {
  it('creates a "new" card due immediately with zeroed FSRS fields', () => {
    const c = fresh()
    expect(c.state).toBe('new')
    expect(c.reps).toBe(0)
    expect(c.lapses).toBe(0)
    expect(c.stability).toBe(0)
    expect(c.due).toBe(new Date(NOW).toISOString())
    expect(c.createdAt).toBe(new Date(NOW).toISOString())
  })
})

describe('schedule — first review of a new card', () => {
  it('Again (1) → learning state with a 1-day interval', () => {
    const { card, intervalDays } = schedule(fresh(), 1, NOW)
    expect(card.state).toBe('learning')
    expect(intervalDays).toBe(1)
    expect(card.reps).toBe(1)
    expect(card.lapses).toBe(0) // first-ever Again is not a lapse
    expect(card.due).toBe(new Date(NOW + DAY).toISOString())
    expect(card.lastReviewedAt).toBe(new Date(NOW).toISOString())
  })

  it('Good (3) → review state, interval ≈ initial stability (3d with default weights)', () => {
    const { card, intervalDays } = schedule(fresh(), 3, NOW)
    expect(card.state).toBe('review')
    expect(intervalDays).toBe(3)
    expect(card.due).toBe(new Date(NOW + 3 * DAY).toISOString())
  })

  it('grade ordering: Hard ≤ Good ≤ Easy intervals', () => {
    const hard = schedule(fresh(), 2, NOW).intervalDays
    const good = schedule(fresh(), 3, NOW).intervalDays
    const easy = schedule(fresh(), 4, NOW).intervalDays
    expect(hard).toBeLessThanOrEqual(good)
    expect(good).toBeLessThanOrEqual(easy)
    expect(easy).toBeGreaterThan(good) // Easy meaningfully larger
  })

  it('is pure — does not mutate the input card', () => {
    const card = fresh()
    const snapshot = JSON.stringify(card)
    schedule(card, 3, NOW)
    expect(JSON.stringify(card)).toBe(snapshot)
  })
})

describe('schedule — subsequent reviews', () => {
  const reviewed = (): VocabItem => schedule(fresh(), 3, NOW).card
  const LATER = NOW + 3 * DAY // review exactly when due

  it('Again on a review card → relearning, lapse counted, stability never grows', () => {
    const before = reviewed()
    const { card, intervalDays } = schedule(before, 1, LATER)
    expect(card.state).toBe('relearning')
    expect(card.lapses).toBe(1)
    expect(card.stability).toBeLessThanOrEqual(before.stability)
    expect(intervalDays).toBe(1) // Again always comes back the next day
  })

  it('Good on a review card → stability and interval grow', () => {
    const before = reviewed()
    const { card, intervalDays } = schedule(before, 3, LATER)
    expect(card.state).toBe('review')
    expect(card.reps).toBe(2)
    expect(card.stability).toBeGreaterThan(before.stability)
    expect(intervalDays).toBeGreaterThanOrEqual(3)
    expect(Date.parse(card.due)).toBe(LATER + intervalDays * DAY)
  })

  it('Easy grows the interval more than Hard', () => {
    const before = reviewed()
    const hard = schedule(before, 2, LATER).intervalDays
    const easy = schedule(before, 4, LATER).intervalDays
    expect(easy).toBeGreaterThan(hard)
  })
})

describe('previewIntervals', () => {
  it('matches schedule() for each grade without committing', () => {
    const card = fresh()
    const snapshot = JSON.stringify(card)
    const p = previewIntervals(card, NOW)
    expect(p[1]).toBe(1)
    expect(p[2]).toBe(schedule(card, 2, NOW).intervalDays)
    expect(p[3]).toBe(schedule(card, 3, NOW).intervalDays)
    expect(p[4]).toBe(schedule(card, 4, NOW).intervalDays)
    expect(JSON.stringify(card)).toBe(snapshot)
  })
})

describe('retrievability', () => {
  it('is 1 immediately after review and 0.9 after exactly `stability` days', () => {
    expect(retrievability(0, 5)).toBe(1)
    expect(retrievability(5, 5)).toBeCloseTo(0.9, 10)
  })

  it('decays monotonically with elapsed time', () => {
    expect(retrievability(1, 5)).toBeGreaterThan(retrievability(10, 5))
    expect(retrievability(10, 5)).toBeGreaterThan(retrievability(100, 5))
  })

  it('is 0 for a card with no stability', () => {
    expect(retrievability(3, 0)).toBe(0)
  })
})

describe('formatInterval', () => {
  it('formats days into human labels', () => {
    expect(formatInterval(0.5)).toBe('<1d')
    expect(formatInterval(3)).toBe('3d')
    expect(formatInterval(14)).toBe('2w')
    expect(formatInterval(60)).toBe('2mo')
    expect(formatInterval(730)).toBe('2.0y')
  })
})
