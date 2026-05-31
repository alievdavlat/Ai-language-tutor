import { ipcMain } from 'electron'
import { DESKTOP_CHANNELS } from '@shared/ipc'
import type { DesktopSettings } from '@shared/types'
import { getDesktopSettings, updateDesktopSettings } from '../services/desktop/index.js'
import type { IpcRegistrar } from './types.js'

export const registerDesktopIpc: IpcRegistrar = () => {
  ipcMain.handle(DESKTOP_CHANNELS.GET_SETTINGS, async () => getDesktopSettings())
  ipcMain.handle(
    DESKTOP_CHANNELS.SET_SETTINGS,
    async (_e, patch: Partial<DesktopSettings>) => updateDesktopSettings(patch)
  )
}
