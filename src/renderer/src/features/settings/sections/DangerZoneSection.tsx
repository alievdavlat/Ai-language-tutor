import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../../../components/ui'
import { useAppStore } from '../../../store/useAppStore'

export default function DangerZoneSection(): JSX.Element {
  const navigate = useNavigate()
  const setProfile = useAppStore((s) => s.setProfile)

  const handleReset = async (): Promise<void> => {
    if (!window.confirm('Delete all progress and restart onboarding?')) return
    await window.api.profile.reset()
    setProfile(null)
    navigate('/', { replace: true })
  }

  return (
    <Card>
      <h2 className="font-semibold mb-3 text-red-300">Danger zone</h2>
      <Button variant="danger" onClick={handleReset}>
        Reset profile &amp; restart onboarding
      </Button>
    </Card>
  )
}
