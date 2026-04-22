import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../../../components/ui'

interface ModuleCardsProps {
  speakingEnabled: boolean
  speakingDisabledReason: string
}

export default function ModuleCards({
  speakingEnabled,
  speakingDisabledReason
}: ModuleCardsProps): JSX.Element {
  const navigate = useNavigate()
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <h2 className="font-semibold mb-2">🗣️ Speaking</h2>
        <p className="text-sm text-slate-400">
          Chat with your AI companion using voice or text, with live grammar correction.
        </p>
        <Button
          fullWidth
          className="mt-4"
          onClick={() => navigate('/speaking')}
          disabled={!speakingEnabled}
        >
          {speakingEnabled ? 'Start conversation' : speakingDisabledReason}
        </Button>
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">📚 Vocabulary</h2>
        <p className="text-sm text-slate-400">Review flashcards with spaced repetition.</p>
        <Button fullWidth variant="ghost" className="mt-4" disabled>
          Coming in Phase 3
        </Button>
      </Card>
      <Card>
        <h2 className="font-semibold mb-2">✍️ Grammar</h2>
        <p className="text-sm text-slate-400">Structured lessons and exercises.</p>
        <Button fullWidth variant="ghost" className="mt-4" disabled>
          Coming in Phase 4
        </Button>
      </Card>
    </section>
  )
}
