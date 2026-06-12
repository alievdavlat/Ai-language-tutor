import { describe, it, expect } from 'vitest'
import { extractSentences, finalizeBuffer } from './sentences'

describe('extractSentences', () => {
  it('extracts complete sentences ending in . ! ? and keeps the tail', () => {
    const r = extractSentences('Hello there. How are you? I am')
    expect(r.complete).toEqual(['Hello there.', 'How are you?'])
    expect(r.remainder.trim()).toBe('I am')
  })

  it('returns everything as remainder when nothing is terminated yet', () => {
    const r = extractSentences('Just a short fragment')
    expect(r.complete).toEqual([])
    expect(r.remainder).toBe('Just a short fragment')
  })

  it('treats a terminator at end-of-buffer as a hard ending', () => {
    const r = extractSentences('Done.')
    expect(r.complete).toEqual(['Done.'])
    expect(r.remainder).toBe('')
  })

  it('does not split on a period without trailing whitespace (e.g. decimals)', () => {
    const r = extractSentences('It costs 3.50 in total')
    expect(r.complete).toEqual([])
    expect(r.remainder).toBe('It costs 3.50 in total')
  })

  it('early-flushes through the first comma once the buffer passes ~40 chars', () => {
    const buffer = 'Oh nice, I really love that idea and want to hear more'
    const r = extractSentences(buffer)
    expect(r.complete).toEqual(['Oh nice,'])
    expect(r.remainder.trim()).toBe('I really love that idea and want to hear more')
  })

  it('does not early-flush short buffers even when they contain a comma', () => {
    const r = extractSentences('Oh nice, ok')
    expect(r.complete).toEqual([])
    expect(r.remainder).toBe('Oh nice, ok')
  })

  it('soft-flushes a long unterminated remainder at the last soft pause', () => {
    const long = 'ok, ' + 'word '.repeat(18) + 'middle, ' + 'tail words here'
    const r = extractSentences(long)
    // pass 2a takes "ok,", pass 2b flushes the rest through "middle,"
    expect(r.complete[0]).toBe('ok,')
    expect(r.complete[r.complete.length - 1].endsWith('middle,')).toBe(true)
    expect(r.remainder.trim()).toBe('tail words here')
  })

  it('respects custom flush thresholds', () => {
    const r = extractSentences('Hey, more is coming', { earlyFlushChars: 5 })
    expect(r.complete).toEqual(['Hey,'])
    expect(r.remainder.trim()).toBe('more is coming')
  })

  it('handles an empty buffer', () => {
    expect(extractSentences('')).toEqual({ complete: [], remainder: '' })
  })
})

describe('finalizeBuffer', () => {
  it('trims whatever is left at stream end', () => {
    expect(finalizeBuffer('  trailing bit ')).toBe('trailing bit')
    expect(finalizeBuffer('')).toBe('')
  })
})
