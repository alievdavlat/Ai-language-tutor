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
 * Callers that need a SPECIFIC progress kind (flashcard_round, level_test,
 * speaking_exchange, correction — they drive quests/achievements) pass it as
 * `meta.progressKind`; the generic map below is the fallback. (#A49 routed the
 * last progress-only surfaces through here, so backend + progress now both see
 * every kind of learning exactly once.)
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
  const override = event.meta?.progressKind as ProgressKind | undefined
  const mapped = override ?? BACKEND_TO_PROGRESS_KIND[event.kind]
  if (!mapped) return
  const opts: ProgressOpts = { xp: event.xp ?? 0 }
  const skill = (event.meta?.skill as ProgressOpts['skill']) ?? undefined
  if (skill) opts.skill = skill
  if (typeof event.meta?.count === 'number') opts.count = event.meta.count
  if (typeof event.meta?.accuracy === 'number') opts.accuracy = event.meta.accuracy
  if (event.meta) opts.meta = event.meta
  try {
    useProgressStore.getState().record(mapped, opts)
  } catch {
    /* progress store is a best-effort local mirror */
  }
}

/**
 * Backfill the local gamification progress store from the backend activity
 * ledger. Used to reconcile a learner whose backend already has history but
 * whose progress store is empty — e.g. someone seeded before the
 * `mirrorToProgressStore` bridge existed, or a fresh device sharing one cloud
 * account. Without this they show the full XP on Account/Profile (backend
 * stats) but 0 XP on Home/Progress/Quests (progress store).
 *
 * Idempotent and safe: it's a no-op the moment the progress store has ANY
 * events, so it never double-counts learning the mirror already recorded.
 */
export async function reconcileProgressFromBackend(userId: string): Promise<void> {
  if (useProgressStore.getState().events.length > 0) return
  const events = await backend.listActivity(userId, { limit: 500 })
  // Oldest-first so streak/day derivations see events in chronological order.
  for (const ev of events.slice().reverse()) mirrorToProgressStore(ev)
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
  void syncChallenges(res.event, res.stats)
  emitLocalChange({ event: 'INSERT', table: 'activity_events', new: res.event as unknown as Record<string, unknown>, old: null })
  emitLocalChange({ event: 'UPDATE', table: 'user_stats', new: res.stats as unknown as Record<string, unknown>, old: null })
  return res
}

/**
 * #B18 — bridge real activity into joined challenges so progress actually
 * advances (they were joinable-but-inert: only the seed ever moved them).
 * Maps each event to the challenge metric and writes the new cumulative
 * progress; completing fires a one-time notification.
 *
 *   streak  → absolute current streak
 *   words   → += word_learned count
 *   minutes → += this event's minutes
 *   lessons → +1 per lesson_complete
 */
async function syncChallenges(event: ActivityEvent, stats: UserStats): Promise<void> {
  try {
    const joined = await backend.myChallenges(event.userId)
    for (const { challenge, participant } of joined) {
      if (participant.completedAt) continue
      let next = participant.progress
      switch (challenge.kind) {
        case 'streak':
          next = Math.max(participant.progress, stats.streak)
          break
        case 'words':
          if (event.kind === 'word_learned') next += Number((event.meta?.count as number) ?? 1)
          break
        case 'minutes':
          next += event.minutes ?? 0
          break
        case 'lessons':
          if (event.kind === 'lesson_complete') next += 1
          break
        default:
          break
      }
      if (next <= participant.progress) continue
      await backend.updateChallengeProgress(event.userId, challenge.id, next)
      if (next >= challenge.goal) {
        await backend
          .createNotif({
            userId: event.userId,
            type: 'social',
            kind: 'challenge',
            title: 'Challenge complete! 🏆',
            body: `You finished "${challenge.title}".`,
            link: '/community'
          })
          .catch(() => undefined)
      }
    }
  } catch {
    /* challenge sync is best-effort */
  }
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
