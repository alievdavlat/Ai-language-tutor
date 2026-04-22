import type { MicMode } from '@shared/types'
import { Card, Chip } from '../../../components/ui'

interface Option {
  id: MicMode
  label: string
  description: string
}

const OPTIONS: readonly Option[] = [
  {
    id: 'push-to-talk',
    label: '👆 Tap-to-talk',
    description: 'Click the mic (or press Space) to start. Click again to stop. Easiest on a laptop.'
  },
  {
    id: 'always-on',
    label: '🎙️ Always-on',
    description: 'The mic listens continuously. Speak — the app auto-detects 1.5 s of silence and sends what you said.'
  }
] as const

interface MicModeSectionProps {
  current: MicMode
  onChange: (mode: MicMode) => void
}

export default function MicModeSection({ current, onChange }: MicModeSectionProps): JSX.Element {
  const activeDescription = OPTIONS.find((o) => o.id === current)?.description

  return (
    <Card>
      <h2 className="font-semibold mb-3">Microphone mode</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        {OPTIONS.map((o) => (
          <Chip key={o.id} selected={current === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{activeDescription}</p>
    </Card>
  )
}
