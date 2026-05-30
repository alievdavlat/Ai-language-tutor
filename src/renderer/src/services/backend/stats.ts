/**
 * Pure projection from the append-only activity log to the denormalised
 * `UserStats` counters. Shared by both the local and Supabase backends so the
 * streak / XP / minutes maths is identical regardless of where the events live.
 */
import type { ActivityEvent, UserStats } from '@shared/types'

/** yyyy-mm-dd in the user's local time. */
export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA') // en-CA renders as yyyy-mm-dd
}

export const DEFAULT_DAILY_GOAL_MIN = 15

/**
 * Counts consecutive days up to and including `today` that appear in `days`.
 * `days` is a Set of yyyy-mm-dd keys. A gap of one full day breaks the streak,
 * but "no activity yet today" does not — yesterday-anchored streaks still count.
 */
export function computeStreak(days: Set<string>, todayKey: string): number {
  if (days.size === 0) return 0
  // Anchor on today if active today, otherwise on yesterday (grace period).
  const today = new Date(`${todayKey}T00:00:00`)
  let cursor = new Date(today)
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.toLocaleDateString('en-CA'))) return 0
  }
  let streak = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = cursor.toLocaleDateString('en-CA')
    if (days.has(key)) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else break
  }
  return streak
}

/**
 * Fold the whole event log into a UserStats row. `prev` carries forward the
 * user-chosen daily goal and the longest-streak high-water mark.
 */
export function computeStats(
  userId: string,
  events: ActivityEvent[],
  prev: Partial<UserStats> | null,
  nowISO: string
): UserStats {
  const mine = events.filter((e) => e.userId === userId)
  const days = new Set(mine.map((e) => dayKey(e.createdAt)))
  const todayKey = dayKey(nowISO)
  const streak = computeStreak(days, todayKey)

  const xp = mine.reduce((s, e) => s + (e.xp ?? 0), 0)
  const totalMinutes = mine.reduce((s, e) => s + (e.minutes ?? 0), 0)
  const wordsLearned = mine.filter((e) => e.kind === 'word_learned').length
  const lessonsCompleted = mine.filter((e) => e.kind === 'lesson_complete').length
  const lastActiveDay = mine.length
    ? mine.map((e) => dayKey(e.createdAt)).sort().slice(-1)[0]
    : prev?.lastActiveDay

  return {
    userId,
    xp,
    streak,
    longestStreak: Math.max(streak, prev?.longestStreak ?? 0),
    lastActiveDay,
    totalMinutes,
    wordsLearned,
    lessonsCompleted,
    dailyGoalMin: prev?.dailyGoalMin ?? DEFAULT_DAILY_GOAL_MIN,
    updatedAt: nowISO
  }
}

export function emptyStats(userId: string, nowISO: string): UserStats {
  return {
    userId,
    xp: 0,
    streak: 0,
    longestStreak: 0,
    totalMinutes: 0,
    wordsLearned: 0,
    lessonsCompleted: 0,
    dailyGoalMin: DEFAULT_DAILY_GOAL_MIN,
    updatedAt: nowISO
  }
}
