import { ipcMain } from 'electron'
import { UPDATE_CHANNELS } from '@shared/ipc'
import { checkForUpdatesNow, getUpdateStatus, initAutoUpdater } from '../services/updater/index.js'
import type { IpcRegistrar } from './types.js'

export const registerUpdateIpc: IpcRegistrar = (ctx) => {
  // Start the background updater (production-only check happens inside).
  initAutoUpdater(ctx.getWindow)

  ipcMain.handle(UPDATE_CHANNELS.STATUS, async () => getUpdateStatus())
  ipcMain.handle(UPDATE_CHANNELS.CHECK, async () => checkForUpdatesNow())
}
