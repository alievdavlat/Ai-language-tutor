import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader } from '../../components/ui'
import { IconPlay, IconHeart, IconBookmark, IconCheck, IconTrophy, IconX } from '../../components/icons'
import {
  GAME_MODES,
  DIFFICULTIES,
  KIND_LABEL,
  countBlankableWords,
  clipThumb,
  type GameMode,
  type Difficulty,
  type DifficultyDef
} from './data'
import { findClip, playlists, useFavorites } from '../../services/clips/store'
import { getLeaderboard } from './leaderboard'

const TONE_RING: Record<string, string> = {
  emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  orange: 'border-orange-400/40 bg-orange-500/10 text-orange-200',
  rose: 'border-rose-400/40 bg-rose-500/10 text-rose-200'
}

function diffWords(def: DifficultyDef, total: number): number {
  return Math.max(1, Math.round(total * def.fraction))
}

/** Rough word count for clips whose lyrics load at play time (LRCLIB). */
function estimateWords(duration: string): number {
  const [m = '3', s = '0'] = duration.split(':')
  const secs = parseInt(m, 10) * 60 + parseInt(s, 10)
  return Math.max(40, Math.round(secs * 1.8))
}

export default function ClipSetupPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clip = findClip(params.get('id'))
  const favs = useFavorites()
  const [savedTick, setSavedTick] = useState(0)
  const [showBoard, setShowBoard] = useState(false)

  const [mode, setMode] = useState<GameMode>('choice')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')

  // Real fillable-word count from the authored lyrics; estimated from the
  // clip length when lyrics are fetched at play time.
  const authored = countBlankableWords(clip.lines)
  const totalWords = authored > 0 ? authored : estimateWords(clip.duration)
  const wordsLabel = authored > 0 ? `${totalWords}` : `~${totalWords}`

  const inSaved = useMemo(() => {
    const p = playlists.list().find((x) => x.id === 'saved')
    return p ? p.clipIds.includes(clip.id) : false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.id, savedTick])

  const toggleSaved = (): void => {
    const p = playlists.ensureSaved()
    const next = p.clipIds.includes(clip.id)
      ? p.clipIds.filter((id) => id !== clip.id)
      : [...p.clipIds, clip.id]
    playlists.upsert({ ...p, clipIds: next })
    setSavedTick((t) => t + 1)
  }

  const board = useMemo(() => getLeaderboard(clip.id), [clip.id, showBoard])

  const start = (): void =>
    navigate(`/clips/play?id=${clip.id}&mode=${mode}&difficulty=${difficulty}`)

  const showDifficulty = mode === 'choice' || mode === 'type'

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <div className={cn('relative overflow-hidden bg-gradient-to-br', clip.cover)}>
        {clipThumb(clip) && (
          <img src={clipThumb(clip) as string} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative px-6 pt-6 pb-8 w-full">
          <PageHeader
            title={<span className="text-white">{clip.title}</span>}
            subtitle={<span className="text-white/80">{clip.artist}</span>}
            back="/clips"
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => favs.toggle(clip.id)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition',
                    favs.has(clip.id) ? 'bg-rose-500/80 text-white ring-2 ring-rose-300/60' : 'bg-white/15 hover:bg-white/25 text-white'
                  )}
                  title={favs.has(clip.id) ? 'Unfavorite' : 'Favorite'}
                >
                  <IconHeart className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleSaved}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition',
                    inSaved ? 'bg-emerald-500/80 text-white ring-2 ring-emerald-300/60' : 'bg-white/15 hover:bg-white/25 text-white'
                  )}
                  title={inSaved ? 'Remove from Saved clips' : 'Save to playlist'}
                >
                  {inSaved ? <IconCheck className="w-4 h-4" /> : <IconBookmark className="w-4 h-4" />}
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
            {/* Real local play count (seed `plays` vanity strings were fake — #A86). */}
            <span>{clip.playCount ? `${clip.playCount} ${clip.playCount === 1 ? 'play' : 'plays'}` : 'New'}</span>
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
                    <p className="text-xs opacity-80">Fill {diffWords(d, totalWords)} of {wordsLabel} words</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Start */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowBoard(true)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
          >
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

      {/* Per-clip leaderboard — real saved runs */}
      {showBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={() => setShowBoard(false)}>
          <div
            className="w-full max-w-md rounded-card border border-white/10 bg-[#0f1424] p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white inline-flex items-center gap-2">
                <IconTrophy className="w-4 h-4 text-amber-300" /> Leaderboard · {clip.title}
              </h3>
              <button onClick={() => setShowBoard(false)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 flex items-center justify-center">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            {board.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No runs yet — play this clip to set the first score.</p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {board.map((r, i) => (
                  <div key={`${r.name}-${r.at}`} className="flex items-center gap-3 py-2.5">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                      i === 0 ? 'bg-amber-500/20 text-amber-300' : i === 1 ? 'bg-slate-300/15 text-slate-200' : i === 2 ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-slate-400')}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                      <p className="text-[11px] text-slate-500">{r.mode} · {r.difficulty} · {r.accuracy}% accuracy</p>
                    </div>
                    <span className="text-sm font-bold text-brand-200 tabular-nums">{r.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
