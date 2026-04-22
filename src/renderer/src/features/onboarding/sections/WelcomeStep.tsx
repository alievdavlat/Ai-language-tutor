import { useAppStore } from '../../../store/useAppStore'
import { Button, Card, Input } from '../../../components/ui'

interface WelcomeStepProps {
  name: string
  onNameChange: (value: string) => void
  onNext: () => void
}

export default function WelcomeStep({
  name,
  onNameChange,
  onNext
}: WelcomeStepProps): JSX.Element {
  const { hw, rec } = useAppStore()

  return (
    <Card>
      <h1 className="text-3xl font-bold mb-2">Hi there 👋</h1>
      <p className="text-slate-400 mb-6">
        I&apos;m your AI language coach. Let&apos;s get you set up in a couple of minutes.
      </p>

      <label className="block text-sm font-medium mb-2">What should I call you?</label>
      <Input
        className="mb-6"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        autoFocus
      />

      {hw && rec && (
        <div className="mb-6 rounded-xl bg-white/5 border border-white/10 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Your system</p>
          <p>
            {hw.cpuModel} · {hw.totalRamGB} GB RAM · GPU: {hw.gpuModel}
          </p>
          <p className="mt-2 text-slate-300">
            Performance mode:{' '}
            <span className="capitalize font-semibold">{hw.recommendedMode}</span>
          </p>
          <p>
            Recommended model: <span className="font-semibold">{rec.llm.name}</span> (~
            {rec.llm.approxRamGB} GB RAM)
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext}>Let&apos;s start →</Button>
      </div>
    </Card>
  )
}
