import { ipcRenderer } from 'electron'
import { PLACEMENT_CHANNELS } from '@shared/ipc'
import type {
  PlacementAnswer,
  PlacementQuestion,
  PlacementResult
} from '@shared/types'

export interface PlacementBridge {
  generate: () => Promise<PlacementQuestion[]>
  evaluate: (payload: { model: string; answers: PlacementAnswer[] }) => Promise<PlacementResult>
}

export const placementBridge: PlacementBridge = {
  generate: () => ipcRenderer.invoke(PLACEMENT_CHANNELS.GENERATE),
  evaluate: (payload) => ipcRenderer.invoke(PLACEMENT_CHANNELS.EVALUATE, payload)
}
