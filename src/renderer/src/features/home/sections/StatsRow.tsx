import type { UserProfile } from '@shared/types'
import LevelProgress from '../../../components/ui/LevelProgress'
import StatTile from '../../../components/ui/StatTile'

interface StatsRowProps {
  profile: UserProfile
}

export default function StatsRow({ profile }: StatsRowProps): JSX.Element {
  // Real streak tracking is a Phase 8 feature; for now we show zeros.
  // The values are declared as `number` so the literal-type narrowing doesn't
  // flag pluralization comparisons as unreachable.
  const currentStreak: number = 0
  const longestStreak: number = 0
  const todayMinutes: number = 0
  const dailyGoal = 10

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <LevelProgress current={profile.level} progress={0.25} />
      <StatTile
        label="Current streak"
        value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
        sublabel={`Longest: ${longestStreak} day${longestStreak === 1 ? '' : 's'}`}
        icon="🔥"
        tone="listen"
      />
      <StatTile
        label="Today's practice"
        value={`${todayMinutes}/${dailyGoal} min`}
        sublabel={todayMinutes >= dailyGoal ? 'Goal reached — nice!' : 'Keep going 💪'}
        icon="⏱️"
        tone="vocab"
      />
    </section>
  )
}
