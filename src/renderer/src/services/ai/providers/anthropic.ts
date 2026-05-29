/**
 * Anthropic Messages API — SSE stream of typed events. We translate them to
 * plain text deltas matching the rest of the providers.
 *
 * Note: from the browser, Anthropic requires `anthropic-dangerous-direct-browser-access`.
 * Inside Electron the renderer counts as a browser too.
 */
import type { ChatMessage } from '@shared/types'
import type { AIProviderAdapter, ChatStreamOptions } from '../types'
import { iterateSSE } from '../sse'
import { humanizeAIError } from '../errors'

const API = 'https://api.anthropic.com/v1/messages'
const VERSION = '2023-06-01'

export const anthropicAdapter: AIProviderAdapter = {
  async *chatStream(messages: ChatMessage[], opts: ChatStreamOptions): AsyncIterable<string> {
    // Anthropic separates the system prompt from the chat turns.
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n').trim()
    const turns = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

    const body: Record<string, unknown> = {
      model: opts.model,
      messages: turns,
      stream: true,
      max_tokens: opts.maxTokens ?? 800,
      temperature: opts.temperature ?? 0.7
    }
    if (system) body.system = system

    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': opts.apiKey
      },
      body: JSON.stringify(body),
      signal: opts.signal
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(humanizeAIError('Claude', res.status, text))
    }

    for await (const raw of iterateSSE(res, opts.signal)) {
      let evt: { type?: string; delta?: { type?: string; text?: string } }
      try {
        evt = JSON.parse(raw)
      } catch {
        continue
      }
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
        yield evt.delta.text
      }
    }
  }
}
