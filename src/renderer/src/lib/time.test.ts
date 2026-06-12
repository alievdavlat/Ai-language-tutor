import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { timeAgo, clockTime, dateTime, daysUntil } from './time'

const NOW = new Date('2026-06-12T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

function ago(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString()
}

describe('timeAgo', () => {
  it('returns "now" for anything under 45 seconds (and future timestamps)', () => {
    expect(timeAgo(ago(10_000))).toBe('now')
    expect(timeAgo(ago(44_000))).toBe('now')
    expect(timeAgo(ago(-60_000))).toBe('now') // future clamps to 0
  })

  it('formats minutes / hours / days compactly', () => {
    expect(timeAgo(ago(5 * 60_000))).toBe('5m')
    expect(timeAgo(ago(59 * 60_000))).toBe('59m')
    expect(timeAgo(ago(3 * 3_600_000))).toBe('3h')
    expect(timeAgo(ago(2 * 86_400_000))).toBe('2d')
    expect(timeAgo(ago(6 * 86_400_000))).toBe('6d')
  })

  it('falls back to a calendar date at 7+ days', () => {
    const label = timeAgo(ago(10 * 86_400_000))
    expect(label).not.toMatch(/^\d+[mhd]$/)
    expect(label).not.toBe('now')
    expect(label.length).toBeGreaterThan(0)
  })

  it('returns empty string for invalid input', () => {
    expect(timeAgo('not-a-date')).toBe('')
  })
})

describe('clockTime', () => {
  it('renders a local clock time containing the minutes', () => {
    expect(clockTime('2026-06-12T14:05:00')).toContain('05')
  })

  it('returns empty string for invalid input', () => {
    expect(clockTime('garbage')).toBe('')
  })
})

describe('dateTime', () => {
  it('renders a non-empty date+time label', () => {
    expect(dateTime('2026-06-07T14:00:00').length).toBeGreaterThan(0)
  })

  it('returns empty string for invalid input', () => {
    expect(dateTime('garbage')).toBe('')
  })
})

describe('daysUntil', () => {
  it('counts whole days to a future date (ceiling)', () => {
    expect(daysUntil(new Date(NOW.getTime() + 2 * 86_400_000).toISOString())).toBe(2)
    expect(daysUntil(new Date(NOW.getTime() + 36 * 3_600_000).toISOString())).toBe(2) // 1.5d → 2
  })

  it('is 0 for right now and negative for the past', () => {
    expect(daysUntil(NOW.toISOString())).toBe(0)
    expect(daysUntil(new Date(NOW.getTime() - 86_400_000).toISOString())).toBe(-1)
  })
})
