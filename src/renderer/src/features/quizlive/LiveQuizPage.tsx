import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, SectionHeading } from '../../components/ui'
import { IconBolt, IconLive, IconStar, IconUsers, IconX } from '../../components/icons'

type Phase = 'lobby' | 'question' | 'leaderboard'

const PLAYERS = [
  { name: 'Aziz', score: 0, me: true },
  { name: 'Sasha K.', score: 0 },
  { name: 'Wei Lin', score: 0 },
  { name: 'Priya S.', score: 0 },
  { name: 'Marco B.', score: 0 },
  { name: 'Emma W.', score: 0 },
  { name: 'Yui T.', score: 0 },
  { name: 'James L.', score: 0 }
]

const RESULTS = [
  { name: 'Wei Lin', score: 3850, change: '+2' },
  { name: 'Aziz', score: 3420, change: '+5', me: true },
  { name: 'Priya S.', score: 3210, change: '−1' },
  { name: 'Sasha K.', score: 2980 },
  { name: 'Marco B.', score: 2740 },
  { name: 'Emma W.', score: 2410 },
  { name: 'Yui T.', score: 2180 },
  { name: 'James L.', score: 1950 }
]

interface Q {
  prompt: string
  options: string[]
  correct: number
}

const QUESTION: Q = {
  prompt: 'Choose the correct sentence',
  options: [
    'If I would have known, I would have come.',
    'If I had known, I would have come.',
    'If I knew, I would have come.',
    'If I have known, I would come.'
  ],
  correct: 1
}

const OPTION_TONE = [
  { bg: 'bg-rose-500 hover:bg-rose-400', shape: '◆' },
  { bg: 'bg-emerald-500 hover:bg-emerald-400', shape: '●' },
  { bg: 'bg-amber-500 hover:bg-amber-400', shape: '▲' },
  { bg: 'bg-sky-500 hover:bg-sky-400', shape: '■' }
]

export default function LiveQuizPage(): JSX.Element {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [selected, setSelected] = useState<number | null>(null)
  const navigate = useNavigate()

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_700px_at_50%_-10%,rgba(168,85,247,0.20),transparent_60%),radial-gradient(900px_700px_at_50%_110%,rgba(37,99,235,0.20),transparent_60%)]" />

      <div className="relative h-full flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1">
              <IconLive className="w-3 h-3" /> LIVE
            </span>
            <p className="text-sm font-bold text-white">Grammar Showdown · Past Tenses</p>
          </div>
          <button onClick={() => navigate('/community')} className="rounded-full w-9 h-9 bg-white/10 hover:bg-white/15 text-white flex items-center justify-center">
            <IconX className="w-4 h-4" />
          </button>
        </header>

        {phase === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Game PIN</p>
              <p className="text-5xl font-black text-white tracking-widest mt-2">482 619</p>
              <p className="text-xs text-slate-400 mt-2">Share this PIN with classmates · 10 questions · 20 sec each</p>
            </div>

            <div className="w-full max-w-2xl">
              <SectionHeading title={`${PLAYERS.length} players joined`} subtitle="Waiting for host…" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PLAYERS.map((p) => (
                  <div key={p.name} className={cn('rounded-xl border p-3 flex flex-col items-center gap-2', p.me ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.04]')}>
                    <AvatarCircle name={p.name} size="sm" />
                    <span className="text-xs font-semibold text-white truncate max-w-full">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setPhase('question')} className="btn-primary px-8 py-3 text-base font-bold">
              Start game →
            </button>
          </div>
        )}

        {phase === 'question' && (
          <div className="flex-1 flex flex-col px-6 gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Question 3 of 10</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Time</span>
                <span className="text-2xl font-black text-amber-300 tabular-nums">12</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300 font-bold"><IconBolt className="w-3.5 h-3.5" /> 1,820 pts</span>
            </div>

            <div className="rounded-card border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">{QUESTION.prompt}</p>
              <p className="text-2xl font-bold text-white mt-3">Which one is grammatically correct?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {QUESTION.options.map((opt, i) => {
                const t = OPTION_TONE[i]
                const isSel = selected === i
                const isCorrect = selected != null && i === QUESTION.correct
                const isWrong = isSel && i !== QUESTION.correct
                return (
                  <button
                    key={i}
                    onClick={() => { setSelected(i); setTimeout(() => setPhase('leaderboard'), 800) }}
                    disabled={selected != null}
                    className={cn(
                      'rounded-2xl p-5 text-left font-bold text-white shadow-lg transition flex items-center gap-3 min-h-[88px]',
                      t.bg,
                      isSel && 'ring-4 ring-white/40 scale-[0.97]',
                      isCorrect && 'ring-4 ring-emerald-300 scale-100',
                      isWrong && 'opacity-60'
                    )}
                  >
                    <span className="text-3xl">{t.shape}</span>
                    <span className="text-sm">{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {phase === 'leaderboard' && (
          <div className="flex-1 flex flex-col items-center px-6 gap-5">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold">Correct!</p>
              <p className="text-3xl font-black text-white mt-1">+ 480 pts</p>
              <p className="text-xs text-slate-400">Answered in 8.2s · faster than 72%</p>
            </div>

            <div className="w-full max-w-2xl rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
              {RESULTS.map((r, i) => (
                <div key={r.name} className={cn('flex items-center gap-3 px-4 py-3', r.me && 'bg-brand-500/10')}>
                  <span className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                    i === 0 ? 'bg-amber-500/30 text-amber-200' : i === 1 ? 'bg-slate-300/20 text-slate-200' : i === 2 ? 'bg-orange-500/30 text-orange-200' : 'bg-white/5 text-slate-300'
                  )}>{i + 1}</span>
                  <AvatarCircle name={r.name} size="sm" />
                  <span className="flex-1 text-sm font-semibold text-white">{r.name} {r.me && <span className="text-[10px] text-brand-300 ml-1">YOU</span>}</span>
                  {r.change && (
                    <span className={cn('text-[11px] font-bold', r.change.startsWith('+') ? 'text-emerald-300' : 'text-rose-300')}>{r.change}</span>
                  )}
                  <span className="text-sm font-bold text-brand-200 tabular-nums">{r.score.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <button onClick={() => { setSelected(null); setPhase('question') }} className="btn-primary px-6 py-2.5 text-sm">Next question →</button>
          </div>
        )}

        {/* Bottom strip */}
        <footer className="px-6 py-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><IconUsers className="w-3.5 h-3.5" /> {PLAYERS.length} players</span>
          <span className="inline-flex items-center gap-1.5"><IconStar className="w-3.5 h-3.5 text-amber-300" /> 50 XP on win</span>
        </footer>
      </div>
    </div>
  )
}
