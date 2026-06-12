import { describe, it, expect } from 'vitest'
import { countBlankableWords, pickBlanks, type LyricLine } from './data'

describe('countBlankableWords', () => {
  it('returns 0 for undefined or empty lines', () => {
    expect(countBlankableWords(undefined)).toBe(0)
    expect(countBlankableWords([])).toBe(0)
  })

  it('counts only words longer than 2 letters (after stripping punctuation)', () => {
    const lines: LyricLine[] = [{ t: 0, text: 'I am on it' }]
    expect(countBlankableWords(lines)).toBe(0) // all ≤ 2 letters

    expect(countBlankableWords([{ t: 0, text: 'the quick brown fox' }])).toBe(4)
  })

  it('strips punctuation before measuring word length', () => {
    // "go," and "go!!" strip to 2 letters → skipped; "running" counts
    expect(countBlankableWords([{ t: 0, text: 'go, go!! running' }])).toBe(1)
  })

  it('sums across multiple lines', () => {
    const lines: LyricLine[] = [
      { t: 0, text: 'hello world' },
      { t: 3, text: 'singing along now' }
    ]
    expect(countBlankableWords(lines)).toBe(5)
  })
})

describe('pickBlanks', () => {
  it('is deterministic — same input always blanks the same indices', () => {
    const words = 'never gonna give you up never gonna let you down'.split(' ')
    const a = pickBlanks(words, 0.4)
    const b = pickBlanks(words, 0.4)
    expect([...a].sort()).toEqual([...b].sort())
  })

  it('fraction 1 blanks every word longer than 1 letter', () => {
    const words = ['a', 'it', 'the', 'quick', 'fox']
    const out = pickBlanks(words, 1)
    expect(out.has(0)).toBe(false) // "a" too short
    expect(out.has(1)).toBe(true)
    expect(out.has(2)).toBe(true)
    expect(out.has(3)).toBe(true)
    expect(out.has(4)).toBe(true)
  })

  it('partial fractions blank roughly fraction·eligible, at least 1', () => {
    const words = ['alpha', 'bravo', 'charlie', 'delta', 'echoes']
    const out = pickBlanks(words, 0.2)
    expect(out.size).toBe(1) // round(5 * 0.2) = 1
    // tiny fraction still blanks at least one word
    expect(pickBlanks(words, 0.01).size).toBe(1)
  })

  it('only blanks eligible (3+ letter) words at partial fractions', () => {
    const words = ['a', 'to', 'elephant']
    const out = pickBlanks(words, 0.5)
    expect([...out]).toEqual([2])
  })

  it('skips short words even when they carry punctuation', () => {
    const words = ['Go,', 'on!', 'forward']
    const out = pickBlanks(words, 1)
    // fraction 1 keeps words whose letters length > 1: "Go," → "Go" (2) kept, "on!" (2) kept
    expect(out.has(0)).toBe(true)
    expect(out.has(2)).toBe(true)

    const partial = pickBlanks(words, 0.5)
    expect([...partial]).toEqual([2]) // only "forward" is 3+ letters
  })
})
