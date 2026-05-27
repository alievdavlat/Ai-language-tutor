import { useState } from 'react'
import type { PlacementAnswer, PlacementQuestion } from '@shared/types'
import { Button, Input, TextArea } from '../../../components/ui'
import { cn } from '../../../lib/classnames'

// ─── Constants ────────────────────────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlacementStepProps {
  questions: PlacementQuestion[]
  onDone: (answers: PlacementAnswer[]) => void
  onBack: () => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ChoiceOptionProps {
  letter: string
  label: string
  selected: boolean
  onSelect: () => void
}

function ChoiceOption({ letter, label, selected, onSelect }: ChoiceOptionProps): JSX.Element {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'text-left rounded-xl border px-4 py-3 transition-all duration-150 flex items-center gap-3',
        selected
          ? 'border-brand-400 bg-brand-500/20 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-slate-200'
      )}
    >
      <span
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
          selected ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-400'
        )}
      >
        {letter}
      </span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlacementStep({
  questions,
  onDone,
  onBack
}: PlacementStepProps): JSX.Element {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const question = questions[idx]
  const total = questions.length
  const currentAnswer = answers[question.id] ?? ''
  const progressPct = Math.round((idx / total) * 100)

  const setAnswer = (value: string): void => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  const goPrev = (): void => {
    if (idx > 0) setIdx(idx - 1)
    else onBack()
  }

  const goNext = (): void => {
    if (idx < total - 1) setIdx(idx + 1)
  }

  const submit = (): void => {
    setSubmitting(true)
    const arr: PlacementAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? ''
    }))
    onDone(arr)
  }

  const isMultipleChoice = question.type === 'multiple-choice'
  const canAdvance = !isMultipleChoice || !!currentAnswer

  return (
    <div className="max-w-xl mx-auto w-full">
      {/* Progress */}
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
          {question.type === 'open-ended' ? 'Writing sample' : 'Choose the correct answer'}
        </p>
        <p className="text-xl font-semibold mb-5 leading-snug">{question.prompt}</p>

        {isMultipleChoice && question.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.options.map((opt, i) => (
              <ChoiceOption
                key={opt}
                letter={OPTION_LETTERS[i] ?? String(i + 1)}
                label={opt}
                selected={currentAnswer === opt}
                onSelect={() => setAnswer(opt)}
              />
            ))}
          </div>
        )}

        {question.type === 'fill-in' && (
          <Input
            placeholder="Type your answer here"
            value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && idx < total - 1) goNext()
            }}
            autoFocus
          />
        )}

        {question.type === 'open-ended' && (
          <div>
            <TextArea
              className="min-h-[140px]"
              placeholder="Write 2–4 sentences in English about anything you like…"
              value={currentAnswer}
              onChange={(e) => setAnswer(e.target.value)}
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
          <Button onClick={goNext} disabled={!canAdvance}>
            Next →
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="!px-8">
            {submitting ? 'Analysing…' : 'See my results →'}
          </Button>
        )}
      </div>
    </div>
  )
}
