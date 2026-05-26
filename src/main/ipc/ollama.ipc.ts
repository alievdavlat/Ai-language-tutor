import { ipcMain } from 'electron'
import { OLLAMA_CHANNELS } from '@shared/ipc'
import type { ChatStreamChunk, ChatStreamRequest } from '@shared/types'
import {
  abortChatStream,
  chatStream,
  ensureOllamaRunning,
  getOllamaStatus,
  pullModel
} from '../services/ollama/index.js'
import type { IpcRegistrar } from './types.js'

export const registerOllamaIpc: IpcRegistrar = ({ getWindow }) => {
  ipcMain.handle(OLLAMA_CHANNELS.STATUS, async () => getOllamaStatus())

  // Auto-start: tries to launch Ollama if installed but not running.
  ipcMain.handle(OLLAMA_CHANNELS.START, async () => {
    const running = await ensureOllamaRunning()
    const status = await getOllamaStatus()
    return { running, status }
  })

  ipcMain.handle(OLLAMA_CHANNELS.PULL, async (_e, tag: string) => {
    await pullModel(tag, (status, pct) => {
      getWindow()?.webContents.send(OLLAMA_CHANNELS.PULL_PROGRESS, { tag, status, pct })
    })
    return { ok: true }
  })

  // Auto-pull: pull the recommended model in the background (called from bootstrap).
  ipcMain.handle(OLLAMA_CHANNELS.AUTO_PULL, async (_e, tag: string) => {
    try {
      await pullModel(tag, (status, pct) => {
        getWindow()?.webContents.send(OLLAMA_CHANNELS.AUTO_PULL_PROGRESS, { tag, status, pct })
      })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle(OLLAMA_CHANNELS.CHAT_STREAM, async (_e, payload: ChatStreamRequest) => {
    const win = getWindow()
    const emit = (chunk: ChatStreamChunk): void => {
      win?.webContents.send(OLLAMA_CHANNELS.CHAT_STREAM_CHUNK, chunk)
    }

    try {
      for await (const delta of chatStream(payload.id, payload.model, payload.messages)) {
        emit({ id: payload.id, delta, done: false })
      }
      emit({ id: payload.id, delta: '', done: true })
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const aborted = err instanceof Error && (err.name === 'AbortError' || /abort/i.test(message))
      emit({
        id: payload.id,
        delta: '',
        done: true,
        error: aborted ? undefined : message,
        aborted: aborted || undefined
      })
      return aborted ? { ok: true, aborted: true } : { ok: false, error: message }
    }
  })

  ipcMain.handle(OLLAMA_CHANNELS.CHAT_STREAM_ABORT, async (_e, id: string) => {
    return { aborted: abortChatStream(id) }
  })
}
