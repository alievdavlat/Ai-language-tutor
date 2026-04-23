import type { ChatMessage } from '@shared/types'
import { ollamaClient } from './client.js'

/**
 * Chat-tuning knobs that keep small CPU-only models snappy:
 *   - `num_predict` caps the response length — on an 8 GB laptop, letting a
 *     1.5B model ramble to its 2048-token default means 20-second waits.
 *   - `num_ctx` keeps the KV cache small; conversational turns rarely need
 *     more than 1 K tokens of history.
 *   - `temperature` slightly lowered for faster, more predictable replies.
 *   - `keep_alive` keeps the model in memory between turns so Ollama doesn't
 *     reload weights every time the user speaks.
 */
const CHAT_OPTIONS = {
  num_predict: 160,
  num_ctx: 1024,
  temperature: 0.7,
  top_p: 0.9
} as const

const KEEP_ALIVE = '10m'

export async function chat(model: string, messages: ChatMessage[]): Promise<string> {
  const res = await ollamaClient.chat({
    model,
    messages,
    stream: false,
    keep_alive: KEEP_ALIVE,
    options: CHAT_OPTIONS
  })
  return res.message.content
}

/**
 * Registry of in-flight streams keyed by caller-supplied id. The Ollama JS
 * client's streaming response is an `AbortableAsyncIterator` — calling
 * `.abort()` on it terminates the underlying HTTP connection immediately, so
 * the model actually stops generating (instead of running in the background
 * for 5–10 s after the user barges in).
 */
type Abortable = { abort: () => void }
const activeStreams = new Map<string, Abortable>()

export async function* chatStream(
  id: string,
  model: string,
  messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const stream = await ollamaClient.chat({
    model,
    messages,
    stream: true,
    keep_alive: KEEP_ALIVE,
    options: CHAT_OPTIONS
  })
  activeStreams.set(id, stream as unknown as Abortable)
  try {
    for await (const chunk of stream) {
      yield chunk.message.content
    }
  } finally {
    activeStreams.delete(id)
  }
}

export function abortChatStream(id: string): boolean {
  const stream = activeStreams.get(id)
  if (!stream) return false
  try {
    stream.abort()
  } catch {
    // ignore — iterator may have already completed
  }
  activeStreams.delete(id)
  return true
}
