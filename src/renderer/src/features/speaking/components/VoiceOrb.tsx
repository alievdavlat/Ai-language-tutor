import { cn } from '../../../lib/classnames'

export type CallState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted'

interface VoiceOrbProps {
  state: CallState
  /** 0..1 — drives the reactive pulse. Tie to useAudioLevel or TTS viseme. */
  intensity: number
  label?: string
  sublabel?: string
}

const STATE_THEME: Record<
  CallState,
  { halo: string; core: string; glow: string; ring: string; text: string }
> = {
  idle: {
    halo: 'from-slate-400/25 to-slate-600/10',
    core: 'from-slate-300 to-slate-500',
    glow: 'shadow-[0_0_80px_30px_rgba(148,163,184,0.15)]',
    ring: 'ring-slate-400/20',
    text: 'text-slate-300'
  },
  listening: {
    halo: 'from-emerald-300/40 to-emerald-600/15',
    core: 'from-emerald-200 to-emerald-500',
    glow: 'shadow-[0_0_100px_40px_rgba(16,185,129,0.35)]',
    ring: 'ring-emerald-300/40',
    text: 'text-emerald-200'
  },
  thinking: {
    halo: 'from-amber-300/40 to-orange-500/15',
    core: 'from-amber-200 to-orange-500',
    glow: 'shadow-[0_0_100px_40px_rgba(251,191,36,0.35)]',
    ring: 'ring-amber-300/40',
    text: 'text-amber-200'
  },
  speaking: {
    halo: 'from-violet-300/45 to-fuchsia-600/15',
    core: 'from-violet-200 via-fuchsia-300 to-brand-400',
    glow: 'shadow-[0_0_110px_45px_rgba(139,92,246,0.45)]',
    ring: 'ring-violet-300/50',
    text: 'text-violet-100'
  },
  muted: {
    halo: 'from-rose-400/30 to-red-600/10',
    core: 'from-rose-300 to-red-500',
    glow: 'shadow-[0_0_80px_30px_rgba(244,63,94,0.25)]',
    ring: 'ring-rose-300/40',
    text: 'text-rose-200'
  }
}

/**
 * Big centred orb that reacts to audio/state. The outer halo breathes, the
 * middle ring scales with `intensity` (for mic-driven "listening" pulses or
 * TTS-driven "speaking" pulses), and the inner core is a soft radial gradient.
 */
export default function VoiceOrb({
  state,
  intensity,
  label,
  sublabel
}: VoiceOrbProps): JSX.Element {
  const theme = STATE_THEME[state]
  const reactive = Math.max(0, Math.min(1, intensity))
  // Scale between 1.0 and 1.22 — subtle but clearly alive.
  const scale = 1 + reactive * 0.22

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer halo — always breathing */}
      <div
        aria-hidden
        className={cn(
          'absolute w-[360px] h-[360px] rounded-full blur-3xl bg-gradient-to-br animate-[pulse_3.2s_ease-in-out_infinite]',
          theme.halo
        )}
      />

      {/* Intensity-reactive ring */}
      <div
        aria-hidden
        style={{ transform: `scale(${scale})` }}
        className={cn(
          'absolute w-[280px] h-[280px] rounded-full ring-2 transition-transform duration-150',
          theme.ring
        )}
      />

      {/* Secondary softer ring — lagging behind for depth */}
      <div
        aria-hidden
        style={{ transform: `scale(${1 + reactive * 0.12})` }}
        className={cn(
          'absolute w-[220px] h-[220px] rounded-full ring-1 transition-transform duration-300',
          theme.ring
        )}
      />

      {/* Core orb */}
      <div
        style={{ transform: `scale(${1 + reactive * 0.08})` }}
        className={cn(
          'relative w-[180px] h-[180px] rounded-full bg-gradient-to-br transition-transform duration-150',
          theme.core,
          theme.glow
        )}
      >
        {/* Glossy highlight */}
        <div
          aria-hidden
          className="absolute top-6 left-6 w-20 h-20 rounded-full bg-white/35 blur-xl"
        />
        {/* Subtle dark bottom to fake depth */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-t from-black/25 to-transparent"
        />
      </div>

      {/* Labels under the orb */}
      {(label || sublabel) && (
        <div className="absolute -bottom-24 text-center">
          {label && (
            <div className={cn('text-2xl font-bold tracking-tight', theme.text)}>{label}</div>
          )}
          {sublabel && <div className="text-sm text-slate-400 mt-1">{sublabel}</div>}
        </div>
      )}
    </div>
  )
}
