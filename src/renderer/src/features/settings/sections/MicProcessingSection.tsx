import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'
import type { StringKey } from '../../../i18n/strings'

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

type ToggleKey = 'noiseSuppression' | 'echoCancellation' | 'autoGainControl'

interface Toggle {
  key: ToggleKey
  emoji: string
}

const TOGGLES: readonly Toggle[] = [
  { key: 'noiseSuppression', emoji: '🔇' },
  { key: 'echoCancellation', emoji: '🔄' },
  { key: 'autoGainControl', emoji: '📶' }
] as const

const toggleLabelKey = (key: ToggleKey): StringKey =>
  ({
    noiseSuppression: 'setb.noiseSuppressionLabel',
    echoCancellation: 'setb.echoCancellationLabel',
    autoGainControl: 'setb.autoGainControlLabel'
  }[key] as StringKey)
const toggleDescKey = (key: ToggleKey): StringKey =>
  ({
    noiseSuppression: 'setb.noiseSuppressionDesc',
    echoCancellation: 'setb.echoCancellationDesc',
    autoGainControl: 'setb.autoGainControlDesc'
  }[key] as StringKey)

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
  const t = useT()
  const values = { noiseSuppression, echoCancellation, autoGainControl }
  return (
    <Card>
      <h2 className="font-semibold mb-1">{t('setb.micProcessingTitle')}</h2>
      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        {t('setb.micProcessingHint')}
      </p>
      <div className="space-y-2">
        {TOGGLES.map((tg) => (
          <SwitchRow
            key={tg.key}
            label={`${tg.emoji} ${t(toggleLabelKey(tg.key))}`}
            desc={t(toggleDescKey(tg.key))}
            value={values[tg.key]}
            onToggle={() => onChange({ [tg.key]: !values[tg.key] })}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mt-3">
        {t('setb.micProcessingNote')}
      </p>
    </Card>
  )
}
