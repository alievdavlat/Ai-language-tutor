import { Button, Card } from '../../../components/ui'

interface SpeakingRateSectionProps {
  current: number
  onChange: (rate: number) => void
}

const PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const

export default function SpeakingRateSection({
  current,
  onChange
}: SpeakingRateSectionProps): JSX.Element {
  return (
    <Card>
      <h2 className="font-semibold mb-3">Speaking rate</h2>
      <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.05"
        value={current}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={Math.abs(current - p) < 0.025 ? 'primary' : 'ghost'}
            onClick={() => onChange(p)}
          >
            {p.toFixed(p === 1 ? 1 : 2)}×
          </Button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{current.toFixed(2)}×</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        0.5× for learners, 2× for power listeners. TTS accepts up to 10×, but anything past 2× is hard to follow.
      </p>
    </Card>
  )
}
