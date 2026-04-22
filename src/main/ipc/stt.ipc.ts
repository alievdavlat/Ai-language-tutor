import { ipcMain } from 'electron'
import { STT_CHANNELS } from '@shared/ipc'
import type { WhisperModelTag } from '@shared/types'
import {
  deleteTempAudio,
  downloadWhisperModel,
  listModels,
  transcribeAudioFile,
  writeAudioBufferToTempFile
} from '../services/stt/index.js'
import type { IpcRegistrar } from './types.js'

interface TranscribePayload {
  modelTag: WhisperModelTag
  audioBase64: string
  audioFormat?: 'wav' | 'webm' | 'mp3' | 'ogg'
  language?: string
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bytes = Buffer.from(b64, 'base64')
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export const registerSttIpc: IpcRegistrar = ({ getWindow }) => {
  ipcMain.handle(STT_CHANNELS.MODELS_LIST, async () => listModels())

  ipcMain.handle(STT_CHANNELS.MODEL_DOWNLOAD, async (_e, tag: WhisperModelTag) => {
    const win = getWindow()
    try {
      const path = await downloadWhisperModel(tag, (progress) => {
        win?.webContents.send(STT_CHANNELS.MODEL_DOWNLOAD_PROGRESS, progress)
      })
      return { ok: true, path }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      win?.webContents.send(STT_CHANNELS.MODEL_DOWNLOAD_PROGRESS, {
        tag,
        phase: 'error',
        bytesDownloaded: 0,
        bytesTotal: 0,
        pct: 0,
        error: message
      })
      return { ok: false, error: message }
    }
  })

  ipcMain.handle(STT_CHANNELS.TRANSCRIBE, async (_e, payload: TranscribePayload) => {
    const buf = base64ToArrayBuffer(payload.audioBase64)
    const filePath = await writeAudioBufferToTempFile(buf, payload.audioFormat ?? 'wav')
    try {
      const result = await transcribeAudioFile({
        modelTag: payload.modelTag,
        audioFilePath: filePath,
        language: payload.language
      })
      return { ok: true, result }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, error: message }
    } finally {
      await deleteTempAudio(filePath)
    }
  })
}
