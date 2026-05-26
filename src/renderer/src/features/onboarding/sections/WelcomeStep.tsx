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
  return (
    <Card className="text-center py-8">
      <div className="text-5xl mb-4">👋</div>
      <h1 className="text-3xl font-bold mb-3">Welcome to SpeakAI</h1>
      <p className="text-slate-400 mb-8 max-w-sm mx-auto">
        Your personal AI English coach — private, offline, and always available. Let&apos;s
        get you set up in a couple of minutes.
      </p>

      <div className="max-w-xs mx-auto">
        <label className="block text-sm font-medium mb-2 text-left">What should I call you?</label>
        <Input
          className="mb-6"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onNext()
          }}
        />
      </div>

      <div className="flex justify-center">
        <Button onClick={onNext} className="!px-8">
          Get started →
        </Button>
      </div>
    </Card>
  )
}
