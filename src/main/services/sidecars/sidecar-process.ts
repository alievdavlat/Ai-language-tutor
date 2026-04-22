import { type ChildProcess, spawn } from 'node:child_process'
import type { SidecarState, SidecarStatus } from '@shared/types'
import { runHealthCheck } from './sidecar-health.js'
import { SidecarLogger } from './sidecar-logger.js'
import type {
  ExternalMonitorDefinition,
  SidecarDefinition,
  SpawnedSidecarDefinition,
  VirtualSidecarDefinition
} from './types.js'

export interface ProcessEvents {
  onStateChange: (next: SidecarState, reason?: string) => void
  onLog: (stream: 'stdout' | 'stderr' | 'meta', line: string) => void
}

export abstract class SidecarController {
  protected state: SidecarState = 'idle'
  protected startedAt: string | null = null
  protected pid: number | null = null
  protected lastExitCode: number | null = null
  protected lastError: string | null = null
  protected restartCount = 0
  protected healthTimer: NodeJS.Timeout | null = null

  constructor(
    protected readonly def: SidecarDefinition,
    protected readonly logger: SidecarLogger,
    protected readonly events: ProcessEvents
  ) {}

  abstract start(): Promise<void>
  abstract stop(): Promise<void>

  async restart(): Promise<void> {
    await this.stop()
    this.restartCount++
    await this.start()
  }

  getStatus(): SidecarStatus {
    return {
      name: this.def.name,
      label: this.def.label,
      kind: this.def.kind,
      state: this.def.enabled ? this.state : 'disabled',
      enabled: this.def.enabled,
      pid: this.pid,
      startedAt: this.startedAt,
      lastExitCode: this.lastExitCode,
      lastError: this.lastError,
      restartCount: this.restartCount,
      healthUrl:
        'healthCheck' in this.def ? this.def.healthCheck?.httpUrl : undefined,
      description: this.def.description
    }
  }

  protected setState(next: SidecarState, reason?: string): void {
    if (this.state === next) return
    this.state = next
    this.logger.append('meta', `state → ${next}${reason ? ` (${reason})` : ''}`)
    this.events.onStateChange(next, reason)
  }

  protected clearHealthTimer(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer)
      this.healthTimer = null
    }
  }
}

// -------------- Spawned sidecar (we own the process) --------------

export class SpawnedSidecarController extends SidecarController {
  private child: ChildProcess | null = null
  private restartTimer: NodeJS.Timeout | null = null

  constructor(
    protected readonly def: SpawnedSidecarDefinition,
    logger: SidecarLogger,
    events: ProcessEvents
  ) {
    super(def, logger, events)
  }

  async start(): Promise<void> {
    if (!this.def.enabled) {
      this.setState('disabled', 'sidecar disabled in config')
      return
    }
    if (this.child) return

    this.setState('starting')
    try {
      const child = spawn(this.def.command, this.def.args, {
        cwd: this.def.cwd,
        env: { ...process.env, ...this.def.env },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      this.child = child
      this.pid = child.pid ?? null
      this.startedAt = new Date().toISOString()
      this.lastError = null

      child.stdout?.on('data', (chunk: Buffer) => this.onLog('stdout', chunk))
      child.stderr?.on('data', (chunk: Buffer) => this.onLog('stderr', chunk))
      child.on('exit', (code) => this.onExit(code))
      child.on('error', (err) => {
        this.lastError = err.message
        this.logger.append('meta', `spawn error: ${err.message}`)
      })

      this.scheduleHealthLoop()
      this.setState('running')
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err)
      this.setState('crashed', this.lastError)
    }
  }

  async stop(): Promise<void> {
    this.clearRestartTimer()
    this.clearHealthTimer()
    if (!this.child) {
      this.setState('stopped')
      return
    }
    const child = this.child
    this.child = null
    try {
      child.kill('SIGTERM')
    } catch {
      // best-effort
    }
    this.setState('stopped')
  }

  private onLog(stream: 'stdout' | 'stderr', chunk: Buffer): void {
    const text = chunk.toString('utf-8')
    for (const line of text.split(/\r?\n/).filter(Boolean)) {
      this.logger.append(stream, line)
      this.events.onLog(stream, line)
    }
  }

  private onExit(code: number | null): void {
    this.lastExitCode = code
    this.pid = null
    this.clearHealthTimer()
    this.logger.append('meta', `exited with code ${code}`)

    if (!this.def.restart.enabled) {
      this.setState(code === 0 ? 'stopped' : 'crashed', `exit ${code}`)
      return
    }
    if (this.restartCount >= this.def.restart.maxAttempts) {
      this.setState('crashed', 'max restart attempts reached')
      return
    }

    const backoff = Math.min(
      this.def.restart.maxBackoffMs,
      this.def.restart.initialBackoffMs * 2 ** this.restartCount
    )
    this.setState('crashed', `restart in ${backoff}ms`)
    this.restartTimer = setTimeout(() => {
      this.restartCount++
      void this.start()
    }, backoff)
  }

  private scheduleHealthLoop(): void {
    const cfg = this.def.healthCheck
    if (!cfg) return
    this.clearHealthTimer()
    setTimeout(() => {
      this.healthTimer = setInterval(async () => {
        const result = await runHealthCheck(cfg)
        if (!result.ok) {
          this.setState('unhealthy', result.detail)
        } else if (this.state === 'unhealthy') {
          this.setState('running', 'recovered')
        }
      }, cfg.intervalMs)
    }, cfg.startupGraceMs)
  }

  private clearRestartTimer(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
  }
}

// -------------- External monitor (we only health-check it) --------------

export class ExternalMonitorController extends SidecarController {
  constructor(
    protected readonly def: ExternalMonitorDefinition,
    logger: SidecarLogger,
    events: ProcessEvents
  ) {
    super(def, logger, events)
  }

  async start(): Promise<void> {
    if (!this.def.enabled) {
      this.setState('disabled')
      return
    }
    this.setState('starting', 'probing external service')
    this.startedAt = new Date().toISOString()

    const runCheck = async (): Promise<void> => {
      const result = await runHealthCheck(this.def.healthCheck)
      if (result.ok) {
        if (this.state !== 'running') this.setState('running', result.detail)
      } else {
        this.setState('unhealthy', result.detail)
      }
    }

    await runCheck()
    this.healthTimer = setInterval(() => void runCheck(), this.def.healthCheck.intervalMs)
  }

  async stop(): Promise<void> {
    this.clearHealthTimer()
    this.setState('stopped')
  }
}

// -------------- Virtual sidecar (library-backed, no process) --------------

export class VirtualSidecarController extends SidecarController {
  private probeTimer: NodeJS.Timeout | null = null

  constructor(
    protected readonly def: VirtualSidecarDefinition,
    logger: SidecarLogger,
    events: ProcessEvents
  ) {
    super(def, logger, events)
  }

  async start(): Promise<void> {
    if (!this.def.enabled) {
      this.setState('disabled')
      return
    }
    this.startedAt = new Date().toISOString()

    const probe = async (): Promise<void> => {
      try {
        const result = await this.def.probe()
        this.setState(result.ok ? 'running' : 'unhealthy', result.detail)
      } catch (err) {
        this.setState('unhealthy', err instanceof Error ? err.message : String(err))
      }
    }

    await probe()
    this.probeTimer = setInterval(() => void probe(), this.def.probeIntervalMs)
  }

  async stop(): Promise<void> {
    if (this.probeTimer) {
      clearInterval(this.probeTimer)
      this.probeTimer = null
    }
    this.setState('stopped')
  }
}

export function buildController(
  def: SidecarDefinition,
  logger: SidecarLogger,
  events: ProcessEvents
): SidecarController {
  switch (def.kind) {
    case 'spawned':
      return new SpawnedSidecarController(def, logger, events)
    case 'external-monitor':
      return new ExternalMonitorController(def, logger, events)
    case 'virtual':
      return new VirtualSidecarController(def, logger, events)
  }
}
