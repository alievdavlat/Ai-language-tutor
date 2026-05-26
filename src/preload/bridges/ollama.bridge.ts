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
  start: () => Promise<{ running: boolean; status: OllamaStatus }>
  pull: (tag: string) => Promise<{ ok: boolean }>
  autoPull: (tag: string) => Promise<{ ok: boolean; error?: string }>
  onPullProgress: (listener: (p: PullProgressPayload) => void) => () => void
  onAutoPullProgress: (listener: (p: PullProgressPayload) => void) => () => void
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
  start: () => ipcRenderer.invoke(OLLAMA_CHANNELS.START),
  pull: (tag) => ipcRenderer.invoke(OLLAMA_CHANNELS.PULL, tag),
  autoPull: (tag) => ipcRenderer.invoke(OLLAMA_CHANNELS.AUTO_PULL, tag),
  onPullProgress: (listener) => subscribe(OLLAMA_CHANNELS.PULL_PROGRESS, listener),
  onAutoPullProgress: (listener) => subscribe(OLLAMA_CHANNELS.AUTO_PULL_PROGRESS, listener),
  chatStream: (payload) => ipcRenderer.invoke(OLLAMA_CHANNELS.CHAT_STREAM, payload),
  chatStreamAbort: (id) => ipcRenderer.invoke(OLLAMA_CHANNELS.CHAT_STREAM_ABORT, id),
  onChatStreamChunk: (listener) => subscribe(OLLAMA_CHANNELS.CHAT_STREAM_CHUNK, listener)
}
