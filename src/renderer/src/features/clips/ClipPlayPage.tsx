import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { IconPlay, IconYouTube } from '../../components/icons'
import {
  findClip,
  DIFFICULTIES,
  pickBlanks,
  type GameMode,
  type Difficulty,
  type LyricLine
} from './data'

const norm = (w: string): string => w.toLowerCase().replace(/[^a-z']/g, '')

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

  const lines: LyricLine[] = clip.lines ?? []

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
  /** bumped on restart to remount the video iframe → replays from the start */
  const [videoNonce, setVideoNonce] = useState(0)

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

  const remaining = totalGaps - hits - fails

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
    setVideoNonce((n) => n + 1)
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
        <div className="font-mono text-2xl font-extrabold tabular-nums tracking-tight">
          {String(score).padStart(5, '0')}
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
            <iframe
              key={videoNonce}
              title={clip.title}
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${clip.youtubeId}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
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
          {lines.length === 0 && (
            <p className="text-slate-400 text-sm">Synced lyrics for this clip aren’t loaded in the demo yet.</p>
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
    </div>
  )
}

function Dot({ c }: { c: string }): JSX.Element {
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: c }} />
}
