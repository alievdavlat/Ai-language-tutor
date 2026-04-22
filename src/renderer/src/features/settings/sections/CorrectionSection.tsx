import type { CorrectionStyle } from '@shared/types'
import { Card, Chip } from '../../../components/ui'

const STYLES: CorrectionStyle[] = ['gentle', 'strict', 'silent', 'inline']

interface CorrectionSectionProps {
  current: CorrectionStyle
  onChange: (style: CorrectionStyle) => void
}

export default function CorrectionSection({
  current,
  onChange
}: CorrectionSectionProps): JSX.Element {
  return (
    <Card>
      <h2 className="font-semibold mb-3">Correction style</h2>
      <div className="flex flex-wrap gap-2">
        {STYLES.map((style) => (
          <Chip
            key={style}
            selected={current === style}
            onClick={() => onChange(style)}
            className="capitalize"
          >
            {style}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Gentle: correction spoken after reply. Strict: before reply. Silent: UI only.
        Inline: woven into the reply.
      </p>
    </Card>
  )
}
