import { cn } from '../../../lib/classnames'
import { Avatar, type AvatarAppearance, type AvatarEmotion, type AvatarMode } from '../../../components/avatar'
import { Input } from '../../../components/ui'

interface AvatarPanelProps {
  mode: AvatarMode
  mouthOpen: number
  emotion: AvatarEmotion
  name: string
  topic: string
  onTopicChange: (topic: string) => void
  statusLabel: string
  listening?: boolean
  /** Phase 12 — per-companion VRM model (3D mode only). */
  vrmUrl?: string
  /** Phase 12 — procedural-avatar look (used in 3D mode when no VRM). */
  appearance?: AvatarAppearance
  /** Companion portrait URL — shown as the 2D avatar. */
  portraitUrl?: string
}

const STATUS_COLORS: Record<string, string> = {
  'Listening…': 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
  'Speaking…': 'bg-brand-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]',
  'Thinking…': 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
  'Ready': 'bg-slate-500'
}

export default function AvatarPanel({
  mode,
  mouthOpen,
  emotion,
  name,
  topic,
  onTopicChange,
  statusLabel,
  listening = false,
  vrmUrl,
  appearance,
  portraitUrl
}: AvatarPanelProps): JSX.Element {
  const dotClass = STATUS_COLORS[statusLabel] ?? 'bg-slate-500'
  const isActive = statusLabel !== 'Ready'

  return (
    <div className="relative rounded-2xl border border-white/[0.07] overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg, rgba(59,130,246,0.12) 0%, rgba(15,23,42,0.6) 60%, rgba(15,23,42,0.4) 100%)'
      }}
    >
      {/* Glow blob behind the avatar */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl transition-opacity duration-700',
          isActive ? 'opacity-100 bg-speak-500/25' : 'opacity-50 bg-brand-500/15'
        )}
      />

      {/* Avatar area */}
      <div className="relative flex-1 flex items-center justify-center py-6 px-4 animate-fade-in min-h-[260px]">
        <Avatar mode={mode} mouthOpen={mouthOpen} emotion={emotion} name={name} vrmUrl={vrmUrl} appearance={appearance} portraitUrl={portraitUrl} />
      </div>

      {/* Bottom panel */}
      <div className="relative px-4 pb-4 flex flex-col gap-3">
        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-black/20 backdrop-blur border border-white/[0.06]">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0 transition-all duration-300',
              dotClass,
              listening && 'animate-pulse'
            )}
          />
          <span className="text-xs font-medium text-slate-300">{statusLabel}</span>
        </div>

        {/* Topic input */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
            Today's topic
          </label>
          <Input
            placeholder="e.g. your last trip, tech news…"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
