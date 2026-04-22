import { useState } from 'react'
import { listLLMModels, type LLMModelInfo } from '@shared/constants'
import { Button, Card, ProgressBar, StatusBadge } from '../../../components/ui'
import { useOllamaModels } from '../../../hooks/useOllamaModels'

interface LLMModelSectionProps {
  currentTag: string
  recommendedTag: string
  freeRamGB: number
  onPick: (tag: string) => void
}

function isInstalled(installed: string[], tag: string): boolean {
  // Ollama returns the full tag (e.g. "qwen2.5:1.5b-instruct-q4_K_M").
  // Exact match only — prefix matching caused the whole family to look
  // "downloaded" when only a single size was actually present.
  return installed.includes(tag)
}

function willFit(info: LLMModelInfo, freeRamGB: number): boolean {
  return freeRamGB >= info.approxRamGB - 0.2
}

function TierLabel({ tier }: { tier: LLMModelInfo['tier'] }): JSX.Element {
  const tones = {
    tiny: 'bg-green-500/20 text-green-300',
    fast: 'bg-brand-500/20 text-brand-200',
    balanced: 'bg-amber-500/20 text-amber-200',
    quality: 'bg-purple-500/20 text-purple-200'
  } as const
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${tones[tier]}`}>
      {tier}
    </span>
  )
}

export default function LLMModelSection({
  currentTag,
  recommendedTag,
  freeRamGB,
  onPick
}: LLMModelSectionProps): JSX.Element {
  const { installed, running, pull, pullProgress } = useOllamaModels()
  const [downloadingTag, setDownloadingTag] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const models = listLLMModels()
  const effectiveTag = currentTag || recommendedTag

  const startDownload = async (tag: string): Promise<void> => {
    setDownloadingTag(tag)
    setError(null)
    const res = await pull(tag)
    if (!res.ok) setError(`Download failed: ${tag}`)
    setDownloadingTag(null)
  }

  return (
    <Card>
      <h2 className="font-semibold mb-1">Language model (LLM)</h2>
      <p className="text-xs text-slate-500 mb-4">
        Free RAM: <span className="text-slate-300">{freeRamGB.toFixed(1)} GB</span> · Models that
        fit show in green. Close browser tabs to free more memory.
      </p>

      {!running && (
        <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 p-3 text-xs text-amber-200 mb-3">
          Ollama isn&apos;t running. Launch it from the system tray, then come back.
        </div>
      )}

      <div className="space-y-2">
        {models.map((info) => {
          const active = effectiveTag === info.tag
          const done = isInstalled(installed, info.tag)
          const fits = willFit(info, freeRamGB)
          const isDownloading = downloadingTag === info.tag
          const progress = pullProgress[info.tag]

          return (
            <div
              key={info.tag}
              className={`rounded-lg border p-3 ${
                active
                  ? 'border-brand-400/60 bg-brand-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{info.name}</span>
                  <TierLabel tier={info.tier} />
                  {info.tag === recommendedTag && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-200 uppercase">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={fits ? 'green' : 'amber'}>
                    {fits ? 'fits RAM' : `needs ${info.approxRamGB} GB`}
                  </StatusBadge>
                  <StatusBadge tone={done ? 'green' : 'slate'}>
                    {done ? 'downloaded' : 'not downloaded'}
                  </StatusBadge>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {info.sizeLabel} · {info.description}
              </p>

              <div className="flex gap-2">
                {done && !active && (
                  <Button variant="ghost" onClick={() => onPick(info.tag)}>
                    Use
                  </Button>
                )}
                {done && active && (
                  <span className="text-xs text-brand-300 self-center">● Active</span>
                )}
                {!done && running && (
                  <Button
                    onClick={() => void startDownload(info.tag)}
                    disabled={isDownloading || downloadingTag !== null}
                  >
                    {isDownloading ? 'Downloading…' : 'Download'}
                  </Button>
                )}
              </div>

              {progress && isDownloading && (
                <div className="mt-2">
                  <ProgressBar value={progress.pct ?? 0} />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {progress.status}
                    {progress.pct !== undefined ? ` · ${progress.pct}%` : ''}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
    </Card>
  )
}
