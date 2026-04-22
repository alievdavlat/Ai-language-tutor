import { ipcRenderer } from 'electron'
import { STT_CHANNELS } from '@shared/ipc'
import type {
  WhisperDownloadProgress,
  WhisperModelStatus,
  WhisperModelTag,
  WhisperTranscription
} from '@shared/types'

export type AudioFormat = 'wav' | 'webm' | 'mp3' | 'ogg'

export interface TranscribePayload {
  modelTag: WhisperModelTag
  audioBase64: string
  audioFormat?: AudioFormat
  language?: string
}

export type TranscribeResponse =
  | { ok: true; result: WhisperTranscription }
  | { ok: false; error: string }

export interface ModelDownloadResponse {
  ok: boolean
  path?: string
  error?: string
}

export interface SttBridge {
  listModels: () => Promise<WhisperModelStatus[]>
  downloadModel: (tag: WhisperModelTag) => Promise<ModelDownloadResponse>
  onDownloadProgress: (listener: (p: WhisperDownloadProgress) => void) => () => void
  transcribe: (payload: TranscribePayload) => Promise<TranscribeResponse>
}

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const wrapped = (_: unknown, payload: T): void => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.off(channel, wrapped)
}

export const sttBridge: SttBridge = {
  listModels: () => ipcRenderer.invoke(STT_CHANNELS.MODELS_LIST),
  downloadModel: (tag) => ipcRenderer.invoke(STT_CHANNELS.MODEL_DOWNLOAD, tag),
  onDownloadProgress: (listener) =>
    subscribe(STT_CHANNELS.MODEL_DOWNLOAD_PROGRESS, listener),
  transcribe: (payload) => ipcRenderer.invoke(STT_CHANNELS.TRANSCRIBE, payload)
}
