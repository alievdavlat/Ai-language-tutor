import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { ProgressBar } from '../../components/ui'
import { IconX } from '../../components/icons'
import { useT } from '../../i18n'
import {
  ITEM_BANK,
  MAX_ITEMS,
  createSession,
  selectNext,
  applyResponse,
  isComplete,
  finalize,
  type Item,
  type Session,
  type LevelEstimate
} from './engine'

interface AdaptiveQuizProps {
  /** Called once when the adaptive loop converges or runs out of items. */
  onComplete: (result: LevelEstimate) => void
  /** Optional exit affordance (top-left ✕). */
  onExit?: () => void
}

/**
 * Self-contained adaptive level quiz. Picks each question from ITEM_BANK by the
 * Rasch max-information rule (engine.ts), re-estimates ability after every
 * answer, and stops as soon as the estimate is confident — so a strong learner
 * answers fewer, harder items and a beginner isn't dragged through C2 grammar.
 * No LLM / network: leveling is a pure algorithm.
 */
export default function AdaptiveQuiz({ onComplete, onExit }: AdaptiveQuizProps): JSX.Element {
  const t = useT()
  const [session, setSession] = useState<Session>(() => createSession())
  const [current, setCurrent] = useState<Item | null>(() => selectNext(ITEM_BANK, createSession()))
  const [selected, setSelected] = useState<number | null>(null)

  const answered = session.responses.length
  // Progress is approximate (the test can stop early once confident); cap at the
  // max so the bar never implies more questions than will be asked.
  const progress = Math.min(100, (answered / MAX_ITEMS) * 100)

  const submit = (): void => {
    if (!current || selected === null) return
    const correct = selected === current.correct // "I don't know" (-1) ≠ correct
    const next = applyResponse(session, current, correct)
    setSelected(null)
    if (isComplete(next, ITEM_BANK.length)) {
      setSession(next)
      onComplete(finalize(next))
      return
    }
    const upcoming = selectNext(ITEM_BANK, next)
    if (!upcoming) {
      setSession(next)
      onComplete(finalize(next))
      return
    }
    setSession(next)
    setCurrent(upcoming)
  }

  if (!current) {
    return (
      <div className="text-center text-slate-400 py-12">{t('spk.preparingTest')}</div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-4 mb-8">
        {onExit && (
          <button onClick={onExit} className="text-slate-500 hover:text-white transition shrink-0" title={t('spk.exitTest')}>
            <IconX className="w-6 h-6" />
          </button>
        )}
        <ProgressBar value={progress} className="h-2.5" />
        <span className="text-xs font-semibold text-slate-400 shrink-0 tabular-nums">
          Q{answered + 1}
        </span>
      </div>

      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-semibold mb-2">
          {current.skill} · {t('spk.adaptive')}
        </p>
        <h2 className="text-2xl font-bold leading-snug mb-8">{current.prompt}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {current.options.map((opt, i) => (
            <button
              key={opt}
              onClick={() => setSelected(i)}
              className={cn(
                'rounded-2xl border px-4 py-4 text-left font-semibold transition',
                selected === i
                  ? 'border-brand-400 bg-brand-500/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]'
              )}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelected(-1)}
          className={cn(
            'mt-3 w-full rounded-2xl border border-dashed px-4 py-3 text-sm font-semibold transition',
            selected === -1
              ? 'border-slate-400 bg-white/[0.08] text-slate-200'
              : 'border-white/15 bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
          )}
        >
          🤔 {t('spk.idkSkip')}
        </button>
      </div>

      <div className="mt-6">
        <button onClick={submit} disabled={selected === null} className="btn-primary w-full py-3 disabled:opacity-40">
          {answered + 1 >= MAX_ITEMS ? t('spk.finishSeeResult') : t('spk.next')}
        </button>
      </div>
    </div>
  )
}
