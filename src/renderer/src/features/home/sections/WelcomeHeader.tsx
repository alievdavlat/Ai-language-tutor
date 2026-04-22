import { useNavigate } from 'react-router-dom'
import type { UserProfile } from '@shared/types'
import { Button } from '../../../components/ui'

interface WelcomeHeaderProps {
  profile: UserProfile
}

export default function WelcomeHeader({ profile }: WelcomeHeaderProps): JSX.Element {
  const navigate = useNavigate()
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{profile.name ? `, ${profile.name}` : ''} 👋
        </h1>
        <p className="text-slate-400 mt-1">
          Level {profile.level} · goals: {profile.goals.join(', ') || 'none'}
        </p>
      </div>
      <Button variant="ghost" onClick={() => navigate('/settings')}>
        ⚙️ Settings
      </Button>
    </header>
  )
}
