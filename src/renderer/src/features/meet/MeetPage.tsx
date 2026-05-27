import { useEffect, useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Spinner } from '../../components/ui'
import { IconArrowRight, IconMic, IconUsers, IconX } from '../../components/icons'

type Phase = 'lobby' | 'matching' | 'call'

const LEVELS = ['Any', 'A2', 'B1', 'B2', 'C1']
const TOPICS = ['Free talk', 'Travel', 'Work', 'Movies', 'Daily life']

export default function MeetPage(): JSX.Element {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [level, setLevel] = useState('Any')
  const [topic, setTopic] = useState('Free talk')
  const [mode, setMode] = useState<'solo' | 'group'>('solo')

  useEffect(() => {
    if (phase !== 'matching') return
    const t = setTimeout(() => setPhase('call'), 1800)
    return () => clearTimeout(t)
  }, [phase])

  // ── Lobby ────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-6 max-w-xl mx-auto w-full flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Speaking partner</h1>
            <p className="text-sm text-slate-400 mt-1">Get matched with a real learner for a 1-on-1 video chat.</p>
            <p className="inline-flex items-center gap-1.5 text-xs text-emerald-300 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 1,820 learners online now
            </p>
          </div>

          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Mode</p>
              <div className="inline-flex rounded-pill bg-white/[0.04] border border-white/10 p-1">
                {(['solo', 'group'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn('px-4 py-1.5 rounded-pill text-sm font-medium transition', m === mode ? 'bg-grad-brand text-white' : 'text-slate-400 hover:text-slate-200')}>
                    {m === 'solo' ? '1-on-1' : 'Group'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Partner level</p>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setLevel(l)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition', l === level ? 'bg-grad-brand text-white' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10')}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Topic</p>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} onClick={() => setTopic(t)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition', t === topic ? 'bg-grad-brand text-white' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10')}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => setPhase('matching')} className="btn-primary py-3.5 text-base inline-flex items-center justify-center gap-2">
            <IconUsers className="w-5 h-5" /> Start matching
          </button>
          <p className="text-xs text-slate-500 text-center">Be respectful · English only · you can skip or report anytime.</p>
        </div>
      </div>
    )
  }

  // ── Matching ─────────────────────────────────────────────────────────────
  if (phase === 'matching') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5">
        <Spinner size="lg" />
        <p className="text-slate-300 font-medium">Finding a partner…</p>
        <p className="text-xs text-slate-500">{level} · {topic}</p>
        <button onClick={() => setPhase('lobby')} className="text-xs text-slate-500 hover:text-slate-300 mt-2">Cancel</button>
      </div>
    )
  }

  // ── Call ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-4">
        {mode === 'group' ? (
          <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
            {[
              { name: 'Lucas · B1', tone: 'from-emerald-700 to-teal-900' },
              { name: 'Aiko · B2', tone: 'from-rose-700 to-pink-900' },
              { name: 'Omar · B1', tone: 'from-amber-600 to-orange-900' },
              { name: 'You', tone: 'from-brand-600 to-indigo-800' }
            ].map((p) => (
              <div key={p.name} className={cn('relative rounded-2xl aspect-video flex items-center justify-center ring-1 ring-white/10 bg-gradient-to-br', p.tone)}>
                <AvatarCircle name={p.name} size="md" />
                <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 rounded px-2 py-0.5">{p.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <AvatarCircle name="Lucas B" size="lg" className="!w-24 !h-24 !text-3xl mx-auto" />
            <p className="text-white font-semibold mt-3">Lucas · B1</p>
            <p className="text-slate-400 text-sm">🇧🇷 Brazil · learning English</p>
          </div>
        )}

        {/* topic card */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 backdrop-blur px-4 py-2 text-sm text-white">
          Talk about: <b>{topic}</b>
        </div>

        {mode === 'solo' && (
          <div className="absolute bottom-4 right-4 w-32 h-44 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-800 ring-2 ring-white/20 flex items-center justify-center">
            <span className="text-xs text-white/80">You</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-canvas-soft/80">
        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition" title="Mute">
          <IconMic className="w-5 h-5" />
        </button>
        <button onClick={() => setPhase('matching')} className="px-5 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold inline-flex items-center gap-2 transition" title="Next partner">
          Next <IconArrowRight className="w-4 h-4" />
        </button>
        <button onClick={() => setPhase('lobby')} className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition" title="End">
          <IconX className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
