import type { STTEngine, WhisperModelTag } from '@shared/types'
import { WHISPER_MODELS } from '@shared/constants'
import { Button, Card, ProgressBar, StatusBadge } from '../../../components/ui'
import { useWhisperModelLoader } from '../../../hooks/useWhisperModelLoader'
import { cn } from '../../../lib/classnames'

const ENGINES: Array<{ id: STTEngine; label: string; desc: string }> = [
  {
    id: 'web-speech',
    label: '🌐 Web Speech (online)',
    desc: 'Uses the system speech recognizer. Works out of the box but needs internet on Windows.'
  },
  {
    id: 'whisper-local',
    label: '⚡ Whisper (offline, in-browser)',
    desc: 'Fully offline after first load. Weights cached in IndexedDB via transformers.js.'
  }
]

const ALL_MODELS: WhisperModelTag[] = Object.keys(WHISPER_MODELS) as WhisperModelTag[]

interface STTEngineSectionProps {
  engine: STTEngine
  currentModel: WhisperModelTag
  onEngineChange: (engine: STTEngine) => void
  onModelChange: (model: WhisperModelTag) => void
}

export default function STTEngineSection({
  engine,
  currentModel,
  onEngineChange,
  onModelChange
}: STTEngineSectionProps): JSX.Element {
  const loader = useWhisperModelLoader(currentModel)

  return (
    <Card>
      <h2 className="font-semibold mb-3">Speech recognition (STT)</h2>

      <div className="space-y-2 mb-5">
        {ENGINES.map((e) => (
          <button
            key={e.id}
            onClick={() => onEngineChange(e.id)}
            className={cn(
              'w-full text-left rounded-lg border p-3 transition',
              engine === e.id
                ? 'border-brand-400 bg-brand-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            )}
          >
            <div className="text-sm font-semibold">{e.label}</div>
            <p className="text-xs text-slate-400 mt-0.5">{e.desc}</p>
          </button>
        ))}
      </div>

      {engine === 'whisper-local' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Whisper model</h3>
            <StatusBadge tone={loader.loaded ? 'green' : 'amber'}>
              {loader.loaded ? 'ready in memory' : loader.loading ? 'loading…' : 'not loaded'}
            </StatusBadge>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            The chosen model is downloaded once into your browser cache (~78&nbsp;MB for
            tiny, ~150&nbsp;MB for base) and persists across app restarts.
          </p>

          {loader.loading && (
            <div className="mb-3">
              <ProgressBar value={Math.round(loader.progress * 100)} />
              <p className="text-[10px] text-slate-500 mt-1">
                {loader.status} · {Math.round(loader.progress * 100)}%
              </p>
            </div>
          )}

          <div className="space-y-2">
            {ALL_MODELS.map((tag) => {
              const info = WHISPER_MODELS[tag]
              const active = currentModel === tag
              return (
                <div
                  key={tag}
                  className={cn(
                    'rounded-lg border p-3',
                    active
                      ? 'border-brand-400/60 bg-brand-500/10'
                      : 'border-white/10 bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{tag}</div>
                      <div className="text-xs text-slate-400">
                        {info.sizeLabel} · {info.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {active ? (
                        <span className="text-xs text-brand-300 font-semibold">● Active</span>
                      ) : (
                        <Button variant="ghost" onClick={() => onModelChange(tag)}>
                          Use
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button onClick={() => void loader.load()} disabled={loader.loading || loader.loaded}>
              {loader.loaded
                ? 'Already loaded'
                : loader.loading
                  ? 'Loading…'
                  : `Preload ${currentModel}`}
            </Button>
            <p className="text-[11px] text-slate-500">
              Pre-load now, or just start speaking — the first transcription will load the
              model automatically.
            </p>
          </div>

          {loader.error && <p className="text-xs text-red-400 mt-3">{loader.error}</p>}
        </>
      )}
    </Card>
  )
}
