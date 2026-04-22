import { EventEmitter } from 'node:events'
import type {
  SidecarLogLine,
  SidecarState,
  SidecarStateChangeEvent,
  SidecarStatus
} from '@shared/types'
import { buildController, type SidecarController } from './sidecar-process.js'
import { SidecarLogger } from './sidecar-logger.js'
import type { SidecarDefinition } from './types.js'

interface ManagerEvents {
  'state-change': (event: SidecarStateChangeEvent) => void
  log: (line: SidecarLogLine) => void
}

export class SidecarManager {
  private readonly controllers = new Map<string, SidecarController>()
  private readonly loggers = new Map<string, SidecarLogger>()
  private readonly emitter = new EventEmitter()

  async register(def: SidecarDefinition): Promise<void> {
    if (this.controllers.has(def.name)) {
      throw new Error(`Sidecar "${def.name}" is already registered`)
    }
    const logger = new SidecarLogger(def.name)
    await logger.init()
    this.loggers.set(def.name, logger)

    const controller = buildController(def, logger, {
      onStateChange: (next, reason) => this.handleStateChange(def.name, next, reason),
      onLog: (stream, line) =>
        this.emitter.emit('log', {
          sidecar: def.name,
          stream,
          line,
          timestamp: new Date().toISOString()
        } satisfies SidecarLogLine)
    })
    this.controllers.set(def.name, controller)
  }

  private prevStates = new Map<string, SidecarState>()

  private handleStateChange(name: string, next: SidecarState, reason?: string): void {
    const prev = this.prevStates.get(name) ?? 'idle'
    this.prevStates.set(name, next)
    this.emitter.emit('state-change', {
      sidecar: name,
      prev,
      next,
      reason
    } satisfies SidecarStateChangeEvent)
  }

  async start(name: string): Promise<void> {
    await this.require(name).start()
  }

  async stop(name: string): Promise<void> {
    await this.require(name).stop()
  }

  async restart(name: string): Promise<void> {
    await this.require(name).restart()
  }

  async startAll(): Promise<void> {
    for (const ctl of this.controllers.values()) {
      await ctl.start()
    }
  }

  async stopAll(): Promise<void> {
    for (const ctl of this.controllers.values()) {
      await ctl.stop()
    }
  }

  list(): SidecarStatus[] {
    return Array.from(this.controllers.values()).map((c) => c.getStatus())
  }

  get(name: string): SidecarStatus | null {
    const ctl = this.controllers.get(name)
    return ctl ? ctl.getStatus() : null
  }

  on<K extends keyof ManagerEvents>(event: K, handler: ManagerEvents[K]): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void)
  }

  off<K extends keyof ManagerEvents>(event: K, handler: ManagerEvents[K]): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void)
  }

  private require(name: string): SidecarController {
    const ctl = this.controllers.get(name)
    if (!ctl) throw new Error(`Unknown sidecar: "${name}"`)
    return ctl
  }
}

let sharedInstance: SidecarManager | null = null

export function getSidecarManager(): SidecarManager {
  if (!sharedInstance) sharedInstance = new SidecarManager()
  return sharedInstance
}
