import { useState } from 'react'
import type { CEFRLevel, PlacementResult } from '@shared/types'
import { CEFR_ORDER } from '@shared/types'
import { Button, Card, Chip } from '../../../components/ui'

interface CompleteStepProps {
  result: PlacementResult
  onConfirm: (level: CEFRLevel) => void
}

const CEFR_DESCRIPTIONS: Record<CEFRLevel, string> = {
  A1: 'Beginner — you know basic words and can introduce yourself.',
  A2: 'Elementary — you can handle simple conversations on familiar topics.',
  B1: 'Intermediate — you can manage most everyday situations in English.',
  B2: 'Upper-intermediate — you can discuss complex topics with confidence.',
  C1: 'Advanced — you express yourself fluently and spontaneously.',
  C2: 'Proficient — you understand virtually everything you read and hear.'
}

const WEAK_AREA_LABELS: Record<string, string> = {
  'be-verb': 'To be (am/is/are)',
  'past-simple': 'Past simple tense',
  'quantifiers': 'Quantifiers',
  'first-conditional': 'Conditionals',
  'present-perfect': 'Present perfect',
  'third-conditional': 'Advanced conditionals',
  'passive-voice': 'Passive voice',
  'inversion': 'Inversion / emphasis',
  'relative-clauses': 'Relative clauses',
  'articles': 'Articles (a/an/the)',
  'prepositions': 'Prepositions',
  'modal-verbs': 'Modal verbs'
}

function friendlyArea(raw: string): string {
  return WEAK_AREA_LABELS[raw] ?? raw.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function CompleteStep({ result, onConfirm }: CompleteStepProps): JSX.Element {
  const [level, setLevel] = useState<CEFRLevel>(result.level)

  return (
    <Card className="text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold mb-2">Your level: {result.level}</h2>
      <p className="text-slate-400 mb-2 max-w-sm mx-auto text-sm">
        {CEFR_DESCRIPTIONS[result.level]}
      </p>

      {result.weakAreas.length > 0 && (
        <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 mb-5 text-left max-w-sm mx-auto">
          <p className="text-xs font-semibold text-slate-400 mb-2">
            Areas to focus on
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.weakAreas.map((area) => (
              <Chip key={area} selected={false}>
                {friendlyArea(area)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 max-w-sm mx-auto">
        <p className="text-xs text-slate-500 mb-3">
          Not quite right? Adjust your level:
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {CEFR_ORDER.map((l) => (
            <Chip key={l} selected={level === l} onClick={() => setLevel(l)}>
              {l}
            </Chip>
          ))}
        </div>
      </div>

      <Button fullWidth onClick={() => onConfirm(level)} className="!px-8">
        Start learning →
      </Button>
    </Card>
  )
}
