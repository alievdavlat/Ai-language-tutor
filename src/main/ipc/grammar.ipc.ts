import { ipcMain } from 'electron'
import { GRAMMAR_CHANNELS } from '@shared/ipc'
import { checkGrammar } from '../services/grammar/index.js'
import type { IpcRegistrar } from './types.js'

export const registerGrammarIpc: IpcRegistrar = () => {
  ipcMain.handle(GRAMMAR_CHANNELS.CHECK, async (_e, text: string) => checkGrammar(text))
}
