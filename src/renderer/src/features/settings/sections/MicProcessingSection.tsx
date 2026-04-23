import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'

interface MicProcessingSectionProps {
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  onChange: (patch: Partial<{
    noiseSuppression: boolean
    echoCancellation: boolean
    autoGainControl: boolean
  }>) => void
}

interface Toggle {
  key: 'noiseSuppression' | 'echoCancellation' | 'autoGainControl'
  label: string
  desc: string
}

const TOGGLES: readonly Toggle[] = [
  {
    key: 'noiseSuppression',
    label: '🔇 Noise suppression',
    desc: 'Strips background noise (keyboard clicks, fans, traffic) from the mic before the AI hears it.'
  },
  {
    key: 'echoCancellation',
    label: '🔄 Echo cancellation',
    desc: "Stops the AI's voice coming out of your speakers from feeding back into the mic."
  },
  {
    key: 'autoGainControl',
    label: '📶 Auto gain control',
    desc: 'Evens out your mic volume — whispers get boosted, shouts get tamed.'
  }
] as const

function SwitchRow({
  label,
  desc,
  value,
  onToggle
}: {
  label: string
  desc: string
  value: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition"
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 inline-flex h-5 w-9 rounded-full border transition',
          value
            ? 'bg-brand-500/80 border-brand-400 justify-end'
            : 'bg-white/5 border-white/20 justify-start'
        )}
      >
        <span className="m-0.5 h-4 w-4 rounded-full bg-white" />
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export default function MicProcessingSection({
  noiseSuppression,
  echoCancellation,
  autoGainControl,
  onChange
}: MicProcessingSectionProps): JSX.Element {
  const values = { noiseSuppression, echoCancellation, autoGainControl }
  return (
    <Card>
      <h2 className="font-semibold mb-1">Microphone processing</h2>
      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        Built-in WebRTC filters applied to your mic stream. Safe defaults are on. Turn off
        individual filters if your mic already has hardware DSP or you want raw audio.
      </p>
      <div className="space-y-2">
        {TOGGLES.map((t) => (
          <SwitchRow
            key={t.key}
            label={t.label}
            desc={t.desc}
            value={values[t.key]}
            onToggle={() => onChange({ [t.key]: !values[t.key] })}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mt-3">
        Toggle changes take effect the next time you start speaking (mic stream is re-acquired).
      </p>
    </Card>
  )
}
