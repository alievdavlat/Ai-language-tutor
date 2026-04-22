import type { Accent } from '@shared/types'
import { ACCENTS, ACCENT_LABELS } from '@shared/constants'
import { Card, Chip } from '../../../components/ui'

interface AccentSectionProps {
  current: Accent
  onChange: (accent: Accent) => void
}

export default function AccentSection({ current, onChange }: AccentSectionProps): JSX.Element {
  return (
    <Card>
      <h2 className="font-semibold mb-3">Accent</h2>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((a) => (
          <Chip key={a} selected={current === a} onClick={() => onChange(a)}>
            {ACCENT_LABELS[a]}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Uses installed system voices. Install more Windows voices from Settings → Time &amp;
        Language → Speech.
      </p>
    </Card>
  )
}
