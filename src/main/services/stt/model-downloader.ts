import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import type { WhisperDownloadProgress, WhisperModelTag } from '@shared/types'
import { whisperModelFileName, whisperModelUrl } from '@shared/constants'
import { whisperModelPath } from '../../utils/paths.js'
import { ensureModelDir } from './model-registry.js'

export type DownloadProgressListener = (progress: WhisperDownloadProgress) => void

interface ProgressStreamOptions {
  tag: WhisperModelTag
  total: number
  onProgress?: DownloadProgressListener
}

function createProgressStream(source: Readable, opts: ProgressStreamOptions): Readable {
  let received = 0
  source.on('data', (chunk: Buffer) => {
    received += chunk.byteLength
    const pct = opts.total > 0 ? Math.round((received / opts.total) * 100) : 0
    opts.onProgress?.({
      tag: opts.tag,
      phase: 'downloading',
      bytesDownloaded: received,
      bytesTotal: opts.total,
      pct
    })
  })
  return source
}

export async function downloadWhisperModel(
  tag: WhisperModelTag,
  onProgress?: DownloadProgressListener
): Promise<string> {
  await ensureModelDir()
  const url = whisperModelUrl(tag)
  const destPath = whisperModelPath(whisperModelFileName(tag))

  onProgress?.({
    tag,
    phase: 'starting',
    bytesDownloaded: 0,
    bytesTotal: 0,
    pct: 0
  })

  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: HTTP ${res.status}`)
  }

  const totalHeader = res.headers.get('content-length')
  const total = totalHeader ? parseInt(totalHeader, 10) : 0

  const nodeStream = Readable.fromWeb(res.body as NodeReadableStream<Uint8Array>)
  const tagged = createProgressStream(nodeStream, { tag, total, onProgress })

  const tmp = destPath + '.part'
  await pipeline(tagged, createWriteStream(tmp))
  await fs.rename(tmp, destPath)

  onProgress?.({
    tag,
    phase: 'done',
    bytesDownloaded: total,
    bytesTotal: total,
    pct: 100
  })

  return destPath
}
