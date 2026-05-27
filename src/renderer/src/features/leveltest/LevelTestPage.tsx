import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CEFRLevel, UserProfile } from '@shared/types'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { ProgressBar } from '../../components/ui'
import { IconCheck, IconTarget, IconX } from '../../components/icons'
import { CEFR_ORDER, QUESTIONS, scoreToResult, type LevelResult } from './questions'

type Phase = 'intro' | 'quiz' | 'result'

export default function LevelTestPage(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)

  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null))
  const [saved, setSaved] = useState(false)

  const total = QUESTIONS.length
  const q = QUESTIONS[index]

  const correctCount = useMemo(() => {
    let c = 0
    answers.forEach((a, i) => {
      if (a !== null && a === QUESTIONS[i].correct) c += 1
    })
    return c
  }, [answers])
  const result: LevelResult = useMemo(() => scoreToResult(correctCount, total), [correctCount, total])

  const choose = (optIdx: number): void => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = optIdx
      return next
    })
  }

  const next = (): void => {
    if (index + 1 >= total) setPhase('result')
    else setIndex((i) => i + 1)
  }

  const saveLevel = async (): Promise<void> => {
    if (!profile) return
    const updated: UserProfile = { ...profile, level: result.level, updatedAt: new Date().toISOString() }
    await window.api.profile.save(updated)
    setProfile(updated)
    setSaved(true)
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-grad-brand flex items-center justify-center shadow-glow mb-6">
          <IconTarget className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">English level test</h1>
        <p className="text-slate-400 mt-3 leading-relaxed">
          {total} multiple-choice questions, no time limit. Find your CEFR level
          (A1–C2) and an IELTS estimate. You can retake it any time.
        </p>
        <div className="flex items-center gap-6 mt-6 text-sm text-slate-400">
          <span><b className="text-white">{total}</b> questions</span>
          <span><b className="text-white">~10</b> min</span>
          <span><b className="text-white">A1–C2</b> result</span>
        </div>
        <button onClick={() => setPhase('quiz')} className="btn-primary px-10 py-3 mt-8">
          Start test
        </button>
        <button onClick={() => navigate(-1)} className="text-xs text-slate-500 hover:text-slate-300 mt-4">
          Maybe later
        </button>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">Your level</p>
          <div className="text-6xl font-bold tracking-tight mt-2 bg-grad-brand bg-clip-text text-transparent">
            {result.level}
          </div>
          <p className="text-lg font-semibold text-white mt-1">{result.label}</p>
          <p className="text-slate-400 mt-3 max-w-sm">{result.blurb}</p>

          {/* CEFR ladder */}
          <div className="flex items-center gap-1.5 mt-7 w-full">
            {CEFR_ORDER.map((lv) => {
              const active = lv === result.level
              const passed = CEFR_ORDER.indexOf(lv) < CEFR_ORDER.indexOf(result.level)
              return (
                <div key={lv} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-full h-2 rounded-full',
                      active ? 'bg-grad-brand' : passed ? 'bg-brand-500/40' : 'bg-white/[0.06]'
                    )}
                  />
                  <span className={cn('text-[10px] font-semibold', active ? 'text-brand-300' : 'text-slate-500')}>
                    {lv}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Score + IELTS */}
          <div className="flex items-center gap-3 mt-7 w-full">
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3">
              <p className="text-2xl font-bold text-white">{correctCount}/{total}</p>
              <p className="text-xs text-slate-400">Correct</p>
            </div>
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3">
              <p className="text-2xl font-bold text-brand-300">{result.ielts}</p>
              <p className="text-xs text-slate-400">IELTS estimate</p>
            </div>
          </div>

          <button
            onClick={() => void saveLevel()}
            disabled={saved}
            className="btn-primary w-full py-3 mt-7 disabled:opacity-60"
          >
            {saved ? '✓ Saved as your level' : 'Use this as my level'}
          </button>
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => { setIndex(0); setAnswers(QUESTIONS.map(() => null)); setSaved(false); setPhase('intro') }}
              className="text-sm text-slate-400 hover:text-white"
            >
              Retake
            </button>
            <button onClick={() => navigate('/home')} className="text-sm text-slate-400 hover:text-white">
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const selected = answers[index]
  const progress = (index / total) * 100

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white transition shrink-0" title="Exit test">
          <IconX className="w-6 h-6" />
        </button>
        <ProgressBar value={progress} className="h-2.5" />
        <span className="text-xs font-semibold text-slate-400 shrink-0 tabular-nums">
          {index + 1}/{total}
        </span>
      </div>

      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-semibold mb-2">
          {q.area} · {q.level}
        </p>
        <h2 className="text-2xl font-bold leading-snug mb-8">{q.prompt}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((opt, i) => (
            <button
              key={opt}
              onClick={() => choose(i)}
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
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="btn-ghost px-6 py-3 disabled:opacity-40"
        >
          Back
        </button>
        <button onClick={next} disabled={selected === null} className="btn-primary flex-1 py-3 disabled:opacity-40">
          {index + 1 >= total ? (
            <span className="inline-flex items-center gap-2"><IconCheck className="w-4 h-4" /> See result</span>
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  )
}
