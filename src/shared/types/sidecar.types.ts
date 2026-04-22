export type SidecarState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'unhealthy'
  | 'crashed'
  | 'stopped'
  | 'disabled'

export type SidecarKind = 'spawned' | 'external-monitor' | 'virtual'

export interface SidecarStatus {
  name: string
  label: string
  kind: SidecarKind
  state: SidecarState
  enabled: boolean
  pid: number | null
  startedAt: string | null
  lastExitCode: number | null
  lastError: string | null
  restartCount: number
  healthUrl?: string
  description: string
}

export interface SidecarLogLine {
  sidecar: string
  stream: 'stdout' | 'stderr' | 'meta'
  line: string
  timestamp: string
}

export interface SidecarStateChangeEvent {
  sidecar: string
  prev: SidecarState
  next: SidecarState
  reason?: string
}
