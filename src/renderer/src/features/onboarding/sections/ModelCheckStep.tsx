import { useEffect, useState } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { Button, Card, ProgressBar } from '../../../components/ui'

interface ModelCheckStepProps {
  onReady: () => void
  onSkip: () => void
  onBack: () => void
}

interface PullProgress {
  status: string
  pct?: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusRowProps {
  ready: boolean
  label: string
  sublabel: string
  action?: React.ReactNode
}

function StatusRow({ ready, label, sublabel, action }: StatusRowProps): JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-4">
      <div
        className={[
          'w-2.5 h-2.5 rounded-full shrink-0',
          ready ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
        ].join(' ')}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
      </div>
      {action}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ModelCheckStep({
  onReady,
  onSkip,
  onBack
}: ModelCheckStepProps): JSX.Element {
  const { rec, ollama, refreshOllama } = useAppStore()
  const [pulling, setPulling] = useState(false)
  const [progress, setProgress] = useState<PullProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = window.api.ollama.onPullProgress((p) => {
      setProgress({ status: p.status, pct: p.pct })
    })
    return () => unsub()
  }, [])

  const aiRunning = !!ollama?.running
  const hasModel = !!rec && !!ollama?.models.includes(rec.llm.tag)
  const allReady = aiRunning && hasModel

  const handleInstall = async (): Promise<void> => {
    if (!rec) return
    setPulling(true)
    setError(null)
    try {
      await window.api.ollama.pull(rec.llm.tag)
      await refreshOllama()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPulling(false)
    }
  }

  const engineSublabel = aiRunning
    ? 'Ready'
    : 'Install the free Ollama app and start it, then click "Re-check" below.'

  const modelSublabel = rec
    ? `${rec.llm.name} · about ${rec.llm.approxRamGB} GB`
    : 'Detecting recommended model…'

  return (
    <Card>
      <div className="text-4xl mb-4 text-center">🧠</div>
      <h2 className="text-2xl font-bold mb-2 text-center">Setting up your AI coach</h2>
      <p className="text-slate-400 mb-6 text-sm text-center max-w-sm mx-auto">
        SpeakAI runs entirely on your computer — no internet needed during practice, no
        data sent anywhere.
      </p>

      <div className="space-y-3 mb-6">
        <StatusRow
          ready={aiRunning}
          label={aiRunning ? 'AI engine ready' : 'AI engine not found'}
          sublabel={
            aiRunning
              ? 'The AI service is running.'
              : engineSublabel
          }
          action={
            !aiRunning ? (
              <a
                href="https://ollama.com/download"
                target="_blank"
                rel="noreferrer"
                className="text-xs underline text-brand-300 hover:text-brand-200 shrink-0"
              >
                Download
              </a>
            ) : undefined
          }
        />

        {rec && (
          <StatusRow
            ready={hasModel}
            label={hasModel ? 'AI language model ready' : 'AI language model not installed'}
            sublabel={modelSublabel}
            action={
              !hasModel && aiRunning && !pulling ? (
                <Button className="!py-1.5 !px-4 shrink-0" onClick={handleInstall}>
                  Install
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      {pulling && progress && (
        <div className="mb-4 rounded-xl bg-brand-500/10 border border-brand-400/20 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs text-brand-200">Downloading AI model…</span>
            <span className="text-xs font-semibold text-brand-300">
              {progress.pct ? `${progress.pct}%` : '…'}
            </span>
          </div>
          <ProgressBar value={progress.pct ?? 0} />
          <p className="text-[11px] text-slate-500 mt-1.5">{progress.status}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-200">
          Download failed. Check your internet connection and try again.
        </div>
      )}

      {allReady && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-200 text-center">
          ✓ Your AI coach is ready!
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={refreshOllama}>
            Re-check
          </Button>
          {!allReady && (
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          )}
          <Button onClick={onReady} disabled={!allReady}>
            Continue →
          </Button>
        </div>
      </div>
    </Card>
  )
}
