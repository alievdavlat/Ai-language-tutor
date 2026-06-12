import { describe, it, expect } from 'vitest'
import type { ActivityEvent } from './types'
import {
  dayKey,
  dayKeyOf,
  weekKey,
  monthKey,
  computeStreak,
  deriveStats,
  knowledgePct,
  crownTier,
  periodKey,
  buildLeaderboard,
  reachedMilestones,
  weekDays,
  type ProgressStats
} from './compute'

// Fixed "now": Friday, 12 June 2026, 15:00 local time.
const NOW = new Date(2026, 5, 12, 15, 0, 0)

/** Local-noon ISO timestamp for a calendar day (avoids TZ-boundary flakiness). */
function at(y: number, m: number, d: number, h = 12): string {
  return new Date(y, m - 1, d, h).toISOString()
}

let seq = 0
function ev(over: Partial<ActivityEvent> & { at: string }): ActivityEvent {
  return { id: `e${++seq}`, kind: 'session', xp: 10, ...over }
}

describe('date helpers', () => {
  it('dayKey formats local YYYY-MM-DD with zero padding', () => {
    expect(dayKey(new Date(2026, 5, 12))).toBe('2026-06-12')
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('dayKeyOf maps an ISO timestamp to its local day key', () => {
    expect(dayKeyOf(at(2026, 6, 12))).toBe('2026-06-12')
  })

  it('weekKey produces Monday-anchored ISO week keys', () => {
    // Jan 4 is always inside ISO week 1.
    expect(weekKey(new Date(2021, 0, 4))).toBe('2021-W01')
    // 2020 had 53 ISO weeks; Thu 31 Dec 2020 and Fri 1 Jan 2021 share W53.
    expect(weekKey(new Date(2020, 11, 31))).toBe('2020-W53')
    expect(weekKey(new Date(2021, 0, 1))).toBe('2020-W53')
  })

  it('weekKey groups Mon..Sun together and splits at the next Monday', () => {
    const mon = weekKey(new Date(2026, 5, 8)) // Mon
    const fri = weekKey(new Date(2026, 5, 12)) // Fri
    const sun = weekKey(new Date(2026, 5, 14)) // Sun
    const nextMon = weekKey(new Date(2026, 5, 15))
    expect(fri).toBe(mon)
    expect(sun).toBe(mon)
    expect(nextMon).not.toBe(mon)
  })

  it('monthKey formats YYYY-MM', () => {
    expect(monthKey(new Date(2026, 5, 12))).toBe('2026-06')
    expect(monthKey(new Date(2026, 0, 2))).toBe('2026-01')
  })

  it('periodKey picks day/week/month keys by scope', () => {
    expect(periodKey('daily', NOW)).toBe(dayKey(NOW))
    expect(periodKey('weekly', NOW)).toBe(weekKey(NOW))
    expect(periodKey('monthly', NOW)).toBe(monthKey(NOW))
  })
})

describe('computeStreak', () => {
  const key = (daysAgo: number): string =>
    dayKey(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo))

  it('counts consecutive days ending today', () => {
    const days = new Set([key(0), key(1), key(2)])
    expect(computeStreak(days, NOW)).toEqual({ current: 3, longest: 3 })
  })

  it('survives an empty today (grace until a full day is missed)', () => {
    const days = new Set([key(1), key(2)])
    expect(computeStreak(days, NOW).current).toBe(2)
  })

  it('resets to 0 when both today and yesterday are empty', () => {
    const days = new Set([key(2), key(3)])
    const r = computeStreak(days, NOW)
    expect(r.current).toBe(0)
    expect(r.longest).toBe(2) // history run is still remembered
  })

  it('longest tracks the best run anywhere in history', () => {
    const days = new Set([key(0), key(10), key(11), key(12), key(13)])
    const r = computeStreak(days, NOW)
    expect(r.current).toBe(1)
    expect(r.longest).toBe(4)
  })

  it('handles an empty set', () => {
    expect(computeStreak(new Set(), NOW)).toEqual({ current: 0, longest: 0 })
  })
})

describe('deriveStats', () => {
  it('computes totalXp / todayXp / weekXp from the event log', () => {
    const events = [
      ev({ at: at(2026, 6, 12), xp: 40, kind: 'word_learned', count: 3, skill: 'vocabulary' }),
      ev({ at: at(2026, 6, 11), xp: 20, kind: 'speaking_exchange', skill: 'speaking' }),
      ev({ at: at(2026, 6, 7), xp: 5 }) // previous ISO week (Sunday)
    ]
    const s = deriveStats(events, 'regular', [], NOW)
    expect(s.totalXp).toBe(65)
    expect(s.todayXp).toBe(40)
    expect(s.weekXp).toBe(60) // Jun 8–14 week: today + yesterday only
    expect(s.activeDays).toBe(3)
    expect(s.activeToday).toBe(true)
    expect(s.daysIdle).toBe(0)
    expect(s.wordsLearned).toBe(3)
    expect(s.speakingExchanges).toBe(1)
  })

  it('goalMetToday compares todayXp to the chosen goal', () => {
    const met = deriveStats([ev({ at: at(2026, 6, 12), xp: 30 })], 'regular', [], NOW)
    expect(met.goalXp).toBe(30)
    expect(met.goalMetToday).toBe(true)

    const notMet = deriveStats([ev({ at: at(2026, 6, 12), xp: 29 })], 'regular', [], NOW)
    expect(notMet.goalMetToday).toBe(false)
  })

  it('streak math: consecutive active days, frozen days bridge gaps', () => {
    const events = [
      ev({ at: at(2026, 6, 12), xp: 10 }),
      ev({ at: at(2026, 6, 10), xp: 10 })
    ]
    const without = deriveStats(events, 'regular', [], NOW)
    expect(without.streak).toBe(1) // gap on the 11th breaks it

    const withFreeze = deriveStats(events, 'regular', ['2026-06-11'], NOW)
    expect(withFreeze.streak).toBe(3) // freeze fills the gap
  })

  it('skill mastery follows the soft-capped XP curve', () => {
    const events = [ev({ at: at(2026, 6, 12), xp: 350, skill: 'grammar' })]
    const s = deriveStats(events, 'regular', [], NOW)
    // 350 XP → round(100 * (1 - e^-1)) = 63
    expect(s.skills.grammar).toBe(63)
    expect(s.skills.speaking).toBe(0)
  })

  it('counts corrections and lessons (flashcard rounds count as lessons)', () => {
    const events = [
      ev({ at: at(2026, 6, 12), kind: 'correction', count: 4 }),
      ev({ at: at(2026, 6, 12), kind: 'lesson_complete' }),
      ev({ at: at(2026, 6, 12), kind: 'flashcard_round', meta: { learned: 7 } })
    ]
    const s = deriveStats(events, 'regular', [], NOW)
    expect(s.corrections).toBe(4)
    expect(s.lessonsCompleted).toBe(2)
    expect(s.wordsLearned).toBe(7) // flashcard rounds contribute meta.learned
  })

  it('daysIdle counts whole days since the last event; 999 when empty', () => {
    const idle = deriveStats([ev({ at: at(2026, 6, 10), xp: 10 })], 'regular', [], NOW)
    expect(idle.daysIdle).toBe(2)
    expect(idle.activeToday).toBe(false)

    const empty = deriveStats([], 'regular', [], NOW)
    expect(empty.daysIdle).toBe(999)
    expect(empty.streak).toBe(0)
    expect(empty.totalXp).toBe(0)
  })
})

describe('knowledgePct', () => {
  it('is the rounded mean of the four skill masteries', () => {
    const stats = {
      skills: { speaking: 100, listening: 0, grammar: 50, vocabulary: 50 }
    } as unknown as ProgressStats
    expect(knowledgePct(stats)).toBe(50)
  })

  it('is 0 with no activity', () => {
    expect(knowledgePct(deriveStats([], 'regular', [], NOW))).toBe(0)
  })
})

describe('crownTier', () => {
  it('maps mastery percent to tiers 0–4 at the documented thresholds', () => {
    expect(crownTier(0)).toBe(0)
    expect(crownTier(19)).toBe(0)
    expect(crownTier(20)).toBe(1)
    expect(crownTier(44)).toBe(1)
    expect(crownTier(45)).toBe(2)
    expect(crownTier(69)).toBe(2)
    expect(crownTier(70)).toBe(3)
    expect(crownTier(89)).toBe(3)
    expect(crownTier(90)).toBe(4)
    expect(crownTier(100)).toBe(4)
  })
})

describe('buildLeaderboard', () => {
  it('weaves the learner into the pool, sorted by XP desc with 1-based ranks', () => {
    const rows = buildLeaderboard('Me', 99999, 5, 'global')
    expect(rows[0].name).toBe('Me')
    expect(rows[0].rank).toBe(1)
    expect(rows[0].me).toBe(true)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].rank).toBe(i + 1)
      expect(rows[i].xp).toBeLessThanOrEqual(rows[i - 1].xp)
    }
    expect(rows.filter((r) => r.me)).toHaveLength(1)
  })

  it('places a mid-XP learner at the right rank', () => {
    const rows = buildLeaderboard('Me', 2000, 1, 'global')
    const me = rows.find((r) => r.me)!
    const above = rows.filter((r) => !r.me && r.xp > 2000).length
    expect(me.rank).toBe(above + 1)
  })

  it('friends scope shrinks the pool but always includes me', () => {
    const global = buildLeaderboard('Me', 0, 0, 'global')
    const friends = buildLeaderboard('Me', 0, 0, 'friends')
    expect(friends.length).toBeLessThan(global.length)
    expect(friends.some((r) => r.me)).toBe(true)
  })
})

describe('reachedMilestones', () => {
  it('returns every milestone threshold the streak has met', () => {
    expect(reachedMilestones(0)).toEqual([])
    expect(reachedMilestones(7)).toEqual([7])
    expect(reachedMilestones(30)).toEqual([7, 14, 30])
    expect(reachedMilestones(400)).toEqual([7, 14, 30, 50, 100, 365])
  })
})

describe('weekDays', () => {
  it('builds the Mon→Sun tracker with done/missed/today/future states', () => {
    // NOW is Friday Jun 12; one event on Wednesday Jun 10.
    const events = [ev({ at: at(2026, 6, 10), xp: 10 })]
    const days = weekDays(events, [], NOW)
    expect(days.map((d) => d.label)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
    expect(days.map((d) => d.state)).toEqual([
      'missed',
      'missed',
      'done',
      'missed',
      'today',
      'future',
      'future'
    ])
  })

  it('frozen dates render as done', () => {
    const days = weekDays([], ['2026-06-08'], NOW)
    expect(days[0].state).toBe('done') // Monday frozen
    expect(days[4].state).toBe('today')
  })
})
