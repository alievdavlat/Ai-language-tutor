import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AIGate } from '../../components/ui'
import { IconChat, IconMic, IconUsers, IconVolume, IconX } from '../../components/icons'

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Tap mic to speak',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Speaking'
}

const SCRIPT: { from: 'me' | 'tutor'; text: string }[] = [
  { from: 'tutor', text: "Hey Aziz! I'm Lily. What would you like to talk about today?" },
  { from: 'me', text: "I want to practice ordering food at a restaurant." },
  { from: 'tutor', text: "Great choice! Imagine I'm the waiter. Welcome to Bistro Lily, what can I get you?" }
]

export default function AITutorPage(): JSX.Element {
  const [phase, setPhase] = useState<Phase>('speaking')
  const [callSeconds, setCallSeconds] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setCallSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Demo: cycle phases every 4s so the UI feels alive
  useEffect(() => {
    const phases: Phase[] = ['speaking', 'idle', 'listening', 'thinking', 'speaking']
    let i = 0
    const t = setInterval(() => {
      i = (i + 1) % phases.length
      setPhase(phases[i])
    }, 3500)
    return () => clearInterval(t)
  }, [])

  const mm = String(Math.floor(callSeconds / 60)).padStart(2, '0')
  const ss = String(callSeconds % 60).padStart(2, '0')

  return (
    <AIGate featureName="AI tutor video call" description="The AI tutor needs a cloud model to listen, think, and reply in real time." fullscreen>
    <div className="h-full w-full relative overflow-hidden bg-slate-950">
      {/* Emotion gradient backdrop */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-700',
          phase === 'speaking' && 'bg-[radial-gradient(900px_700px_at_50%_30%,rgba(37,99,235,0.35),transparent_60%)]',
          phase === 'listening' && 'bg-[radial-gradient(900px_700px_at_50%_30%,rgba(168,85,247,0.30),transparent_60%)]',
          phase === 'thinking' && 'bg-[radial-gradient(900px_700px_at_50%_30%,rgba(56,189,248,0.25),transparent_60%)]',
          phase === 'idle' && 'bg-[radial-gradient(900px_700px_at_50%_30%,rgba(100,116,139,0.20),transparent_60%)]'
        )}
      />

      <div className="relative h-full flex flex-col">
        {/* Top bar */}
        <header className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-lg">
              🦋
            </div>
            <div>
              <p className="text-sm font-bold text-white">Lily · AI tutor</p>
              <p className="text-[11px] text-slate-400">{mm}:{ss} · Restaurant roleplay</p>
            </div>
          </div>
          <button onClick={() => navigate('/speaking')} className="rounded-full w-9 h-9 bg-white/10 hover:bg-white/15 text-white flex items-center justify-center" title="End">
            <IconX className="w-4 h-4" />
          </button>
        </header>

        {/* Avatar / orb */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="relative">
            {/* Rings */}
            {(phase === 'listening' || phase === 'speaking') && (
              <>
                <span className={cn('absolute inset-0 m-auto w-56 h-56 rounded-full animate-ping opacity-30', phase === 'speaking' ? 'bg-brand-400' : 'bg-violet-400')} />
                <span className={cn('absolute inset-0 m-auto w-48 h-48 rounded-full animate-ping opacity-40', phase === 'speaking' ? 'bg-brand-300' : 'bg-violet-300')} style={{ animationDelay: '0.3s' }} />
              </>
            )}
            {/* Core */}
            <div className={cn(
              'relative w-44 h-44 rounded-full flex items-center justify-center text-6xl shadow-2xl ring-4 transition-all',
              phase === 'speaking' && 'ring-brand-400/40 bg-gradient-to-br from-brand-400 to-violet-500',
              phase === 'listening' && 'ring-violet-400/40 bg-gradient-to-br from-violet-500 to-pink-500',
              phase === 'thinking' && 'ring-sky-400/40 bg-gradient-to-br from-sky-500 to-brand-500',
              phase === 'idle' && 'ring-white/15 bg-gradient-to-br from-slate-700 to-slate-900'
            )}>
              🦋
            </div>
          </div>

          <p className="text-sm font-bold text-slate-200 uppercase tracking-widest">{PHASE_LABEL[phase]}</p>

          {/* Live transcript */}
          <div className="w-full max-w-md flex flex-col gap-2">
            {SCRIPT.slice(-2).map((m, i) => (
              <div key={i} className={cn('rounded-2xl px-4 py-2.5 text-sm', m.from === 'me' ? 'bg-white/[0.08] text-slate-200 self-end' : 'bg-brand-500/15 text-brand-100 self-start ring-1 ring-brand-400/20')}>
                {m.text}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <footer className="px-6 pb-8 flex items-center justify-center gap-5">
          <button title="Mute" className="w-14 h-14 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white flex items-center justify-center">
            <IconVolume className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPhase((p) => p === 'listening' ? 'thinking' : 'listening')}
            title="Talk"
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition',
              phase === 'listening' ? 'bg-rose-500 ring-4 ring-rose-400/40' : 'bg-grad-brand ring-4 ring-brand-400/30 hover:brightness-110'
            )}
          >
            <IconMic className="w-7 h-7" />
          </button>
          <button title="Subtitles" className="w-14 h-14 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white flex items-center justify-center">
            <IconChat className="w-5 h-5" />
          </button>
        </footer>

        {/* Side controls */}
        <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-2">
          {[
            { label: 'Switch scenario', Icon: IconUsers },
            { label: 'Send a hint', Icon: IconChat }
          ].map((c) => (
            <button key={c.label} title={c.label} className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.10] backdrop-blur text-slate-200 flex items-center justify-center border border-white/10">
              <c.Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
    </AIGate>
  )
}
