import type { ReactNode } from 'react'
import { cn } from '../../../lib/classnames'

interface ActionButtonProps {
  label: string
  icon: ReactNode
  onClick: () => void
  active?: boolean
  tone?: 'neutral' | 'danger'
  disabled?: boolean
}

function ActionButton({
  label,
  icon,
  onClick,
  active = false,
  tone = 'neutral',
  disabled = false
}: ActionButtonProps): JSX.Element {
  const base = 'flex flex-col items-center gap-1.5 select-none transition'
  const surface =
    tone === 'danger'
      ? 'bg-red-500 hover:bg-red-400 ring-red-300/60 shadow-[0_8px_30px_-8px_rgba(239,68,68,0.55)]'
      : active
        ? 'bg-white/25 ring-white/40'
        : 'bg-white/10 hover:bg-white/20 ring-white/15'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(base, 'group', disabled && 'opacity-50 cursor-not-allowed')}
      aria-pressed={active}
    >
      <span
        className={cn(
          'w-16 h-16 rounded-full ring-2 flex items-center justify-center text-2xl backdrop-blur',
          surface,
          'group-hover:scale-105 group-active:scale-95 transition-transform'
        )}
      >
        {icon}
      </span>
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </button>
  )
}

interface CallControlsProps {
  muted: boolean
  paused: boolean
  onToggleMute: () => void
  onTogglePause: () => void
  onEndCall: () => void
}

export default function CallControls({
  muted,
  paused,
  onToggleMute,
  onTogglePause,
  onEndCall
}: CallControlsProps): JSX.Element {
  return (
    <div className="flex items-end justify-center gap-10">
      <ActionButton
        label={muted ? 'Unmute' : 'Mute'}
        icon={muted ? '🔇' : '🎤'}
        onClick={onToggleMute}
        active={muted}
      />
      <ActionButton
        label={paused ? 'Resume' : 'Pause'}
        icon={paused ? '▶️' : '⏸'}
        onClick={onTogglePause}
        active={paused}
      />
      <ActionButton
        label="End call"
        icon="📞"
        onClick={onEndCall}
        tone="danger"
      />
    </div>
  )
}
