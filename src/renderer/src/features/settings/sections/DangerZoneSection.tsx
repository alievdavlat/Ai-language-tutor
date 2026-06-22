import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../../../components/ui'
import { useAppStore } from '../../../store/useAppStore'
import { useT } from '../../../i18n'

export default function DangerZoneSection(): JSX.Element {
  const navigate = useNavigate()
  const signOut = useAppStore((s) => s.signOut)
  const t = useT()

  const handleReset = async (): Promise<void> => {
    if (!window.confirm(t('seta.resetConfirm'))) return
    await window.api.profile.reset()
    // signOut clears authenticated/roleSelected/onboardingComplete + profile,
    // so the post-boot redirect sends the user back to /signin instead of
    // stranding them at /home with a null profile.
    signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <Card>
      <h2 className="font-semibold mb-3 text-red-300">{t('seta.dangerZone')}</h2>
      <Button variant="danger" onClick={handleReset}>
        {t('seta.resetProfile')}
      </Button>
    </Card>
  )
}
