import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar } from '../../components/ui'
import { IconBolt, IconCheck, IconHeart, IconX } from '../../components/icons'

// Hardcoded preview drills — real exercises come from the lesson/coursebook engine.
interface Question {
  prompt: string
  hint: string
  options: string[]
  correct: number
}

const QUESTIONS: Question[] = [
  {
    prompt: 'She ___ to work every morning.',
    hint: 'Present simple · third person',
    options: ['go', 'goes', 'going', 'gone'],
    correct: 1
  },
  {
    prompt: "Don't call me now — I ___ dinner.",
    hint: 'Present continuous',
    options: ['have', 'has', 'am having', 'had'],
    correct: 2
  },
  {
    prompt: "Which word means 'darhol'?",
    hint: 'Vocabulary',
    options: ['immediately', 'rarely', 'later', 'slowly'],
    correct: 0
  }
]

export default function ExercisePlayer(): JSX.Element {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [hearts, setHearts] = useState(5)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const q = QUESTIONS[index]
  const isCorrect = selected === q.correct

  const onCheck = (): void => {
    if (selected === null) return
    setChecked(true)
    if (selected === q.correct) setCorrectCount((c) => c + 1)
    else setHearts((h) => Math.max(0, h - 1))
  }

  const onContinue = (): void => {
    if (index + 1 >= QUESTIONS.length) {
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setChecked(false)
  }

  const progress = ((index + (checked ? 1 : 0)) / QUESTIONS.length) * 100

  if (done) {
    const xp = correctCount * 10
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-grad-brand flex items-center justify-center shadow-glow animate-fade-in">
          <IconBolt className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson complete!</h1>
          <p className="text-slate-400 mt-2">
            {correctCount} / {QUESTIONS.length} correct
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
            <p className="text-2xl font-bold text-brand-300">+{xp}</p>
            <p className="text-xs text-slate-400">XP earned</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
            <p className="text-2xl font-bold text-amber-300">{hearts}</p>
            <p className="text-xs text-slate-400">Hearts left</p>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary px-8 mt-2"
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-6">
      {/* Top bar: close, progress, hearts */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-white transition shrink-0"
          title="Exit lesson"
        >
          <IconX className="w-6 h-6" />
        </button>
        <ProgressBar value={progress} className="h-2.5" />
        <span className="inline-flex items-center gap-1 text-rose-300 font-bold shrink-0">
          <IconHeart className="w-5 h-5" /> {hearts}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-semibold mb-2">
          {q.hint}
        </p>
        <h2 className="text-2xl font-bold leading-snug mb-8">{q.prompt}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            const isSel = selected === i
            const showCorrect = checked && i === q.correct
            const showWrong = checked && isSel && i !== q.correct
            return (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={cn(
                  'rounded-2xl border px-4 py-4 text-left font-semibold transition',
                  showCorrect
                    ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                    : showWrong
                      ? 'border-rose-400/60 bg-rose-500/15 text-rose-200'
                      : isSel
                        ? 'border-brand-400 bg-brand-500/15 text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]'
                )}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback + action */}
      <div className="mt-6">
        {checked && (
          <div
            className={cn(
              'rounded-xl px-4 py-3 mb-3 text-sm font-semibold flex items-center gap-2',
              isCorrect ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
            )}
          >
            <IconCheck className="w-4 h-4" />
            {isCorrect ? 'Correct!' : `Answer: ${q.options[q.correct]}`}
          </div>
        )}
        {!checked ? (
          <button
            onClick={onCheck}
            disabled={selected === null}
            className="btn-primary w-full py-3 disabled:opacity-40"
          >
            Check
          </button>
        ) : (
          <button onClick={onContinue} className="btn-primary w-full py-3">
            {index + 1 >= QUESTIONS.length ? 'Finish' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}
