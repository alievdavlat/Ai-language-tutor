import type { SidecarKind } from '@shared/types'

export interface RestartPolicy {
  enabled: boolean
  maxAttempts: number
  initialBackoffMs: number
  maxBackoffMs: number
}

export interface HealthCheckConfig {
  /** HTTP GET endpoint that returns 2xx when healthy. */
  httpUrl?: string
  /** Raw TCP port (used when httpUrl isn't provided). */
  port?: number
  host?: string
  intervalMs: number
  timeoutMs: number
  /** Grace period after start before the first check runs. */
  startupGraceMs: number
}

export interface SpawnedSidecarDefinition {
  name: string
  label: string
  description: string
  kind: 'spawned'
  enabled: boolean
  command: string
  args: string[]
  cwd?: string
  env?: Record<string, string>
  healthCheck?: HealthCheckConfig
  restart: RestartPolicy
}

export interface ExternalMonitorDefinition {
  name: string
  label: string
  description: string
  kind: 'external-monitor'
  enabled: boolean
  healthCheck: HealthCheckConfig
}

export interface VirtualSidecarDefinition {
  name: string
  label: string
  description: string
  kind: 'virtual'
  enabled: boolean
  /** Called by the manager to compute current state (no process to spawn). */
  probe: () => Promise<{ ok: boolean; detail?: string }>
  probeIntervalMs: number
}

export type SidecarDefinition =
  | SpawnedSidecarDefinition
  | ExternalMonitorDefinition
  | VirtualSidecarDefinition

export function kindOf(def: SidecarDefinition): SidecarKind {
  return def.kind
}
