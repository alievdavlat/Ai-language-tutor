import type { UserProfile } from '@shared/types'
import LevelProgress from '../../../components/ui/LevelProgress'
import StatTile from '../../../components/ui/StatTile'

interface StatsRowProps {
  profile: UserProfile
}

export default function StatsRow({ profile }: StatsRowProps): JSX.Element {
  // Real streak / XP tracking comes in Phase 8.
  // Until then, show "–" instead of misleading zeros.
  const currentStreak: number = 0
  const longestStreak: number = 0
  const todayMinutes: number = 0
  const dailyGoal = 10
  const noData = currentStreak === 0 && todayMinutes === 0

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {/* Level progress */}
      <LevelProgress current={profile.level} progress={0.25} />

      {/* Streak */}
      <StatTile
        label="Daily streak"
        value={noData ? '–' : `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
        sublabel={
          noData
            ? 'Start your first session!'
            : `Best: ${longestStreak} day${longestStreak === 1 ? '' : 's'}`
        }
        icon="🔥"
        tone="listen"
      />

      {/* Daily goal */}
      <StatTile
        label="Today's practice"
        value={noData ? '–' : `${todayMinutes}/${dailyGoal} min`}
        sublabel={
          noData
            ? `Goal: ${dailyGoal} min/day`
            : todayMinutes >= dailyGoal
              ? '✓ Goal reached!'
              : `${dailyGoal - todayMinutes} min left`
        }
        icon="⏱️"
        tone="vocab"
      />
    </section>
  )
}
