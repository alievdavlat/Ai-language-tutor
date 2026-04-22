import { ipcMain } from 'electron'
import { PLACEMENT_CHANNELS } from '@shared/ipc'
import type { PlacementAnswer } from '@shared/types'
import { evaluatePlacement, staticPlacementBank } from '../services/placement/index.js'
import type { IpcRegistrar } from './types.js'

interface EvaluatePayload {
  model: string
  answers: PlacementAnswer[]
}

export const registerPlacementIpc: IpcRegistrar = () => {
  ipcMain.handle(PLACEMENT_CHANNELS.GENERATE, async () => staticPlacementBank())

  ipcMain.handle(PLACEMENT_CHANNELS.EVALUATE, async (_e, payload: EvaluatePayload) => {
    const questions = staticPlacementBank()
    return evaluatePlacement(payload.model, questions, payload.answers)
  })
}
