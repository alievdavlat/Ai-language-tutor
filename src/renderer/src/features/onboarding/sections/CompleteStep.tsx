import { useState } from 'react'
import type { CEFRLevel, PlacementResult } from '@shared/types'
import { CEFR_ORDER } from '@shared/types'
import { Button, Card, Chip } from '../../../components/ui'

interface CompleteStepProps {
  result: PlacementResult
  onConfirm: (level: CEFRLevel) => void
}

export default function CompleteStep({ result, onConfirm }: CompleteStepProps): JSX.Element {
  const [level, setLevel] = useState<CEFRLevel>(result.level)

  return (
    <Card className="text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold mb-2">All set!</h2>
      <p className="text-slate-400 mb-6">
        Your estimated level is <span className="font-bold text-brand-300">{result.level}</span>
      </p>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6 text-left">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Details</p>
        <p className="text-sm text-slate-300">{result.detail}</p>
        {result.weakAreas.length > 0 && (
          <div className="mt-3">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Focus areas</p>
            <div className="flex flex-wrap gap-1.5">
              {result.weakAreas.map((area) => (
                <span key={area} className="text-xs rounded-full px-2 py-1 bg-white/10">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-2">Not quite right? Pick your level:</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {CEFR_ORDER.map((l) => (
            <Chip key={l} selected={level === l} onClick={() => setLevel(l)}>
              {l}
            </Chip>
          ))}
        </div>
      </div>

      <Button fullWidth onClick={() => onConfirm(level)}>
        Enter the app →
      </Button>
    </Card>
  )
}
