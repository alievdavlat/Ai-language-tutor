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
    <header
      className="rounded-2xl border border-white/[0.07] px-5 py-4 flex items-center gap-4 animate-fade-in overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.08) 40%, transparent 100%)'
      }}
    >
      {/* Subtle glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-brand-500/15 blur-3xl"
      />

      <AvatarCircle name={name} size="lg" />

      <div className="min-w-0 flex-1 relative">
        <p className="text-xs text-slate-400 mb-0.5">{timeGreeting()} 👋</p>
        <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">{name}</h1>
        <p className="text-xs text-slate-500 mt-1 italic truncate">💡 {todayTip()}</p>
      </div>

      {/* Level badge */}
      <div className="shrink-0 hidden sm:block relative">
        <div className="rounded-full bg-brand-500/20 border border-brand-400/30 px-4 py-1.5 text-sm font-bold text-brand-300">
          Level {profile.level}
        </div>
      </div>
    </header>
  )
}
