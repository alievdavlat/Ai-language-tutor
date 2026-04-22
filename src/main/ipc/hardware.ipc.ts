import { ipcMain } from 'electron'
import { HARDWARE_CHANNELS } from '@shared/ipc'
import { detectHardware, recommendModels } from '../services/hardware/index.js'
import type { IpcRegistrar } from './types.js'

export const registerHardwareIpc: IpcRegistrar = () => {
  ipcMain.handle(HARDWARE_CHANNELS.DETECT, async () => detectHardware())

  ipcMain.handle(HARDWARE_CHANNELS.RECOMMEND, async () => {
    const hw = await detectHardware()
    return { hw, rec: recommendModels(hw) }
  })
}
