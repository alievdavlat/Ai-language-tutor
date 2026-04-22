import { ipcRenderer } from 'electron'
import { HARDWARE_CHANNELS } from '@shared/ipc'
import type { HardwareProfile, ModelRecommendation } from '@shared/types'

export interface HardwareBridge {
  detect: () => Promise<HardwareProfile>
  recommend: () => Promise<{ hw: HardwareProfile; rec: ModelRecommendation }>
}

export const hardwareBridge: HardwareBridge = {
  detect: () => ipcRenderer.invoke(HARDWARE_CHANNELS.DETECT),
  recommend: () => ipcRenderer.invoke(HARDWARE_CHANNELS.RECOMMEND)
}
