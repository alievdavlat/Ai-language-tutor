import { useNavigate } from 'react-router-dom'
import type { CorrectionStyle, UserProfile } from '@shared/types'
import { ACCENT_LABELS, dailyMood, resolveCharacter } from '@shared/constants'
import { characterAvatarUrl } from '@shared/utils/avatar'
import { Button } from '../../../components/ui'
import { IconPhone } from '../../../components/icons'

interface SpeakingHeaderProps {
  profile: UserProfile
  level: string
  correctionStyle: CorrectionStyle
  callEnabled: boolean
}

/**
 * Read-only companion header. The companion and the 2D/3D avatar mode are now
 * chosen in Settings → Companion only — the chat no longer changes them (that
 * caused stale 2D options to show in 3D mode). Tap the name to open Settings.
 */
export default function SpeakingHeader({
  profile,
  level,
  correctionStyle,
  callEnabled
}: SpeakingHeaderProps): JSX.Element {
  const navigate = useNavigate()
  const character = resolveCharacter(profile, profile.settings.characterId)
  const name = character?.name ?? 'Companion'
  const mood = character ? dailyMood(character.id) : null

  return (
    <header className="relative z-40 px-6 py-3 border-b border-canvas-line flex items-center justify-between backdrop-blur-xl bg-canvas-soft/40">
      <button
        type="button"
        onClick={() => navigate('/settings')}
        title="Change companion in Settings"
        className="flex items-center gap-3 rounded-2xl px-2 py-1 hover:bg-white/[0.05] transition text-left"
      >
        {character?.avatarSeed ? (
          <span
            className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/15 shrink-0"
            style={{ background: character.cardTint ? `#${character.cardTint}` : 'rgba(255,255,255,0.06)' }}
          >
            <img src={characterAvatarUrl(character, 72)} alt={name} className="w-full h-full" referrerPolicy="no-referrer" />
          </span>
        ) : (
          <span className="text-2xl">{character?.emoji ?? '🗣️'}</span>
        )}
        <span>
          <span className="block text-lg font-bold tracking-tight leading-none">{name}</span>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            {character ? ACCENT_LABELS[character.accent] : ''}
            {mood ? ` · ${mood.emoji} ${mood.label}` : ''} · Level {level} · {character?.correctionStyle ?? correctionStyle} corrections
          </span>
        </span>
      </button>

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
    </header>
  )
}
