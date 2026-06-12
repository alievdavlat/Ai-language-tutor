import type { UserProfile } from '@shared/types'
import LevelProgress from '../../../components/ui/LevelProgress'
import StatTile from '../../../components/ui/StatTile'
import { useT } from '../../../i18n'

interface StatsRowProps {
  profile: UserProfile
}

export default function StatsRow({ profile }: StatsRowProps): JSX.Element {
  const t = useT()
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
        label={t('home.dailyStreak')}
        value={noData ? '–' : t('home.daysCount', { n: currentStreak })}
        sublabel={
          noData
            ? t('home.startFirstSession')
            : t('home.bestStreak', { n: longestStreak })
        }
        icon="🔥"
        tone="listen"
      />

      {/* Daily goal */}
      <StatTile
        label={t('home.todaysPractice')}
        value={noData ? '–' : `${todayMinutes}/${dailyGoal} min`}
        sublabel={
          noData
            ? t('home.goalPerDay', { n: dailyGoal })
            : todayMinutes >= dailyGoal
              ? t('home.goalReached')
              : t('home.minLeft', { n: dailyGoal - todayMinutes })
        }
        icon="⏱️"
        tone="vocab"
      />
    </section>
  )
}
