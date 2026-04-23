import type { ChatMessage } from '@shared/types'
import { ollamaClient } from './client.js'

/**
 * Chat-tuning knobs that keep small CPU-only models snappy AND make the
 * replies feel like a Pi-AI / luvea voice companion, not a textbook:
 *   - `num_predict: 90` — Pi-style replies are 1-2 sentences. Hard-capping
 *     tokens lets even a 1.5B model answer in 2-3s on CPU instead of 10+.
 *   - `num_ctx: 1024` — conversational turns rarely need more history and a
 *     bigger KV cache is what OOMs 8 GB machines.
 *   - `temperature: 0.85` — slightly warmer than the old 0.7 so short replies
 *     don't all collapse onto the same few phrasings. Pi-AI feel = varied.
 *   - `top_p: 0.95` — room for natural spoken-English fillers ("honestly",
 *     "yeah", "mm") without going off the rails.
 *   - `repeat_penalty: 1.15` — small models on short replies love repeating
 *     the learner's exact phrase back. Penalise that mildly.
 *   - `stop` tokens — cut off anything that looks like a list prefix or a
 *     second paragraph so the reply stays voice-shaped.
 *   - `keep_alive` keeps the model in memory between turns so Ollama doesn't
 *     reload weights every time the user speaks.
 */
const CHAT_OPTIONS = {
  num_predict: 90,
  num_ctx: 1024,
  temperature: 0.85,
  top_p: 0.95,
  repeat_penalty: 1.15,
  // Cut off anything that looks like a list prefix or a second paragraph so
  // the reply stays voice-shaped. Mutable array — Ollama SDK types require it.
  stop: ['\n\n', '\n- ', '\n* ', '\n1.', '\n2.']
}

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
