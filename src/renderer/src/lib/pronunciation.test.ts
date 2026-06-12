import { describe, it, expect } from 'vitest'
import { scoreAttempt } from './pronunciation'

describe('scoreAttempt', () => {
  it('exact match scores 100 on every word with full coverage', () => {
    const r = scoreAttempt('the quick brown fox', 'the quick brown fox')
    expect(r.words.map((w) => w.score)).toEqual([100, 100, 100, 100])
    expect(r.overall).toBe(100)
    expect(r.coverage).toBe(1)
  })

  it('is case- and punctuation-insensitive', () => {
    const r = scoreAttempt('Hello, world!', 'hello world')
    expect(r.overall).toBe(100)
    expect(r.words.map((w) => w.text)).toEqual(['Hello,', 'world!']) // original text kept
  })

  it('empty target → empty result', () => {
    const r = scoreAttempt('', 'anything at all')
    expect(r.words).toEqual([])
    expect(r.overall).toBe(0)
    expect(r.coverage).toBe(0)
  })

  it('empty spoken → every target word scores 0', () => {
    const r = scoreAttempt('say this please', '')
    expect(r.words.map((w) => w.score)).toEqual([0, 0, 0])
    expect(r.overall).toBe(0)
    expect(r.coverage).toBe(0)
  })

  it('a missing word gets the floor score while matched words stay 100', () => {
    const r = scoreAttempt('the quick brown fox', 'the brown fox')
    const byWord = Object.fromEntries(r.words.map((w) => [w.text, w.score]))
    expect(byWord.the).toBe(100)
    expect(byWord.brown).toBe(100)
    expect(byWord.fox).toBe(100)
    expect(byWord.quick).toBe(12) // missed entirely
    expect(r.overall).toBe(Math.round((100 + 12 + 100 + 100) / 4))
    expect(r.coverage).toBe(3 / 4)
  })

  it('a close (slightly mispronounced) word scores high but below 100', () => {
    // "quik" vs "quick": edit distance 1 over length 5 → similarity 0.8 → score 80
    const r = scoreAttempt('the quick fox', 'the quik fox')
    const quick = r.words.find((w) => w.text === 'quick')!
    expect(quick.score).toBe(80)
    expect(r.overall).toBeLessThan(100)
    expect(r.overall).toBeGreaterThan(80)
  })

  it('completely wrong speech scores low everywhere', () => {
    const r = scoreAttempt('the quick brown fox', 'zzz qqq xxx yyy')
    expect(r.overall).toBeLessThan(50)
    expect(r.coverage).toBeLessThan(0.5)
  })

  it('extra spoken words do not hurt the matched target words', () => {
    const r = scoreAttempt('good morning', 'well um good morning everyone')
    const byWord = Object.fromEntries(r.words.map((w) => [w.text, w.score]))
    expect(byWord.good).toBe(100)
    expect(byWord.morning).toBe(100)
  })
})
