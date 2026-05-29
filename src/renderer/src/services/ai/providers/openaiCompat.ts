/**
 * OpenAI-compatible streaming chat — used by 6 of our 8 providers (OpenAI,
 * DeepSeek, Grok, Groq, OpenRouter, and Mistral, which all expose the same
 * /v1/chat/completions shape with SSE deltas).
 */
import type { ChatMessage } from '@shared/types'
import type { AIProviderAdapter, ChatStreamOptions } from '../types'
import { iterateSSE } from '../sse'
import { humanizeAIError } from '../errors'

export interface OpenAICompatConfig {
  /** Full base URL up to /v1 (or wherever the endpoint root sits). */
  baseUrl: string
  /** Optional extra headers (OpenRouter wants HTTP-Referer + X-Title). */
  extraHeaders?: Record<string, string>
  /** Human label for error messages (e.g. "OpenAI", "Groq"). */
  label?: string
}

export function createOpenAICompatAdapter(cfg: OpenAICompatConfig): AIProviderAdapter {
  return {
    async *chatStream(messages: ChatMessage[], opts: ChatStreamOptions): AsyncIterable<string> {
      const url = `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`
      const body = {
        model: opts.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 800
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
          ...cfg.extraHeaders
        },
        body: JSON.stringify(body),
        signal: opts.signal
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(humanizeAIError(cfg.label ?? 'AI provider', res.status, text))
      }
      for await (const raw of iterateSSE(res, opts.signal)) {
        // Each event is a JSON chunk in OpenAI choices[0].delta.content shape.
        let json: { choices?: { delta?: { content?: string } }[] }
        try {
          json = JSON.parse(raw)
        } catch {
          continue
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      }
    }
  }
}
