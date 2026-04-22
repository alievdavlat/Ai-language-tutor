import { ipcRenderer } from 'electron'
import { PROFILE_CHANNELS } from '@shared/ipc'
import type { UserProfile } from '@shared/types'

export interface ProfileBridge {
  load: () => Promise<UserProfile | null>
  save: (profile: UserProfile) => Promise<{ ok: boolean }>
  reset: () => Promise<UserProfile>
}

export const profileBridge: ProfileBridge = {
  load: () => ipcRenderer.invoke(PROFILE_CHANNELS.LOAD),
  save: (profile) => ipcRenderer.invoke(PROFILE_CHANNELS.SAVE, profile),
  reset: () => ipcRenderer.invoke(PROFILE_CHANNELS.RESET)
}
