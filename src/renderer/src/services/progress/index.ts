/**
 * Progress / activity service — single source of truth for #6 Progress,
 * #18 Gamification, #34 Retention and #36 Study-buddy.
 *
 *   import { recordActivity, useStats, useQuests } from '../../services/progress'
 */
export * from './types'
export * from './catalog'
export {
  deriveStats,
  deriveQuests,
  deriveAchievements,
  deriveMilestones,
  buildLeaderboard,
  knowledgePct,
  crownTier,
  dayKey,
  weekKey,
  weekDays,
  startOfWeek,
  nextWeekStart,
  type WeekDay,
  type ProgressStats,
  type QuestView,
  type AchievementView,
  type MilestoneView,
  type LeaderRow
} from './compute'
export { useProgressStore, recordActivity, type RecordOpts } from './store'
export { useStats, useQuests, useAchievements, useMilestones } from './useProgress'
export { matchBuddies, findBuddy, matchBuddiesReal, findBuddyReal } from './buddy'
export { buildLeaderboardReal } from './leaderboard'
