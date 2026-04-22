import { ipcMain } from 'electron'
import { PROFILE_CHANNELS } from '@shared/ipc'
import type { UserProfile } from '@shared/types'
import {
  createDefaultProfile,
  loadProfile,
  resetProfile,
  saveProfile
} from '../services/profile/index.js'
import type { IpcRegistrar } from './types.js'

export const registerProfileIpc: IpcRegistrar = () => {
  ipcMain.handle(PROFILE_CHANNELS.LOAD, async () => (await loadProfile()) ?? null)

  ipcMain.handle(PROFILE_CHANNELS.SAVE, async (_e, profile: UserProfile) => {
    await saveProfile(profile)
    return { ok: true }
  })

  ipcMain.handle(PROFILE_CHANNELS.RESET, async () => {
    await resetProfile()
    return createDefaultProfile()
  })
}
