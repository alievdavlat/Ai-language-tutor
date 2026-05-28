/**
 * Server-Sent-Events line iterator for `fetch`-backed streams. Yields one raw
 * `data: …` JSON string per event, exiting at `[DONE]`. Shared by every
 * OpenAI-compatible adapter (OpenAI, DeepSeek, Grok, Groq, OpenRouter, Mistral).
 */
export async function* iterateSSE(response: Response, signal?: AbortSignal): AsyncIterable<string> {
  if (!response.body) throw new Error('No response body to stream')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      if (signal?.aborted) return
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // SSE events are separated by blank lines (\n\n). We tolerate \r\n\r\n too.
      let idx: number
      while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const block = buffer.slice(0, idx)
        buffer = buffer.slice(idx).replace(/^\r?\n\r?\n/, '')
        for (const line of block.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue // comment / heartbeat
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') return
          if (payload) yield payload
        }
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // already released
    }
  }
}

/**
 * Newline-delimited-JSON iterator (Anthropic-style streaming and some others).
 * Each yielded item is a raw JSON string from one event.
 */
export async function* iterateNDJSON(response: Response, signal?: AbortSignal): AsyncIterable<string> {
  if (!response.body) throw new Error('No response body to stream')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      if (signal?.aborted) return
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx: number
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)
        if (!line) continue
        yield line
      }
    }
    const tail = buffer.trim()
    if (tail) yield tail
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // already released
    }
  }
}
