import type { BrowserWindow } from 'electron'

/** All IPC registrars take this context so they can emit events back to the window. */
export interface IpcContext {
  getWindow: () => BrowserWindow | null
}

export type IpcRegistrar = (ctx: IpcContext) => void
