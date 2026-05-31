/**
 * Activity & progress store (foundation for Progress #6 / Gamification #18).
 *
 * Thin layer over the backend's append-only activity log + the `UserStats`
 * projection. Pages call `logActivity()` whenever the learner does something
 * (finished a lesson, learned a word, spoke for N minutes); `useStats()` and
 * `useTodayProgress()` expose the rolled-up counters + daily-goal progress.
 *
 * Writing through here (rather than `backend.recordActivity` directly) also
 * fires a realtime change so other open windows / live widgets refresh.
 */
import { useCallback, useEffect, useState } from 'react'
import type { ActivityEvent, UserStats } from '@shared/types'
import { backend } from '../backend'
import { emitLocalChange, subscribeTable } from '../backend/realtime'
import { isIncognito } from '../privacy'
import { useProgressStore } from '../progress/store'
import type { RecordOpts as ProgressOpts } from '../progress/store'
import type { ActivityKind as ProgressKind } from '../progress/types'

/**
 * Bridge backend activity → the gamification progress store so the Progress
 * page (XP / streak / mastery / achievements), which reads the progress store,
 * reflects ALL learning — including course lessons, exams, stories and books
 * that record straight to the backend. Without this, completing a course lesson
 * updated Home's backend stats but left Progress showing 0 XP.
 *
 * NOTE: surfaces that ALREADY write to the progress store directly (grammar
 * exercises, flashcards, level test, speaking) must NOT route through
 * logActivity, or they would double-count here.
 */
const BACKEND_TO_PROGRESS_KIND: Record<string, ProgressKind> = {
  lesson_complete: 'lesson_complete',
  word_learned: 'word_learned',
  practice_session: 'session',
  exam_attempt: 'session',
  speaking_session: 'speaking_exchange',
  course_enroll: 'session',
  streak_day: 'session',
  achievement: 'session',
  custom: 'session'
}

function mirrorToProgressStore(event: ActivityEvent): void {
  const mapped = BACKEND_TO_PROGRESS_KIND[event.kind]
  if (!mapped) return
  const opts: ProgressOpts = { xp: event.xp ?? 0 }
  const skill = (event.meta?.skill as ProgressOpts['skill']) ?? undefined
  if (skill) opts.skill = skill
  if (event.meta) opts.meta = event.meta
  try {
    useProgressStore.getState().record(mapped, opts)
  } catch {
    /* progress store is a best-effort local mirror */
  }
}

/** XP awarded per event kind when the caller doesn't specify its own. */
const DEFAULT_XP: Record<ActivityEvent['kind'], number> = {
  lesson_complete: 20,
  word_learned: 5,
  practice_session: 10,
  exam_attempt: 50,
  speaking_session: 15,
  streak_day: 0,
  achievement: 30,
  course_enroll: 5,
  custom: 0
}

/** Record one learning event and refresh the user's stats projection. */
export async function logActivity(
  input: Omit<ActivityEvent, 'id' | 'createdAt' | 'xp'> & { xp?: number }
): Promise<{ event: ActivityEvent; stats: UserStats }> {
  // Incognito (#39) — don't persist the event or touch stats.
  if (isIncognito()) {
    const stats = await backend.getStats(input.userId)
    return { event: { ...input, id: 'incognito', xp: 0, createdAt: new Date().toISOString() }, stats }
  }
  const xp = input.xp ?? DEFAULT_XP[input.kind] ?? 0
  const res = await backend.recordActivity({ ...input, xp })
  mirrorToProgressStore(res.event)
  emitLocalChange({ event: 'INSERT', table: 'activity_events', new: res.event as unknown as Record<string, unknown>, old: null })
  emitLocalChange({ event: 'UPDATE', table: 'user_stats', new: res.stats as unknown as Record<string, unknown>, old: null })
  return res
}

/** Minutes practised today (local day), summed from the activity log. */
export async function getTodayMinutes(userId: string): Promise<number> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const events = await backend.listActivity(userId, { since: start.toISOString() })
  return events.reduce((s, e) => s + (e.minutes ?? 0), 0)
}

/** Daily-goal completion as 0–100. */
export function goalProgressPct(stats: UserStats | null, todayMinutes: number): number {
  if (!stats || stats.dailyGoalMin <= 0) return 0
  return Math.min(100, Math.round((todayMinutes / stats.dailyGoalMin) * 100))
}

// ─── React hooks ─────────────────────────────────────────────────────────────

/** Live `UserStats` for a user (defaults to the current viewer). */
export function useStats(userId?: string | null): {
  stats: UserStats | null
  loading: boolean
  refresh: () => void
} {
  const id = userId ?? backend.currentUserId()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    backend
      .getStats(id)
      .then((s) => { if (!cancelled) setStats(s) })
      .finally(() => { if (!cancelled) setLoading(false) })
    // refresh when the stats row changes anywhere
    const unsub = subscribeTable('user_stats', () => setTick((t) => t + 1), { filter: `user_id=eq.${id}` })
    return () => { cancelled = true; unsub() }
  }, [id, tick])

  return { stats, loading, refresh: () => setTick((t) => t + 1) }
}

/** Today's minutes + daily-goal progress for a user. */
export function useTodayProgress(userId?: string | null): {
  todayMinutes: number
  goalPct: number
  stats: UserStats | null
  loading: boolean
} {
  const id = userId ?? backend.currentUserId()
  const { stats, loading: statsLoading } = useStats(id)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    let cancelled = false
    getTodayMinutes(id)
      .then((m) => { if (!cancelled) setTodayMinutes(m) })
      .finally(() => { if (!cancelled) setLoading(false) })
    const unsub = subscribeTable('activity_events', () => {
      void getTodayMinutes(id).then((m) => { if (!cancelled) setTodayMinutes(m) })
    }, { filter: `user_id=eq.${id}` })
    return () => { cancelled = true; unsub() }
  }, [id, stats?.updatedAt])

  return { todayMinutes, goalPct: goalProgressPct(stats, todayMinutes), stats, loading: loading || statsLoading }
}

/** Imperative recorder for components (stable callback). */
export function useLogActivity(): typeof logActivity {
  return useCallback(logActivity, [])
}
