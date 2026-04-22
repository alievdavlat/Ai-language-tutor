import type { Interest } from '@shared/types'
import { Button, Card, Chip } from '../../../components/ui'
import { INTEREST_OPTIONS } from '../constants/interests'

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
  const toggle = (id: Interest): void => {
    onChange(interests.includes(id) ? interests.filter((x) => x !== id) : [...interests, id])
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-2">What topics do you enjoy?</h2>
      <p className="text-slate-400 mb-6 text-sm">
        I&apos;ll suggest conversation topics from these. Pick 2+ for best results.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {INTEREST_OPTIONS.map((o) => (
          <Chip key={o.id} selected={interests.includes(o.id)} onClick={() => toggle(o.id)}>
            <span>{o.emoji}</span>
            <span>{o.label}</span>
          </Chip>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={interests.length === 0}>
          Continue →
        </Button>
      </div>
    </Card>
  )
}
