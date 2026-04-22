import type { HardwareProfile, ModelRecommendation, OllamaStatus } from '@shared/types'
import { Card, StatusBadge } from '../../../components/ui'

interface SystemStatusStripProps {
  hw: HardwareProfile | null
  rec: ModelRecommendation | null
  ollama: OllamaStatus | null
}

export default function SystemStatusStrip({
  hw,
  rec,
  ollama
}: SystemStatusStripProps): JSX.Element {
  const running = !!ollama?.running
  const modelCount = ollama?.models.length ?? 0

  return (
    <Card className="!p-4 flex flex-wrap items-center gap-4 text-xs">
      <StatusBadge tone={running ? 'green' : 'amber'}>
        {running ? `Ollama · ${modelCount} model(s)` : 'Ollama · offline'}
      </StatusBadge>
      {hw && (
        <span className="text-slate-400">
          {hw.cpuModel} · {hw.totalRamGB} GB RAM · mode{' '}
          <span className="capitalize text-slate-200">{hw.recommendedMode}</span>
        </span>
      )}
      {rec && <span className="text-slate-400">LLM · {rec.llm.name}</span>}
    </Card>
  )
}
