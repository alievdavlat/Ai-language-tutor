import { ipcMain } from 'electron'
import { SIDECAR_CHANNELS } from '@shared/ipc'
import { getSidecarManager } from '../services/sidecars/index.js'
import type { IpcRegistrar } from './types.js'

export const registerSidecarIpc: IpcRegistrar = ({ getWindow }) => {
  const manager = getSidecarManager()

  manager.on('state-change', (event) => {
    getWindow()?.webContents.send(SIDECAR_CHANNELS.STATE_CHANGED, event)
  })

  manager.on('log', (line) => {
    getWindow()?.webContents.send(SIDECAR_CHANNELS.LOG, line)
  })

  ipcMain.handle(SIDECAR_CHANNELS.LIST, async () => manager.list())

  ipcMain.handle(SIDECAR_CHANNELS.START, async (_e, name: string) => {
    await manager.start(name)
    return { ok: true }
  })

  ipcMain.handle(SIDECAR_CHANNELS.STOP, async (_e, name: string) => {
    await manager.stop(name)
    return { ok: true }
  })

  ipcMain.handle(SIDECAR_CHANNELS.RESTART, async (_e, name: string) => {
    await manager.restart(name)
    return { ok: true }
  })
}
