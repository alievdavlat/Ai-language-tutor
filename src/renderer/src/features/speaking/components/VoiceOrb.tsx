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
  { halo: string; core: string; glow: string; ring: string; text: string; ripple: string }
> = {
  idle: {
    halo: 'from-slate-400/20 to-slate-600/10',
    core: 'from-slate-300 to-slate-500',
    glow: 'shadow-[0_0_80px_30px_rgba(148,163,184,0.12)]',
    ring: 'ring-slate-400/20',
    text: 'text-slate-300',
    ripple: 'rgba(148,163,184,0.15)'
  },
  listening: {
    halo: 'from-emerald-300/35 to-emerald-600/12',
    core: 'from-emerald-200 to-emerald-500',
    glow: 'shadow-[0_0_100px_40px_rgba(16,185,129,0.35)]',
    ring: 'ring-emerald-300/40',
    text: 'text-emerald-200',
    ripple: 'rgba(16,185,129,0.2)'
  },
  thinking: {
    halo: 'from-amber-300/35 to-orange-500/12',
    core: 'from-amber-200 to-orange-500',
    glow: 'shadow-[0_0_100px_40px_rgba(251,191,36,0.35)]',
    ring: 'ring-amber-300/40',
    text: 'text-amber-200',
    ripple: 'rgba(251,191,36,0.15)'
  },
  speaking: {
    halo: 'from-violet-300/40 to-fuchsia-600/12',
    core: 'from-violet-200 via-fuchsia-300 to-brand-400',
    glow: 'shadow-[0_0_110px_45px_rgba(139,92,246,0.45)]',
    ring: 'ring-violet-300/50',
    text: 'text-violet-100',
    ripple: 'rgba(139,92,246,0.18)'
  },
  muted: {
    halo: 'from-rose-400/25 to-red-600/10',
    core: 'from-rose-300 to-red-500',
    glow: 'shadow-[0_0_80px_30px_rgba(244,63,94,0.22)]',
    ring: 'ring-rose-300/40',
    text: 'text-rose-200',
    ripple: 'rgba(244,63,94,0.15)'
  }
}

/**
 * Big centred orb that reacts to audio/state.
 * When listening or speaking, expanding ripple rings pulse outward.
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
  const isActive = state === 'listening' || state === 'speaking'

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer halo — always breathing */}
      <div
        aria-hidden
        className={cn(
          'absolute w-[380px] h-[380px] rounded-full blur-3xl bg-gradient-to-br animate-[pulse_3.2s_ease-in-out_infinite]',
          theme.halo
        )}
      />

      {/* Expanding ripple rings — visible when listening or speaking */}
      {isActive && (
        <>
          <div
            aria-hidden
            className="absolute w-[190px] h-[190px] rounded-full animate-ping"
            style={{
              backgroundColor: theme.ripple,
              animationDuration: '2.4s',
              animationDelay: '0ms'
            }}
          />
          <div
            aria-hidden
            className="absolute w-[190px] h-[190px] rounded-full animate-ping"
            style={{
              backgroundColor: theme.ripple,
              animationDuration: '2.4s',
              animationDelay: '0.8s'
            }}
          />
          <div
            aria-hidden
            className="absolute w-[190px] h-[190px] rounded-full animate-ping"
            style={{
              backgroundColor: theme.ripple,
              animationDuration: '2.4s',
              animationDelay: '1.6s'
            }}
          />
        </>
      )}

      {/* Intensity-reactive outer ring */}
      <div
        aria-hidden
        style={{ transform: `scale(${scale})` }}
        className={cn(
          'absolute w-[290px] h-[290px] rounded-full ring-2 transition-transform duration-150',
          theme.ring
        )}
      />

      {/* Secondary softer ring — lagging behind for depth */}
      <div
        aria-hidden
        style={{ transform: `scale(${1 + reactive * 0.12})` }}
        className={cn(
          'absolute w-[230px] h-[230px] rounded-full ring-1 transition-transform duration-300',
          theme.ring
        )}
      />

      {/* Core orb */}
      <div
        style={{ transform: `scale(${1 + reactive * 0.08})` }}
        className={cn(
          'relative w-[190px] h-[190px] rounded-full bg-gradient-to-br transition-transform duration-150',
          theme.core,
          theme.glow
        )}
      >
        {/* Glossy highlight */}
        <div
          aria-hidden
          className="absolute top-6 left-6 w-20 h-20 rounded-full bg-white/30 blur-xl"
        />
        {/* Depth shadow at bottom */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-t from-black/25 to-transparent"
        />
      </div>

      {/* Labels below the orb */}
      {(label || sublabel) && (
        <div className="absolute -bottom-24 text-center w-full max-w-xs">
          {label && (
            <div className={cn('text-2xl font-bold tracking-tight', theme.text)}>{label}</div>
          )}
          {sublabel && <div className="text-sm text-slate-400 mt-1">{sublabel}</div>}
        </div>
      )}
    </div>
  )
}
