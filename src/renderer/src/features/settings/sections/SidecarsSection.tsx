import type { SidecarState, SidecarStatus } from '@shared/types'
import { Button, Card, StatusBadge } from '../../../components/ui'
import { useSidecars } from '../../../hooks/useSidecars'

const STATE_TONE: Record<SidecarState, 'green' | 'amber' | 'red' | 'slate'> = {
  idle: 'slate',
  starting: 'amber',
  running: 'green',
  unhealthy: 'amber',
  crashed: 'red',
  stopped: 'slate',
  disabled: 'slate'
}

interface SidecarRowProps {
  sidecar: SidecarStatus
  onStart: (name: string) => void
  onStop: (name: string) => void
  onRestart: (name: string) => void
}

function SidecarRow({ sidecar, onStart, onStop, onRestart }: SidecarRowProps): JSX.Element {
  const isRunning = sidecar.state === 'running' || sidecar.state === 'starting'
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div>
          <div className="text-sm font-semibold">{sidecar.label}</div>
          <div className="text-xs text-slate-500">
            {sidecar.kind} · {sidecar.name}
            {sidecar.pid ? ` · pid ${sidecar.pid}` : ''}
          </div>
        </div>
        <StatusBadge tone={STATE_TONE[sidecar.state]}>{sidecar.state}</StatusBadge>
      </div>
      <p className="text-xs text-slate-400">{sidecar.description}</p>
      {sidecar.lastError && (
        <p className="text-xs text-red-400 mt-1">Last error: {sidecar.lastError}</p>
      )}
      {sidecar.enabled && sidecar.kind !== 'virtual' && (
        <div className="flex gap-2 mt-2">
          {!isRunning && (
            <Button variant="ghost" onClick={() => onStart(sidecar.name)}>
              Start
            </Button>
          )}
          {isRunning && (
            <Button variant="ghost" onClick={() => onStop(sidecar.name)}>
              Stop
            </Button>
          )}
          <Button variant="ghost" onClick={() => onRestart(sidecar.name)}>
            Restart
          </Button>
        </div>
      )}
    </div>
  )
}

export default function SidecarsSection(): JSX.Element {
  const { sidecars, start, stop, restart } = useSidecars()

  return (
    <Card>
      <h2 className="font-semibold mb-3">Sidecar services</h2>
      <p className="text-xs text-slate-500 mb-4">
        Background services managed by the app. Health checks run every 15–60 seconds.
        Coming soon: Kokoro TTS (Phase 3.8).
      </p>
      <div className="space-y-2">
        {sidecars.length === 0 && (
          <p className="text-xs text-slate-500">No sidecars registered.</p>
        )}
        {sidecars.map((s) => (
          <SidecarRow
            key={s.name}
            sidecar={s}
            onStart={(n) => void start(n)}
            onStop={(n) => void stop(n)}
            onRestart={(n) => void restart(n)}
          />
        ))}
      </div>
    </Card>
  )
}
