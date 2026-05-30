/**
 * The progress / activity store — the foundation every gamification, progress,
 * retention and study-buddy surface reads from. Append-only event log + small
 * preference maps, persisted to localStorage via zustand's persist middleware.
 * Swapping to a cloud backend later means replacing the storage adapter only.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActivityEvent,
  ActivityKind,
  DailyGoalId,
  DigestPrefs,
  ReminderPrefs,
  SkillKey
} from './types'
import { MILESTONES } from './catalog'
import {
  deriveAchievements,
  deriveStats,
  dayKey,
  reachedMilestones
} from './compute'

const DEFAULT_XP: Record<ActivityKind, number> = {
  speaking_exchange: 5,
  correction: 2,
  word_learned: 3,
  flashcard_round: 15,
  lesson_complete: 10,
  level_test: 20,
  pronunciation: 5,
  listening: 5,
  quest_reward: 0,
  milestone_reward: 0,
  session: 5
}

export interface RecordOpts {
  xp?: number
  skill?: SkillKey
  count?: number
  accuracy?: number
  meta?: Record<string, unknown>
}

interface ProgressState {
  events: ActivityEvent[]
  dailyGoalId: DailyGoalId
  /** Whether the user ever explicitly picked a goal (vs. the default). */
  goalSet: boolean
  claimedQuests: Record<string, string>
  unlockedAchievements: Record<string, string>
  grantedMilestones: number[]
  streakFreezes: number
  /** Days the user has protected — count as active for the streak. */
  frozenDates: string[]
  /** When armed, a missed day auto-consumes a freeze to keep the streak. */
  freezeArmed: boolean
  reminders: ReminderPrefs
  digests: DigestPrefs
  buddyId: string | null
  buddySince: string | null
  /** Bumped whenever derived state should re-read (also drives selectors). */
  rev: number

  // actions
  record: (kind: ActivityKind, opts?: RecordOpts) => void
  setDailyGoal: (id: DailyGoalId) => void
  claimQuest: (claimKey: string, reward: number) => void
  setReminders: (patch: Partial<ReminderPrefs>) => void
  setDigests: (patch: Partial<DigestPrefs>) => void
  armFreeze: (armed: boolean) => void
  /** Spend a freeze (or 200 XP) to bridge the gap and restore a broken streak. */
  repairStreak: () => boolean
  /** Called on app open: auto-applies an armed freeze to a single missed day. */
  protectStreak: () => void
  pairBuddy: (buddyId: string) => void
  unpairBuddy: () => void
  /** Wipe all progress (Account → danger zone). */
  resetProgress: () => void
}

let counter = 0
function eventId(): string {
  counter += 1
  return `ev_${Date.now().toString(36)}_${counter}`
}

/** Re-evaluate milestones + achievements after the event log changes. */
function syncDerived(get: () => ProgressState, set: (p: Partial<ProgressState>) => void): void {
  const s = get()
  const now = new Date()
  const stats = deriveStats(s.events, s.dailyGoalId, s.frozenDates, now)

  // Milestone rewards — grant once per threshold reached.
  const reached = reachedMilestones(Math.max(stats.streak, stats.longestStreak))
  const newlyReached = reached.filter((d) => !s.grantedMilestones.includes(d))
  let events = s.events
  let freezes = s.streakFreezes
  if (newlyReached.length) {
    for (const days of newlyReached) {
      const m = MILESTONES.find((x) => x.days === days)
      if (!m) continue
      events = [
        ...events,
        {
          id: eventId(),
          kind: 'milestone_reward',
          at: now.toISOString(),
          xp: m.reward,
          meta: { milestone: m.title, days }
        }
      ]
      freezes += m.freezes
    }
  }

  // Achievement unlocks — stamp newly earned ones so they stick.
  const achievements = deriveAchievements(stats, s.unlockedAchievements, s.buddyId, s.goalSet)
  const unlocked = { ...s.unlockedAchievements }
  let changedUnlocks = false
  for (const a of achievements) {
    if (a.earned && !unlocked[a.id]) {
      unlocked[a.id] = now.toISOString()
      changedUnlocks = true
    }
  }

  if (newlyReached.length || changedUnlocks) {
    set({
      events,
      streakFreezes: freezes,
      grantedMilestones: [...s.grantedMilestones, ...newlyReached],
      unlockedAchievements: unlocked,
      rev: s.rev + 1
    })
  }
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      events: [],
      dailyGoalId: 'regular',
      goalSet: false,
      claimedQuests: {},
      unlockedAchievements: {},
      grantedMilestones: [],
      streakFreezes: 2,
      frozenDates: [],
      freezeArmed: true,
      reminders: { enabled: true, hour: 19 },
      digests: { dailyEmail: false, weeklyEmail: true, push: true },
      buddyId: null,
      buddySince: null,
      rev: 0,

      record: (kind, opts = {}) => {
        const xp = opts.xp ?? (opts.count != null ? DEFAULT_XP[kind] * opts.count : DEFAULT_XP[kind])
        const ev: ActivityEvent = {
          id: eventId(),
          kind,
          at: new Date().toISOString(),
          xp,
          skill: opts.skill,
          count: opts.count,
          accuracy: opts.accuracy,
          meta: opts.meta
        }
        set({ events: [...get().events, ev], rev: get().rev + 1 })
        syncDerived(get, set)
      },

      setDailyGoal: (id) => {
        set({ dailyGoalId: id, goalSet: true, rev: get().rev + 1 })
        syncDerived(get, set)
      },

      claimQuest: (claimKey, reward) => {
        if (get().claimedQuests[claimKey]) return
        const now = new Date().toISOString()
        set({
          claimedQuests: { ...get().claimedQuests, [claimKey]: now },
          events: [
            ...get().events,
            { id: eventId(), kind: 'quest_reward', at: now, xp: reward, meta: { claimKey } }
          ],
          rev: get().rev + 1
        })
        syncDerived(get, set)
      },

      setReminders: (patch) => set({ reminders: { ...get().reminders, ...patch }, rev: get().rev + 1 }),
      setDigests: (patch) => set({ digests: { ...get().digests, ...patch }, rev: get().rev + 1 }),
      armFreeze: (armed) => set({ freezeArmed: armed, rev: get().rev + 1 }),

      repairStreak: () => {
        const s = get()
        const now = new Date()
        // Find the most recent active (or already-frozen) day before today.
        const activeKeys = new Set<string>(s.events.map((e) => dayKey(new Date(e.at))))
        for (const f of s.frozenDates) activeKeys.add(f)
        // Walk back up to 14 days to find the last active day.
        let lastActive: Date | null = null
        for (let i = 1; i <= 14; i++) {
          const d = new Date(now.getTime() - i * 86400000)
          if (activeKeys.has(dayKey(d))) {
            lastActive = d
            break
          }
        }
        if (!lastActive) return false
        // Days to bridge: from the day after lastActive up to yesterday.
        const bridge: string[] = []
        let cur = new Date(lastActive.getTime() + 86400000)
        const yesterday = new Date(now.getTime() - 86400000)
        while (dayKey(cur) <= dayKey(yesterday)) {
          if (!activeKeys.has(dayKey(cur))) bridge.push(dayKey(cur))
          cur = new Date(cur.getTime() + 86400000)
        }
        if (!bridge.length) return false

        // Cost: 1 freeze if available, else 200 XP (recorded as a negative-free
        // session is awkward — instead require a freeze OR enough XP balance).
        if (s.streakFreezes >= 1) {
          set({
            streakFreezes: s.streakFreezes - 1,
            frozenDates: [...s.frozenDates, ...bridge],
            rev: s.rev + 1
          })
          syncDerived(get, set)
          return true
        }
        return false
      },

      protectStreak: () => {
        const s = get()
        if (!s.freezeArmed || s.streakFreezes < 1) return
        const now = new Date()
        const activeKeys = new Set<string>(s.events.map((e) => dayKey(new Date(e.at))))
        for (const f of s.frozenDates) activeKeys.add(f)
        const todayKey = dayKey(now)
        const yKey = dayKey(new Date(now.getTime() - 86400000))
        const dbyKey = dayKey(new Date(now.getTime() - 2 * 86400000))
        // Only auto-protect a *single* missed yesterday that would break an
        // otherwise-live streak (day-before-yesterday was active, today not yet).
        if (!activeKeys.has(yKey) && activeKeys.has(dbyKey) && !activeKeys.has(todayKey)) {
          set({
            streakFreezes: s.streakFreezes - 1,
            frozenDates: [...s.frozenDates, yKey],
            rev: s.rev + 1
          })
          syncDerived(get, set)
        }
      },

      pairBuddy: (buddyId) => {
        set({ buddyId, buddySince: new Date().toISOString(), rev: get().rev + 1 })
        syncDerived(get, set)
      },
      unpairBuddy: () => set({ buddyId: null, buddySince: null, rev: get().rev + 1 }),

      resetProgress: () =>
        set({
          events: [],
          claimedQuests: {},
          unlockedAchievements: {},
          grantedMilestones: [],
          streakFreezes: 2,
          frozenDates: [],
          buddyId: null,
          buddySince: null,
          rev: get().rev + 1
        })
    }),
    {
      name: 'speakai.progress.v1',
      partialize: (s) => ({
        events: s.events,
        dailyGoalId: s.dailyGoalId,
        goalSet: s.goalSet,
        claimedQuests: s.claimedQuests,
        unlockedAchievements: s.unlockedAchievements,
        grantedMilestones: s.grantedMilestones,
        streakFreezes: s.streakFreezes,
        frozenDates: s.frozenDates,
        freezeArmed: s.freezeArmed,
        reminders: s.reminders,
        digests: s.digests,
        buddyId: s.buddyId,
        buddySince: s.buddySince
      })
    }
  )
)

/**
 * Non-hook recorder for use outside React (services, hooks deep in the tree).
 * Same as `useProgressStore.getState().record` but ergonomic at call sites.
 */
export function recordActivity(kind: ActivityKind, opts?: RecordOpts): void {
  useProgressStore.getState().record(kind, opts)
}
