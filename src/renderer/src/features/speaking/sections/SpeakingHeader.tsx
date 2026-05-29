import { useNavigate } from 'react-router-dom'
import type { Accent, CorrectionStyle, UserProfile } from '@shared/types'
import { Button, Chip } from '../../../components/ui'
import { IconPhone } from '../../../components/icons'
import type { AvatarMode } from '../../../components/avatar'
import CompanionSwitcher from './CompanionSwitcher'

interface SpeakingHeaderProps {
  profile: UserProfile
  level: string
  correctionStyle: CorrectionStyle
  avatarMode: AvatarMode
  onAvatarModeChange: (mode: AvatarMode) => void
  callEnabled: boolean
  /** Mid-chat companion switch (feature 2.14). */
  onSwitch: (characterId: string, accent: Accent) => void
}

export default function SpeakingHeader({
  profile,
  level,
  correctionStyle,
  avatarMode,
  onAvatarModeChange,
  callEnabled,
  onSwitch
}: SpeakingHeaderProps): JSX.Element {
  const navigate = useNavigate()

  return (
    <header className="px-6 py-3 border-b border-canvas-line flex items-center justify-between backdrop-blur-xl bg-canvas-soft/40">
      <div className="flex items-center gap-3">
        <CompanionSwitcher profile={profile} onSwitch={onSwitch} />
        <p className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
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
