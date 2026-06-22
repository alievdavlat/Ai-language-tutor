import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { IconPlay, IconYouTube } from '../../components/icons'
import {
  DIFFICULTIES,
  pickBlanks,
  type GameMode,
  type Difficulty,
  type LyricLine
} from './data'
import { findClip, clips } from '../../services/clips/store'
import { fetchSyncedLyrics } from './lrclib'
import { useYouTubePlayer } from './youtube'
import { saveScore, getBestScore, type ClipScore } from './leaderboard'

const norm = (w: string): string => w.toLowerCase().replace(/[^a-z']/g, '')
const YT_ELEMENT_ID = 'clip-yt-player'

interface BlankState {
  value: string
  status: 'idle' | 'correct' | 'wrong' | 'revealed'
}

export default function ClipPlayPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clip = findClip(params.get('id'))
  const mode = (params.get('mode') as GameMode) || 'choice'
  const difficulty = (params.get('difficulty') as Difficulty) || 'beginner'
  const fraction = DIFFICULTIES.find((d) => d.id === difficulty)?.fraction ?? 0.1
  const userName = useAppStore((s) => s.profile?.name) || 'You'

  // Real synced lyrics: LRCLIB first (accurate timestamps), then any bundled
  // demo lines, while a "loading" state shows. Cancels on clip change/unmount.
  const [lines, setLines] = useState<LyricLine[]>(clip.lines ?? [])
  const [lyricsState, setLyricsState] = useState<'loading' | 'ready' | 'none'>(
    clip.lines && clip.lines.length ? 'ready' : 'loading'
  )
  useEffect(() => {
    const ac = new AbortController()
    // Only show the loading banner when there's nothing to display yet. If the
    // clip already ships authored lyrics, keep them on screen (state stays
    // 'ready') and upgrade to LRCLIB synced timings silently in the background —
    // so a slow/unreachable LRCLIB never blocks a playable clip.
    if (!clip.lines?.length) setLyricsState('loading')
    void fetchSyncedLyrics(clip.title, clip.artist, ac.signal)
      .then((fetched) => {
        if (ac.signal.aborted) return
        if (fetched && fetched.length) {
          setLines(fetched)
          setLyricsState('ready')
        } else if (clip.lines && clip.lines.length) {
          setLines(clip.lines)
          setLyricsState('ready')
        } else {
          setLines([])
          setLyricsState('none')
        }
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setLines(clip.lines ?? [])
        setLyricsState(clip.lines && clip.lines.length ? 'ready' : 'none')
      })
    return () => ac.abort()
  }, [clip.id, clip.title, clip.artist, clip.lines])

  // Per-line word arrays + blank index sets, computed once.
  const layout = useMemo(
    () =>
      lines.map((l) => {
        const words = l.text.split(' ')
        const blanks = mode === 'karaoke' ? new Set<number>() : pickBlanks(words, fraction)
        return { words, blanks }
      }),
    [lines, fraction, mode]
  )

  const totalGaps = useMemo(
    () => layout.reduce((sum, l) => sum + l.blanks.size, 0),
    [layout]
  )

  const wordPool = useMemo(() => {
    const set = new Set<string>()
    layout.forEach((l) => l.words.forEach((w) => set.add(norm(w))))
    return [...set].filter((w) => w.length > 1)
  }, [layout])

  const [blanks, setBlanks] = useState<Record<string, BlankState>>({})
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [fails, setFails] = useState(0)
  const [bonus, setBonus] = useState(1)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [shake, setShake] = useState<string | null>(null)
  /** The line index playback is currently held at, waiting for the user to
   * fill its blanks (the real per-line "sync-pause"). null = playing through. */
  const [holdLine, setHoldLine] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [board, setBoard] = useState<ClipScore[]>([])
  const savedRef = useRef(false)

  const key = (li: number, wi: number): string => `${li}-${wi}`
  const get = (li: number, wi: number): BlankState => blanks[key(li, wi)] ?? { value: '', status: 'idle' }

  // Ordered list of every blank key (line, then word order) + input refs, so a
  // correct answer can auto-advance focus to the next unfilled blank.
  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map())
  const order = useMemo(() => {
    const arr: string[] = []
    layout.forEach((l, li) => {
      ;[...l.blanks].sort((a, b) => a - b).forEach((wi) => arr.push(key(li, wi)))
    })
    return arr
  }, [layout])

  function focusKey(k: string | undefined): void {
    if (k) inputRefs.current.get(k)?.focus()
  }

  function advanceFrom(k: string): void {
    const idx = order.indexOf(k)
    for (let j = idx + 1; j < order.length; j++) {
      const nk = order[j]
      const st = blanks[nk]?.status
      if (st !== 'correct' && st !== 'revealed') {
        setActive(Number(nk.split('-')[0]))
        window.setTimeout(() => focusKey(nk), 0)
        return
      }
    }
  }

  // Record the play once per mount → feeds "Hot right now" + "your activity".
  useEffect(() => {
    if (clip.id) clips.recordPlay(clip.id, new Date().toISOString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.id])

  // ⭐ Auto-pause when the window/tab loses focus (user-requested): a tab
  // switch fires visibilitychange (document.hidden), switching to another app
  // window fires blur. Either one pauses playback.
  useEffect(() => {
    const onVisibility = (): void => {
      if (document.hidden) setPaused(true)
    }
    const onBlur = (): void => setPaused(true)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // Auto-focus the first blank on start (Type / Scribe modes).
  useEffect(() => {
    if (mode === 'choice' || mode === 'karaoke') return
    window.setTimeout(() => focusKey(order[0]), 60)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, mode])

  // ── Sync-pause: drive the real YouTube player ───────────────────────────
  // Refs hold the freshest state so the 250ms tick reads current values.
  const blanksRef = useRef(blanks)
  blanksRef.current = blanks
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const linesRef = useRef(lines)
  linesRef.current = lines
  const holdRef = useRef<number | null>(null)
  holdRef.current = holdLine
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const finishedRef = useRef(finished)
  finishedRef.current = finished

  function lineSatisfied(li: number, b = blanksRef.current): boolean {
    const l = layoutRef.current[li]
    if (!l) return true
    for (const wi of l.blanks) {
      const st = b[key(li, wi)]?.status
      if (st !== 'correct' && st !== 'revealed') return false
    }
    return true
  }

  function firstUnsatisfied(): number | null {
    for (let i = 0; i < layoutRef.current.length; i++) {
      if (layoutRef.current[i].blanks.size > 0 && !lineSatisfied(i)) return i
    }
    return null
  }

  function lineEnd(i: number): number {
    const ls = linesRef.current
    return ls[i + 1]?.t ?? (ls[i]?.t ?? 0) + 5
  }

  const handleTick = useCallback(
    (time: number): void => {
      if (pausedRef.current || finishedRef.current) return
      const ls = linesRef.current
      let ci = 0
      for (let i = 0; i < ls.length; i++) if (ls[i].t <= time + 0.15) ci = i
      if (holdRef.current === null) {
        setActive(ci)
        // Pause once the first unfilled line has just been sung.
        const g = firstUnsatisfied()
        if (g !== null && time >= lineEnd(g) - 0.1) {
          setHoldLine(g)
          setActive(g)
          if (mode !== 'choice' && mode !== 'karaoke') {
            const fk = order.find(
              (k) =>
                Number(k.split('-')[0]) === g &&
                blanksRef.current[k]?.status !== 'correct' &&
                blanksRef.current[k]?.status !== 'revealed'
            )
            window.setTimeout(() => focusKey(fk), 0)
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, order]
  )

  const player = useYouTubePlayer(YT_ELEMENT_ID, clip.youtubeId, handleTick)

  // Release the hold the instant the held line's blanks are all filled.
  useEffect(() => {
    if (holdLine !== null && lineSatisfied(holdLine)) setHoldLine(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blanks, holdLine])

  // Single source of truth for real play/pause: manual pause OR sync-hold OR done.
  useEffect(() => {
    if (!player.ready) return
    if (paused || holdLine !== null || finished) player.pause()
    else player.play()
  }, [paused, holdLine, finished, player])

  // Finished when every gap is resolved (correct or revealed).
  useEffect(() => {
    if (finished || totalGaps === 0) return
    const resolved = Object.values(blanks).filter(
      (s) => s.status === 'correct' || s.status === 'revealed'
    ).length
    if (resolved >= totalGaps) setFinished(true)
  }, [blanks, totalGaps, finished])

  // Persist the run to the per-clip leaderboard once.
  useEffect(() => {
    if (!finished || savedRef.current) return
    savedRef.current = true
    const accuracy = hits + fails > 0 ? Math.round((hits / (hits + fails)) * 100) : 100
    setBoard(saveScore(clip.id, { name: userName, score, hits, fails, accuracy, mode, difficulty }))
    setPaused(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  const remaining = totalGaps - hits - fails
  const best = useMemo(() => getBestScore(clip.id), [clip.id, finished])

  function judge(li: number, wi: number, value: string): void {
    const answer = layout[li].words[wi]
    const ok = norm(value) === norm(answer)
    setBlanks((b) => ({ ...b, [key(li, wi)]: { value, status: ok ? 'correct' : 'wrong' } }))
    if (ok) {
      setHits((h) => h + 1)
      setScore((s) => s + 10 * bonus)
      setBonus((x) => Math.min(8, x + 1))
      advanceFrom(key(li, wi))
    } else {
      setFails((f) => f + 1)
      setBonus(1)
      setShake(key(li, wi))
      window.setTimeout(() => setShake(null), 400)
    }
  }

  function giveUp(): void {
    setBlanks((prev) => {
      const next = { ...prev }
      layout.forEach((l, li) =>
        l.blanks.forEach((wi) => {
          const k = key(li, wi)
          if (next[k]?.status !== 'correct') {
            next[k] = { value: l.words[wi], status: 'revealed' }
          }
        })
      )
      return next
    })
    setPaused(false)
  }

  function restart(): void {
    setBlanks({})
    setScore(0)
    setHits(0)
    setFails(0)
    setBonus(1)
    setActive(0)
    setPaused(false)
    setHoldLine(null)
    setFinished(false)
    savedRef.current = false
    if (player.ready) {
      player.seekTo(0)
      player.play()
    }
    if (mode !== 'choice' && mode !== 'karaoke') window.setTimeout(() => focusKey(order[0]), 60)
  }

  // Options for the active line's first unfilled blank (Choice mode).
  const choiceTarget = useMemo(() => {
    if (mode !== 'choice') return null
    const l = layout[active]
    if (!l) return null
    const wi = [...l.blanks].find((i) => get(active, i).status === 'idle')
    if (wi === undefined) return null
    const answer = norm(l.words[wi])
    const distractors = wordPool.filter((w) => w !== answer).sort(() => Math.random() - 0.5).slice(0, 3)
    const options = [...distractors, answer].sort(() => Math.random() - 0.5)
    return { wi, options }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, active, blanks, layout, wordPool])

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas flex flex-col text-white">
      {/* HUD */}
      <div className="shrink-0 px-5 py-3 flex items-center gap-5 border-b border-white/10 bg-canvas-soft/70 backdrop-blur">
        <button
          onClick={() => setPaused((p) => !p)}
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
          title="Pause"
        >
          {paused ? <IconPlay className="w-4 h-4 ml-0.5" /> : <span className="text-sm font-bold">II</span>}
        </button>
        <div className="flex flex-col leading-none">
          <div className="font-mono text-2xl font-extrabold tabular-nums tracking-tight">
            {String(score).padStart(5, '0')}
          </div>
          {best > 0 && <span className="text-[10px] text-slate-500">best {String(best).padStart(5, '0')}</span>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Gaps</span>
          <span className="font-bold">{remaining}</span>
          <span className="inline-flex items-center gap-1 text-emerald-300"><Dot c="#34d399" />{hits}</span>
          <span className="inline-flex items-center gap-1 text-rose-300"><Dot c="#fb7185" />{fails}</span>
        </div>
        {/* progress */}
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-grad-brand transition-all" style={{ width: `${totalGaps ? ((hits + fails) / totalGaps) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-400">Bonus</span>
          <span className="w-8 h-8 rounded-full bg-brand-500/20 ring-1 ring-brand-400/40 flex items-center justify-center font-extrabold text-brand-200">×{bonus}</span>
        </div>
        <button onClick={() => navigate('/clips')} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg" title="Quit">✕</button>
      </div>

      {/* Video */}
      <div className="shrink-0 flex justify-center bg-black/40 py-3">
        <div className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden ring-1 ring-white/10">
          {clip.youtubeId ? (
            <div id={YT_ELEMENT_ID} className="w-full h-full" />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', clip.cover)}>
              <span className="w-16 h-16 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center">
                <IconPlay className="w-7 h-7 ml-1" />
              </span>
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-red-600/90 text-[10px] font-bold px-2 py-1">
                <IconYouTube className="w-3 h-3" /> YouTube
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lyrics */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-3 text-center">
          {lyricsState === 'loading' && (
            <p className="text-slate-400 text-sm animate-pulse">Loading synced lyrics from LRCLIB…</p>
          )}
          {lyricsState === 'none' && (
            <p className="text-slate-400 text-sm">
              No synced lyrics found for this clip. Songs work best; movies/talks need a transcript source.
            </p>
          )}
          {holdLine !== null && clip.youtubeId && (
            <p className="text-brand-200 text-xs font-semibold uppercase tracking-widest">
              ⏸ Paused — fill the blank to continue
            </p>
          )}
          {layout.map((l, li) => (
            <p
              key={li}
              onClick={() => setActive(li)}
              className={cn(
                'text-xl md:text-2xl leading-relaxed cursor-pointer transition flex flex-wrap justify-center gap-x-2 gap-y-1',
                li === active ? 'text-white font-semibold' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {l.words.map((w, wi) => {
                if (!l.blanks.has(wi)) return <span key={wi}>{w}</span>
                const st = get(li, wi)
                if (mode === 'karaoke') return <span key={wi}>{w}</span>
                return (
                  <span key={wi} className="inline-flex items-center">
                    <input
                      ref={(el) => {
                        inputRefs.current.set(key(li, wi), el)
                      }}
                      value={st.value}
                      disabled={st.status === 'correct' || st.status === 'revealed'}
                      onChange={(e) => {
                        const v = e.target.value
                        // Auto-judge as soon as the word is correct → advance.
                        if (norm(v) === norm(w)) judge(li, wi, v)
                        else setBlanks((b) => ({ ...b, [key(li, wi)]: { value: v, status: 'idle' } }))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') judge(li, wi, (e.target as HTMLInputElement).value)
                      }}
                      placeholder={'_'.repeat(Math.max(3, norm(w).length))}
                      readOnly={mode === 'choice'}
                      style={{ width: `${Math.max(4, norm(w).length + 1)}ch` }}
                      className={cn(
                        'mx-0.5 px-1 py-0.5 text-center rounded-md border bg-white/[0.06] outline-none transition',
                        st.status === 'correct' && 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200',
                        st.status === 'wrong' && 'border-rose-400/60 bg-rose-500/15 text-rose-200',
                        st.status === 'revealed' && 'border-amber-400/50 bg-amber-500/15 text-amber-200',
                        st.status === 'idle' && 'border-white/15 focus:border-brand-400/60',
                        shake === key(li, wi) && 'animate-[shake_0.4s]'
                      )}
                    />
                    {(st.status === 'correct' || st.status === 'revealed') && <Dot c={st.status === 'correct' ? '#34d399' : '#fbbf24'} />}
                  </span>
                )
              })}
            </p>
          ))}
        </div>
      </div>

      {/* Choice options */}
      {mode === 'choice' && choiceTarget && !paused && (
        <div className="shrink-0 px-6 py-4 border-t border-white/10 bg-canvas-soft/60">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2.5">
            {choiceTarget.options.map((opt) => (
              <button
                key={opt}
                onClick={() => judge(active, choiceTarget.wi, opt)}
                className="rounded-xl border border-white/12 bg-white/[0.05] hover:bg-brand-500/15 hover:border-brand-400/40 py-3 font-semibold capitalize transition"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="shrink-0 px-6 py-3 flex items-center justify-between border-t border-white/10">
        <button onClick={() => setActive((a) => Math.max(0, a - 1))} className="text-sm text-slate-400 hover:text-white transition">‹ Prev</button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="rounded-md bg-white/[0.06] px-2 py-1">⏎ skip word</span>
          <span className="rounded-md bg-white/[0.06] px-2 py-1">⌫ repeat line</span>
        </div>
        <button onClick={() => setActive((a) => Math.min(lines.length - 1, a + 1))} className="text-sm text-slate-400 hover:text-white transition">Next ›</button>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-72 flex flex-col gap-2 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Paused</p>
            <button onClick={() => setPaused(false)} className="rounded-xl bg-grad-brand font-bold py-3 shadow-glow hover:brightness-110 transition">Resume</button>
            <button onClick={restart} className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] font-semibold py-3 transition">Restart</button>
            <button onClick={giveUp} className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] font-semibold py-3 transition">Give up (reveal answers)</button>
            <button onClick={() => navigate('/clips')} className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] font-semibold py-3 transition">Quit</button>
          </div>
        </div>
      )}

      {/* Completion + leaderboard */}
      {finished && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-canvas-soft p-6 flex flex-col gap-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-300 font-bold">Clip complete</p>
              <p className="font-mono text-5xl font-extrabold tabular-nums mt-2">{String(score).padStart(5, '0')}</p>
              <p className="text-sm text-slate-400 mt-1">
                {hits} correct · {fails} missed ·{' '}
                {hits + fails > 0 ? Math.round((hits / (hits + fails)) * 100) : 100}% accuracy
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Top scores · {clip.title}</p>
              <ol className="flex flex-col gap-1">
                {board.slice(0, 5).map((row, i) => (
                  <li key={row.at} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-slate-500 tabular-nums">{i + 1}.</span>
                      <span className={cn(row.score === score && row.at >= Date.now() - 5000 ? 'text-brand-200 font-bold' : 'text-slate-300')}>
                        {row.name}
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-200">{String(row.score).padStart(5, '0')}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={restart} className="flex-1 rounded-xl bg-grad-brand font-bold py-3 shadow-glow hover:brightness-110 transition">Play again</button>
              <button onClick={() => navigate('/clips')} className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] font-semibold py-3 px-5 transition">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Dot({ c }: { c: string }): JSX.Element {
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: c }} />
}
