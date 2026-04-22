import type { HardwareProfile, ModelRecommendation, OllamaStatus } from '@shared/types'
import { Card } from '../../../components/ui'

interface SystemStatusProps {
  hw: HardwareProfile | null
  rec: ModelRecommendation | null
  ollama: OllamaStatus | null
}

export default function SystemStatus({ hw, rec, ollama }: SystemStatusProps): JSX.Element {
  return (
    <Card>
      <h3 className="font-semibold mb-3">System</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-slate-400">CPU</dt>
        <dd>{hw?.cpuModel}</dd>
        <dt className="text-slate-400">RAM</dt>
        <dd>{hw?.totalRamGB} GB</dd>
        <dt className="text-slate-400">GPU</dt>
        <dd>
          {hw?.gpuModel} ({hw?.gpuVramMB} MB)
        </dd>
        <dt className="text-slate-400">Mode</dt>
        <dd className="capitalize">{hw?.recommendedMode}</dd>
        <dt className="text-slate-400">LLM</dt>
        <dd>{rec?.llm.name}</dd>
        <dt className="text-slate-400">Ollama</dt>
        <dd className={ollama?.running ? 'text-green-400' : 'text-amber-400'}>
          {ollama?.running
            ? `running · ${ollama.models.length} model(s)`
            : 'not running'}
        </dd>
      </dl>
    </Card>
  )
}
