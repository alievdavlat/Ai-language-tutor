import { ipcRenderer } from 'electron'
import { OLLAMA_CHANNELS } from '@shared/ipc'
import type { ChatStreamChunk, ChatStreamRequest, OllamaStatus } from '@shared/types'

export interface PullProgressPayload {
  tag: string
  status: string
  pct?: number
}

export interface OllamaBridge {
  status: () => Promise<OllamaStatus>
  pull: (tag: string) => Promise<{ ok: boolean }>
  onPullProgress: (listener: (p: PullProgressPayload) => void) => () => void
  chatStream: (
    payload: ChatStreamRequest
  ) => Promise<{ ok: boolean; error?: string; aborted?: boolean }>
  chatStreamAbort: (id: string) => Promise<{ aborted: boolean }>
  onChatStreamChunk: (listener: (chunk: ChatStreamChunk) => void) => () => void
}

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const wrapped = (_: unknown, payload: T): void => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.off(channel, wrapped)
}

export const ollamaBridge: OllamaBridge = {
  status: () => ipcRenderer.invoke(OLLAMA_CHANNELS.STATUS),
  pull: (tag) => ipcRenderer.invoke(OLLAMA_CHANNELS.PULL, tag),
  onPullProgress: (listener) => subscribe(OLLAMA_CHANNELS.PULL_PROGRESS, listener),
  chatStream: (payload) => ipcRenderer.invoke(OLLAMA_CHANNELS.CHAT_STREAM, payload),
  chatStreamAbort: (id) => ipcRenderer.invoke(OLLAMA_CHANNELS.CHAT_STREAM_ABORT, id),
  onChatStreamChunk: (listener) => subscribe(OLLAMA_CHANNELS.CHAT_STREAM_CHUNK, listener)
}
