/**
 * Google Gemini — uses the `streamGenerateContent` endpoint with SSE.
 * The API key goes in the URL query (`?key=…`), not in a header.
 */
import type { ChatMessage } from '@shared/types'
import type { AIProviderAdapter, ChatStreamOptions } from '../types'
import { iterateSSE } from '../sse'
import { humanizeAIError } from '../errors'

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiCandidate {
  content?: { parts?: { text?: string }[] }
}

interface GeminiChunk {
  candidates?: GeminiCandidate[]
}

export const geminiAdapter: AIProviderAdapter = {
  async *chatStream(messages: ChatMessage[], opts: ChatStreamOptions): AsyncIterable<string> {
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n').trim()
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 800
      }
    }
    if (system) body.systemInstruction = { parts: [{ text: system }] }

    const url = `${BASE}/${encodeURIComponent(opts.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(opts.apiKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(humanizeAIError('Gemini', res.status, text))
    }

    for await (const raw of iterateSSE(res, opts.signal)) {
      let json: GeminiChunk
      try {
        json = JSON.parse(raw)
      } catch {
        continue
      }
      for (const cand of json.candidates ?? []) {
        for (const part of cand.content?.parts ?? []) {
          if (part.text) yield part.text
        }
      }
    }
  }
}
