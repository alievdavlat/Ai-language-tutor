import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { audioCacheDir } from '../../utils/paths.js'

export async function writeAudioBufferToTempFile(
  buffer: ArrayBuffer,
  extension: 'wav' | 'webm' | 'mp3' | 'ogg' = 'wav'
): Promise<string> {
  const dir = audioCacheDir()
  await fs.mkdir(dir, { recursive: true })
  const fileName = `stt-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`
  const target = path.join(dir, fileName)
  await fs.writeFile(target, Buffer.from(buffer))
  return target
}

export async function deleteTempAudio(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch {
    // best-effort cleanup
  }
}
