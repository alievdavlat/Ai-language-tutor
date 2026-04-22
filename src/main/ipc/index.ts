import { registerGrammarIpc } from './grammar.ipc.js'
import { registerHardwareIpc } from './hardware.ipc.js'
import { registerOllamaIpc } from './ollama.ipc.js'
import { registerPlacementIpc } from './placement.ipc.js'
import { registerProfileIpc } from './profile.ipc.js'
import { registerSidecarIpc } from './sidecars.ipc.js'
import { registerSttIpc } from './stt.ipc.js'
import type { IpcContext } from './types.js'

export function registerAllIpcHandlers(ctx: IpcContext): void {
  registerHardwareIpc(ctx)
  registerOllamaIpc(ctx)
  registerProfileIpc(ctx)
  registerPlacementIpc(ctx)
  registerGrammarIpc(ctx)
  registerSttIpc(ctx)
  registerSidecarIpc(ctx)
}

export type { IpcContext } from './types.js'
