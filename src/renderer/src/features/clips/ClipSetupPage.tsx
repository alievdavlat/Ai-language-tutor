import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader } from '../../components/ui'
import { IconPlay, IconHeart, IconBookmark, IconTrophy } from '../../components/icons'
import {
  findClip,
  GAME_MODES,
  DIFFICULTIES,
  KIND_LABEL,
  type GameMode,
  type Difficulty,
  type DifficultyDef
} from './data'

const TONE_RING: Record<string, string> = {
  emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  orange: 'border-orange-400/40 bg-orange-500/10 text-orange-200',
  rose: 'border-rose-400/40 bg-rose-500/10 text-rose-200'
}

function diffWords(def: DifficultyDef, total = 378): number {
  return Math.max(1, Math.round(total * def.fraction))
}

export default function ClipSetupPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clip = findClip(params.get('id'))

  const [mode, setMode] = useState<GameMode>('choice')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')

  const start = (): void =>
    navigate(`/clips/play?id=${clip.id}&mode=${mode}&difficulty=${difficulty}`)

  const showDifficulty = mode === 'choice' || mode === 'type'

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <div className={cn('relative overflow-hidden bg-gradient-to-br', clip.cover)}>
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative px-6 pt-6 pb-8 w-full">
          <PageHeader
            title={<span className="text-white">{clip.title}</span>}
            subtitle={<span className="text-white/80">{clip.artist}</span>}
            back="/clips"
            action={
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition" title="Favorite">
                  <IconHeart className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition" title="Save to playlist">
                  <IconBookmark className="w-4 h-4" />
                </button>
              </div>
            }
          />
          <div className="mt-4 flex items-center gap-3 text-white/85 text-sm">
            <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
              {KIND_LABEL[clip.kind]}
            </span>
            <span>{clip.accent} {clip.level}</span>
            <span>·</span>
            <span>{clip.plays} plays</span>
            <span>·</span>
            <span>{clip.duration}</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-7 w-full max-w-3xl mx-auto flex flex-col gap-8">
        {/* Game mode */}
        <section>
          <h2 className="text-center text-xs uppercase tracking-[0.2em] text-brand-300 font-bold mb-4">Game mode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GAME_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'text-left rounded-2xl border p-4 transition',
                  mode === m.id
                    ? 'border-brand-400/50 bg-brand-500/12 ring-1 ring-brand-400/30'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                )}
              >
                <p className={cn('font-bold', mode === m.id ? 'text-brand-100' : 'text-white')}>{m.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        {showDifficulty && (
          <section>
            <h2 className="text-center text-xs uppercase tracking-[0.2em] text-brand-300 font-bold mb-4">Difficulty</h2>
            <div className="flex flex-col gap-2.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border px-4 py-3 transition',
                    difficulty === d.id ? TONE_RING[d.tone] + ' ring-1' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300'
                  )}
                >
                  <span className="text-2xl">{d.emoji}</span>
                  <div className="flex-1 text-left">
                    <p className="font-bold uppercase tracking-wide text-sm">{d.label}</p>
                    <p className="text-xs opacity-80">Fill {diffWords(d)} words of 378</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Start */}
        <div className="flex items-center justify-between gap-3">
          <button className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition">
            <IconTrophy className="w-4 h-4" /> Leaderboard
          </button>
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-pill bg-grad-brand text-white font-bold px-7 py-3 shadow-glow hover:brightness-110 transition"
          >
            <IconPlay className="w-5 h-5" /> Start playing
          </button>
        </div>
      </div>
    </div>
  )
}
