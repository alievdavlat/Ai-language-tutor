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

export async function* chatStream(
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
  for await (const chunk of stream) {
    yield chunk.message.content
  }
}
