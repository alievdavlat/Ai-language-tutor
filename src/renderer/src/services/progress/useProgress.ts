/**
 * React selectors over the progress store. Each hook subscribes to the parts
 * of the store it needs and memoises the (pure) derivation so pages stay fast
 * and re-render only when their slice changes.
 */
import { useMemo } from 'react'
import { useProgressStore } from './store'
import {
  deriveAchievements,
  deriveMilestones,
  deriveQuests,
  deriveStats,
  type AchievementView,
  type MilestoneView,
  type ProgressStats,
  type QuestView
} from './compute'

/** A single "now" per render keeps day/week boundaries consistent. */
function useNow(): Date {
  // rev changes on every mutation, so derived values refresh after each record.
  const rev = useProgressStore((s) => s.rev)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => new Date(), [rev])
}

export function useStats(): ProgressStats {
  const events = useProgressStore((s) => s.events)
  const dailyGoalId = useProgressStore((s) => s.dailyGoalId)
  const frozenDates = useProgressStore((s) => s.frozenDates)
  const now = useNow()
  return useMemo(
    () => deriveStats(events, dailyGoalId, frozenDates, now),
    [events, dailyGoalId, frozenDates, now]
  )
}

export function useQuests(): { quests: QuestView[]; claim: (key: string, reward: number) => void } {
  const events = useProgressStore((s) => s.events)
  const dailyGoalId = useProgressStore((s) => s.dailyGoalId)
  const frozenDates = useProgressStore((s) => s.frozenDates)
  const claimed = useProgressStore((s) => s.claimedQuests)
  const claim = useProgressStore((s) => s.claimQuest)
  const now = useNow()
  const quests = useMemo(() => {
    const stats = deriveStats(events, dailyGoalId, frozenDates, now)
    return deriveQuests(events, stats, claimed, now)
  }, [events, dailyGoalId, frozenDates, claimed, now])
  return { quests, claim }
}

export function useAchievements(): AchievementView[] {
  const events = useProgressStore((s) => s.events)
  const dailyGoalId = useProgressStore((s) => s.dailyGoalId)
  const frozenDates = useProgressStore((s) => s.frozenDates)
  const unlocked = useProgressStore((s) => s.unlockedAchievements)
  const buddyId = useProgressStore((s) => s.buddyId)
  const goalSet = useProgressStore((s) => s.goalSet)
  const now = useNow()
  return useMemo(() => {
    const stats = deriveStats(events, dailyGoalId, frozenDates, now)
    return deriveAchievements(stats, unlocked, buddyId, goalSet)
  }, [events, dailyGoalId, frozenDates, unlocked, buddyId, goalSet, now])
}

export function useMilestones(): MilestoneView[] {
  const stats = useStats()
  return useMemo(() => deriveMilestones(stats), [stats])
}
