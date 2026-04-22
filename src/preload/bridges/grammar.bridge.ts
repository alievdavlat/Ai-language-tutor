import { ipcRenderer } from 'electron'
import { GRAMMAR_CHANNELS } from '@shared/ipc'
import type { GrammarResult } from '@shared/types'

export interface GrammarBridge {
  check: (text: string) => Promise<GrammarResult>
}

export const grammarBridge: GrammarBridge = {
  check: (text) => ipcRenderer.invoke(GRAMMAR_CHANNELS.CHECK, text)
}
