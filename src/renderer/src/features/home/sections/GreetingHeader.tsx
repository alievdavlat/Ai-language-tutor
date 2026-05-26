import type { UserProfile } from '@shared/types'
import AvatarCircle from '../../../components/ui/AvatarCircle'

interface GreetingHeaderProps {
  profile: UserProfile
}

function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Motivational tip shown under the greeting — cycles by day-of-year */
const DAILY_TIPS = [
  'Even 10 minutes a day builds fluency.',
  'Speak out loud — it trains muscle memory.',
  'Mistakes are data, not failures.',
  'Consistent beats intense, every time.',
  'Try a new topic today to stretch your vocab.',
  'Record yourself once a week — you\'ll be surprised.',
  'The best time to practice is right now.'
]

function todayTip(): string {
  const day = Math.floor(Date.now() / 86_400_000)
  return DAILY_TIPS[day % DAILY_TIPS.length]
}

export default function GreetingHeader({ profile }: GreetingHeaderProps): JSX.Element {
  const name = profile.name ?? 'friend'

  return (
    <header className="flex items-center gap-4 mb-6 animate-fade-in">
      <AvatarCircle name={name} size="lg" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">
          {timeGreeting()} 👋
        </p>
        <h1 className="page-title leading-tight truncate">{name}</h1>
        <p className="text-xs text-slate-500 mt-1 italic truncate">💡 {todayTip()}</p>
      </div>
    </header>
  )
}
