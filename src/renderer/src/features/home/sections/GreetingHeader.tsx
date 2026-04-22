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

export default function GreetingHeader({ profile }: GreetingHeaderProps): JSX.Element {
  const name = profile.name ?? 'friend'
  return (
    <header className="flex items-center justify-between gap-4 mb-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <AvatarCircle name={name} size="lg" />
        <div>
          <p className="text-sm text-slate-400">{timeGreeting()} 👋</p>
          <h1 className="page-title">{name}</h1>
        </div>
      </div>
      <div className="hidden sm:block text-right">
        <p className="text-sm text-slate-400">Your Smart AI</p>
        <p className="text-lg font-semibold">Language Coach</p>
      </div>
    </header>
  )
}
