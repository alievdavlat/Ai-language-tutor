import fs from 'node:fs'
import fsp from 'node:fs/promises'
import type { WhisperModelStatus, WhisperModelTag } from '@shared/types'
import { WHISPER_MODELS, whisperModelFileName } from '@shared/constants'
import { whisperModelPath, whisperModelsDir } from '../../utils/paths.js'

export function listModels(): WhisperModelStatus[] {
  return (Object.keys(WHISPER_MODELS) as WhisperModelTag[]).map((tag) => {
    const fileName = whisperModelFileName(tag)
    const path = whisperModelPath(fileName)
    const installed = fs.existsSync(path)
    let sizeBytes = 0
    if (installed) {
      try {
        sizeBytes = fs.statSync(path).size
      } catch {
        sizeBytes = 0
      }
    }
    return { tag, installed, path: installed ? path : null, sizeBytes }
  })
}

export async function deleteModel(tag: WhisperModelTag): Promise<void> {
  const p = whisperModelPath(whisperModelFileName(tag))
  try {
    await fsp.unlink(p)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
}

export async function ensureModelDir(): Promise<void> {
  await fsp.mkdir(whisperModelsDir(), { recursive: true })
}
