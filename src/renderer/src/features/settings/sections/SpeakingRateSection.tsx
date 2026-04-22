import { Card } from '../../../components/ui'

interface SpeakingRateSectionProps {
  current: number
  onChange: (rate: number) => void
}

export default function SpeakingRateSection({
  current,
  onChange
}: SpeakingRateSectionProps): JSX.Element {
  return (
    <Card>
      <h2 className="font-semibold mb-3">Speaking rate</h2>
      <input
        type="range"
        min="0.6"
        max="1.4"
        step="0.05"
        value={current}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-slate-500 mt-2">{current.toFixed(2)}×</p>
    </Card>
  )
}
