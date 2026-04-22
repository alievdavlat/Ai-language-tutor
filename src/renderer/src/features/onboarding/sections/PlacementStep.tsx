import { useState } from 'react'
import type { PlacementAnswer, PlacementQuestion } from '@shared/types'
import { Button, Card, Input, TextArea } from '../../../components/ui'
import { cn } from '../../../lib/classnames'

interface PlacementStepProps {
  questions: PlacementQuestion[]
  onDone: (answers: PlacementAnswer[]) => void
  onBack: () => void
}

export default function PlacementStep({
  questions,
  onDone,
  onBack
}: PlacementStepProps): JSX.Element {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const q = questions[idx]
  const total = questions.length
  const currentAnswer = answers[q.id] ?? ''

  const setCurrent = (value: string): void => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
  }

  const goPrev = (): void => {
    if (idx > 0) setIdx(idx - 1)
    else onBack()
  }

  const goNext = (): void => {
    if (idx < total - 1) setIdx(idx + 1)
  }

  const submit = async (): Promise<void> => {
    setSubmitting(true)
    const arr: PlacementAnswer[] = questions.map((qu) => ({
      questionId: qu.id,
      answer: answers[qu.id] ?? ''
    }))
    onDone(arr)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Placement test</h2>
        <span className="text-xs text-slate-400">
          Question {idx + 1} / {total}
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-6">
        Quick check to find your level. Answer what you can — skip what you don&apos;t know.
      </p>

      <div className="rounded-xl bg-white/5 border border-white/10 p-5 mb-6">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">
          Target level: {q.levelTarget}
        </p>
        <p className="text-lg font-medium mb-4">{q.prompt}</p>

        {q.type === 'multiple-choice' && q.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const active = currentAnswer === opt
              return (
                <button
                  key={opt}
                  onClick={() => setCurrent(opt)}
                  className={cn(
                    'text-left rounded-lg border px-4 py-3 transition',
                    active
                      ? 'border-brand-400 bg-brand-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  )}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {q.type === 'fill-in' && (
          <Input
            placeholder="Type your answer"
            value={currentAnswer}
            onChange={(e) => setCurrent(e.target.value)}
          />
        )}

        {q.type === 'open-ended' && (
          <TextArea
            className="min-h-[120px]"
            placeholder="Write 2–4 sentences in English…"
            value={currentAnswer}
            onChange={(e) => setCurrent(e.target.value)}
          />
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={goPrev}>
          ← {idx === 0 ? 'Back' : 'Previous'}
        </Button>
        {idx < total - 1 ? (
          <Button onClick={goNext}>Next →</Button>
        ) : (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Evaluating…' : 'Finish test'}
          </Button>
        )}
      </div>
    </Card>
  )
}
