import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { IconCheck, IconTrophy, IconX } from '../../components/icons'
import type { MCQ } from '../../services/content/exams'
import { useT } from '../../i18n'

/**
 * Self-contained multiple-choice quiz used by both unit checkpoints and the
 * course final exam. Grades client-side and reports a 0–100 score.
 */
interface ExamRunnerProps {
  title: string
  subtitle?: string
  questions: MCQ[]
  passMark: number
  /** Called once when the learner finishes, with their score (0–100). */
  onComplete: (score: number, passed: boolean) => void
  onExit?: () => void
}

export default function ExamRunner({ title, subtitle, questions, passMark, onComplete, onExit }: ExamRunnerProps): JSX.Element {
  const t = useT()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  const q = questions[idx]
  const score = Math.round((answers.filter((a, i) => a === questions[i]?.answer).length / Math.max(1, questions.length)) * 100)
  const passed = score >= passMark

  function next(): void {
    if (picked === null) return
    const nextAnswers = [...answers, picked]
    setAnswers(nextAnswers)
    setPicked(null)
    if (idx + 1 < questions.length) {
      setIdx(idx + 1)
    } else {
      const finalScore = Math.round((nextAnswers.filter((a, i) => a === questions[i]?.answer).length / questions.length) * 100)
      setDone(true)
      onComplete(finalScore, finalScore >= passMark)
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className={cn('w-16 h-16 mx-auto rounded-full flex items-center justify-center', passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
          {passed ? <IconTrophy className="w-8 h-8" /> : <IconX className="w-8 h-8" />}
        </div>
        <h3 className="text-2xl font-bold text-white mt-4">{passed ? t('crs.examPassed') : t('crs.examNotQuite')}</h3>
        <p className="text-4xl font-extrabold text-white mt-2">{score}%</p>
        <p className="text-sm text-slate-400 mt-2">
          {passed ? t('crs.examPassMsg') : `${t('crs.examNeed')} ${passMark}% ${t('crs.examNeedTail')}`}
        </p>
        {onExit && (
          <button onClick={onExit} className="btn-primary mt-5 px-6 py-2.5">{t('crs.continue')}</button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-card border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">{title}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <span className="text-xs text-slate-400">{t('crs.question')} {idx + 1} / {questions.length}</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-5">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      <h3 className="text-lg font-bold text-white mb-4">{q.q}</h3>
      <div className="flex flex-col gap-2.5">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
              picked === i ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
            )}
          >
            <span className={cn('w-6 h-6 rounded-full border flex items-center justify-center shrink-0', picked === i ? 'border-brand-400 bg-brand-500 text-white' : 'border-white/20')}>
              {picked === i && <IconCheck className="w-3.5 h-3.5" />}
            </span>
            {opt}
          </button>
        ))}
      </div>

      <button onClick={next} disabled={picked === null} className="btn-primary mt-5 w-full py-3 disabled:opacity-40">
        {idx + 1 < questions.length ? t('crs.nextQuestion') : t('crs.finish')}
      </button>
    </div>
  )
}
