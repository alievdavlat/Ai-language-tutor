import { useEffect, useState } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { Button, Card, ProgressBar, StatusBadge } from '../../../components/ui'

interface ModelCheckStepProps {
  onReady: () => void
  onSkip: () => void
  onBack: () => void
}

interface PullProgress {
  status: string
  pct?: number
}

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
    return () => {
      unsub()
    }
  }, [])

  const ollamaRunning = !!ollama?.running
  const hasModel = !!rec && !!ollama?.models.includes(rec.llm.tag)

  const handlePull = async (): Promise<void> => {
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

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-2">Local AI engine</h2>
      <p className="text-slate-400 mb-6 text-sm">
        This app runs AI entirely on your computer. No tokens, no cloud, your data stays private.
      </p>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Ollama service</span>
          <StatusBadge tone={ollamaRunning ? 'green' : 'amber'}>
            {ollamaRunning ? 'running' : 'not running'}
          </StatusBadge>
        </div>
        {!ollamaRunning && (
          <p className="text-xs text-slate-400">
            Install Ollama from{' '}
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              ollama.com/download
            </a>
            , then launch it. Click &quot;Re-check&quot; below.
          </p>
        )}
      </div>

      {rec && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Model: {rec.llm.name}</span>
            <StatusBadge tone={hasModel ? 'green' : 'slate'}>
              {hasModel ? 'downloaded' : 'not downloaded'}
            </StatusBadge>
          </div>
          <p className="text-xs text-slate-400">
            Tag: <code>{rec.llm.tag}</code> · ~{rec.llm.approxRamGB} GB
          </p>
          {!hasModel && ollamaRunning && (
            <Button
              fullWidth
              className="mt-3"
              onClick={handlePull}
              disabled={pulling}
            >
              {pulling ? 'Downloading…' : 'Download model'}
            </Button>
          )}
          {pulling && progress && (
            <div className="mt-3">
              <ProgressBar value={progress.pct ?? 0} />
              <p className="text-xs text-slate-500 mt-1">
                {progress.status} {progress.pct ? `· ${progress.pct}%` : ''}
              </p>
            </div>
          )}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
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
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={onReady} disabled={!ollamaRunning || !hasModel}>
            Continue →
          </Button>
        </div>
      </div>
    </Card>
  )
}
