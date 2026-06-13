import { describe, it, expect } from 'vitest'
import {
  ITEM_BANK,
  MIN_ITEMS,
  MAX_ITEMS,
  abilityToCEFR,
  difficultyFor,
  createSession,
  selectNext,
  applyResponse,
  isComplete,
  finalize,
  CEFR_ORDER,
  type Session
} from './engine'

/** Simulate a learner whose true ability is `trueTheta`: they answer an item
 *  correctly iff its difficulty is at or below their ability (deterministic
 *  step responder — enough to prove the loop converges sensibly). */
function runSimulatedTest(trueTheta: number): ReturnType<typeof finalize> {
  let s: Session = createSession()
  while (!isComplete(s, ITEM_BANK.length)) {
    const item = selectNext(ITEM_BANK, s)
    if (!item) break
    const correct = difficultyFor(item.level) <= trueTheta
    s = applyResponse(s, item, correct)
  }
  return finalize(s)
}

describe('abilityToCEFR', () => {
  it('maps logit ranges to bands', () => {
    expect(abilityToCEFR(-3)).toBe('A1')
    expect(abilityToCEFR(-1.5)).toBe('A2')
    expect(abilityToCEFR(-0.5)).toBe('B1')
    expect(abilityToCEFR(0.5)).toBe('B2')
    expect(abilityToCEFR(1.5)).toBe('C1')
    expect(abilityToCEFR(3)).toBe('C2')
  })
})

describe('item bank', () => {
  it('has every CEFR band represented', () => {
    for (const lvl of CEFR_ORDER) {
      expect(ITEM_BANK.some((i) => i.level === lvl)).toBe(true)
    }
  })
  it('every item has a valid correct index', () => {
    for (const i of ITEM_BANK) {
      expect(i.correct).toBeGreaterThanOrEqual(0)
      expect(i.correct).toBeLessThan(i.options.length)
    }
  })
  it('has unique ids', () => {
    expect(new Set(ITEM_BANK.map((i) => i.id)).size).toBe(ITEM_BANK.length)
  })
})

describe('selectNext', () => {
  it('picks an item near the current ability estimate', () => {
    const s = createSession() // theta 0
    const item = selectNext(ITEM_BANK, s)
    expect(item).not.toBeNull()
    // Nearest difficulty to 0 is B1 (-0.5) or B2 (0.5).
    expect(['B1', 'B2']).toContain(item!.level)
  })
  it('never repeats an asked item', () => {
    let s = createSession()
    const first = selectNext(ITEM_BANK, s)!
    s = applyResponse(s, first, true)
    const second = selectNext(ITEM_BANK, s)!
    expect(second.id).not.toBe(first.id)
  })
})

describe('adaptive convergence', () => {
  it('an all-correct taker lands at the top band', () => {
    const r = runSimulatedTest(5)
    expect(r.level).toBe('C2')
    expect(r.correct).toBe(r.total)
  })
  it('an all-wrong taker lands at the bottom band', () => {
    const r = runSimulatedTest(-5)
    expect(r.level).toBe('A1')
    expect(r.correct).toBe(0)
  })
  it('a mid learner lands in the middle bands', () => {
    const r = runSimulatedTest(0)
    expect(['A2', 'B1', 'B2']).toContain(r.level)
  })
  it('asks between MIN and MAX items', () => {
    const r = runSimulatedTest(0.5)
    expect(r.total).toBeGreaterThanOrEqual(MIN_ITEMS)
    expect(r.total).toBeLessThanOrEqual(MAX_ITEMS)
  })
})

describe('finalize', () => {
  it('reports missed topics as weak areas', () => {
    let s = createSession()
    const item = selectNext(ITEM_BANK, s)!
    s = applyResponse(s, item, false)
    // keep answering wrong for a few to accumulate weak areas
    for (let i = 0; i < MIN_ITEMS; i++) {
      const next = selectNext(ITEM_BANK, s)
      if (!next) break
      s = applyResponse(s, next, false)
    }
    const r = finalize(s)
    expect(r.weakAreas.length).toBeGreaterThan(0)
    expect(r.weakAreas.length).toBeLessThanOrEqual(4)
  })
})
