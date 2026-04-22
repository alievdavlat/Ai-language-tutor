import { ollamaClient } from './client.js'

export type PullProgressListener = (status: string, pct?: number) => void

export async function pullModel(tag: string, onProgress?: PullProgressListener): Promise<void> {
  const stream = await ollamaClient.pull({ model: tag, stream: true })
  for await (const chunk of stream) {
    const pct =
      typeof chunk.total === 'number' && typeof chunk.completed === 'number' && chunk.total > 0
        ? Math.round((chunk.completed / chunk.total) * 100)
        : undefined
    onProgress?.(chunk.status, pct)
  }
}
