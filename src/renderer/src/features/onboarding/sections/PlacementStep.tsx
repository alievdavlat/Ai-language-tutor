import { useState } from 'react'
import type { PlacementAnswer, PlacementQuestion } from '@shared/types'
import { Button, Input, TextArea } from '../../../components/ui'
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
  const progressPct = Math.round((idx / total) * 100)

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
    <div className="max-w-xl mx-auto w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Placement test</span>
          <span>{idx + 1} / {total}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-grad-brand transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 mb-5 animate-fade-in">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
          {q.type === 'open-ended' ? 'Writing sample' : 'Choose the correct answer'}
        </p>
        <p className="text-xl font-semibold mb-5 leading-snug">{q.prompt}</p>

        {q.type === 'multiple-choice' && q.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {q.options.map((opt, i) => {
              const active = currentAnswer === opt
              const letters = ['A', 'B', 'C', 'D']
              return (
                <button
                  key={opt}
                  onClick={() => setCurrent(opt)}
                  className={cn(
                    'text-left rounded-xl border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                    active
                      ? 'border-brand-400 bg-brand-500/20 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.3)]'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-slate-200'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                    active ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-400'
                  )}>
                    {letters[i] ?? i + 1}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {q.type === 'fill-in' && (
          <Input
            placeholder="Type your answer here"
            value={currentAnswer}
            onChange={(e) => setCurrent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && idx < total - 1) goNext()
            }}
            autoFocus
          />
        )}

        {q.type === 'open-ended' && (
          <div>
            <TextArea
              className="min-h-[140px]"
              placeholder="Write 2–4 sentences in English about anything you like…"
              value={currentAnswer}
              onChange={(e) => setCurrent(e.target.value)}
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-2">
              There are no right or wrong answers here — this helps us understand your
              writing style and vocabulary.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={goPrev}>
          ← {idx === 0 ? 'Back' : 'Previous'}
        </Button>
        {idx < total - 1 ? (
          <Button
            onClick={goNext}
            disabled={q.type === 'multiple-choice' && !currentAnswer}
          >
            Next →
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={submitting}
            className="!px-8"
          >
            {submitting ? 'Analysing…' : 'See my results →'}
          </Button>
        )}
      </div>
    </div>
  )
}
