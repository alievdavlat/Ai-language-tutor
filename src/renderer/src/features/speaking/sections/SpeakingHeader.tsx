import { useNavigate } from 'react-router-dom'
import type { Accent, CorrectionStyle } from '@shared/types'
import { ACCENT_LABELS, ACCENT_TO_PERSONA_NAME } from '@shared/constants'
import { Button, Chip } from '../../../components/ui'
import type { AvatarMode } from '../../../components/avatar'

interface SpeakingHeaderProps {
  accent: Accent
  level: string
  correctionStyle: CorrectionStyle
  avatarMode: AvatarMode
  onAvatarModeChange: (mode: AvatarMode) => void
  callEnabled: boolean
}

function IconPhone({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  )
}

export default function SpeakingHeader({
  accent,
  level,
  correctionStyle,
  avatarMode,
  onAvatarModeChange,
  callEnabled
}: SpeakingHeaderProps): JSX.Element {
  const navigate = useNavigate()
  const name = ACCENT_TO_PERSONA_NAME[accent]

  return (
    <header className="px-6 py-4 border-b border-canvas-line flex items-center justify-between backdrop-blur-xl bg-canvas-soft/40">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{name}</h1>
        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
          <span>{ACCENT_LABELS[accent]}</span>
          <span className="text-slate-600">·</span>
          <span>Level {level}</span>
          <span className="text-slate-600">·</span>
          <span className="capitalize">{correctionStyle} corrections</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Avatar style toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-pill bg-white/[0.04] border border-white/10">
          <Chip
            selected={avatarMode === '2d'}
            onClick={() => onAvatarModeChange('2d')}
            className="!py-1 !px-3 border-0 text-xs"
          >
            2D
          </Chip>
          <Chip
            selected={avatarMode === '3d'}
            onClick={() => onAvatarModeChange('3d')}
            className="!py-1 !px-3 border-0 text-xs"
          >
            3D
          </Chip>
        </div>

        {/* Voice call CTA */}
        <Button
          variant="primary"
          className="!py-1.5 !px-4 flex items-center gap-2"
          onClick={() => navigate('/speaking/call')}
          disabled={!callEnabled}
          title="Switch to fullscreen voice call"
        >
          <IconPhone className="w-3.5 h-3.5" />
          <span>Voice call</span>
        </Button>
      </div>
    </header>
  )
}
