import { ipcMain } from 'electron'
import { OLLAMA_CHANNELS } from '@shared/ipc'
import type { ChatStreamChunk, ChatStreamRequest } from '@shared/types'
import { chatStream, getOllamaStatus, pullModel } from '../services/ollama/index.js'
import type { IpcRegistrar } from './types.js'

export const registerOllamaIpc: IpcRegistrar = ({ getWindow }) => {
  ipcMain.handle(OLLAMA_CHANNELS.STATUS, async () => getOllamaStatus())

  ipcMain.handle(OLLAMA_CHANNELS.PULL, async (_e, tag: string) => {
    await pullModel(tag, (status, pct) => {
      getWindow()?.webContents.send(OLLAMA_CHANNELS.PULL_PROGRESS, { tag, status, pct })
    })
    return { ok: true }
  })

  ipcMain.handle(OLLAMA_CHANNELS.CHAT_STREAM, async (_e, payload: ChatStreamRequest) => {
    const win = getWindow()
    const emit = (chunk: ChatStreamChunk): void => {
      win?.webContents.send(OLLAMA_CHANNELS.CHAT_STREAM_CHUNK, chunk)
    }

    try {
      for await (const delta of chatStream(payload.model, payload.messages)) {
        emit({ id: payload.id, delta, done: false })
      }
      emit({ id: payload.id, delta: '', done: true })
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      emit({ id: payload.id, delta: '', done: true, error: message })
      return { ok: false, error: message }
    }
  })
}
