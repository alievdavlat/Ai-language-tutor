import type { MicMode } from '@shared/types'
import { Card, Chip } from '../../../components/ui'
import { useT } from '../../../i18n'
import type { StringKey } from '../../../i18n/strings'

interface Option {
  id: MicMode
  emoji: string
}

const OPTIONS: readonly Option[] = [
  { id: 'push-to-talk', emoji: '👆' },
  { id: 'always-on', emoji: '🎙️' }
] as const

const labelKey = (id: MicMode): StringKey =>
  (id === 'push-to-talk' ? 'setb.micPushLabel' : 'setb.micAlwaysLabel') as StringKey
const descKey = (id: MicMode): StringKey =>
  (id === 'push-to-talk' ? 'setb.micPushDesc' : 'setb.micAlwaysDesc') as StringKey

interface MicModeSectionProps {
  current: MicMode
  onChange: (mode: MicMode) => void
}

export default function MicModeSection({ current, onChange }: MicModeSectionProps): JSX.Element {
  const t = useT()
  const activeDescription = t(descKey(current))

  return (
    <Card>
      <h2 className="font-semibold mb-3">{t('setb.micModeTitle')}</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        {OPTIONS.map((o) => (
          <Chip key={o.id} selected={current === o.id} onClick={() => onChange(o.id)}>
            {o.emoji} {t(labelKey(o.id))}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{activeDescription}</p>
    </Card>
  )
}
