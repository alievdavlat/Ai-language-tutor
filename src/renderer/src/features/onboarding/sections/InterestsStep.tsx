import type { Interest } from '@shared/types'
import { Button, Card, Chip } from '../../../components/ui'
import { INTEREST_OPTIONS } from '../constants/interests'
import { useT } from '../../../i18n'
import type { StringKey } from '../../../i18n/strings'

interface InterestsStepProps {
  interests: Interest[]
  onChange: (interests: Interest[]) => void
  onNext: () => void
  onBack: () => void
}

export default function InterestsStep({
  interests,
  onChange,
  onNext,
  onBack
}: InterestsStepProps): JSX.Element {
  const t = useT()
  const toggle = (id: Interest): void => {
    onChange(interests.includes(id) ? interests.filter((x) => x !== id) : [...interests, id])
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-2">{t('ob.interests.title')}</h2>
      <p className="text-slate-400 mb-6 text-sm">
        {t('ob.interests.subtitle')}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {INTEREST_OPTIONS.map((o) => (
          <Chip key={o.id} selected={interests.includes(o.id)} onClick={() => toggle(o.id)}>
            <span>{o.emoji}</span>
            <span>{t(`ob.interest.${o.id}` as StringKey)}</span>
          </Chip>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        <Button onClick={onNext} disabled={interests.length === 0}>
          {t('common.continue')} →
        </Button>
      </div>
    </Card>
  )
}
