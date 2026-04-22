import { Avatar, type AvatarEmotion, type AvatarMode } from '../../../components/avatar'
import { Card, Input } from '../../../components/ui'

interface AvatarPanelProps {
  mode: AvatarMode
  mouthOpen: number
  emotion: AvatarEmotion
  name: string
  topic: string
  onTopicChange: (topic: string) => void
  statusLabel: string
}

export default function AvatarPanel({
  mode,
  mouthOpen,
  emotion,
  name,
  topic,
  onTopicChange,
  statusLabel
}: AvatarPanelProps): JSX.Element {
  return (
    <Card className="relative flex flex-col items-center overflow-hidden !p-5">
      {/* Glow behind the avatar */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-speak-500/30 blur-3xl"
      />

      <div className="relative w-full flex justify-center py-4 animate-fade-in">
        <Avatar mode={mode} mouthOpen={mouthOpen} emotion={emotion} name={name} />
      </div>

      <div className="relative w-full">
        <label className="text-[11px] uppercase tracking-wider text-slate-500 block mb-1.5">
          Today's topic
        </label>
        <Input
          placeholder="e.g. your last trip, tech news…"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
        />
      </div>

      <div className="relative mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-pill bg-white/[0.03] border border-white/10 text-xs">
        <span>{statusLabel}</span>
      </div>
    </Card>
  )
}
