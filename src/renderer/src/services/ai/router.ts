/**
 * Single entry point for cloud chat-completion. Picks the adapter that matches
 * the active provider in user settings and forwards the stream.
 *
 * The router intentionally returns nothing on its own — it throws if no AI is
 * configured. Callers should gate on `useActiveAI()` before invoking it (the
 * UI already shows a "configure AI" banner when none is set up).
 */
import type { AIProviderId } from '@shared/constants'
import type { ChatMessage } from '@shared/types'
import type { AIProviderAdapter, ChatStreamOptions } from './types'
import { geminiAdapter } from './providers/gemini'
import { anthropicAdapter } from './providers/anthropic'
import { createOpenAICompatAdapter } from './providers/openaiCompat'

const openAI = createOpenAICompatAdapter({ baseUrl: 'https://api.openai.com/v1', label: 'OpenAI' })
const deepseek = createOpenAICompatAdapter({ baseUrl: 'https://api.deepseek.com/v1', label: 'DeepSeek' })
const grok = createOpenAICompatAdapter({ baseUrl: 'https://api.x.ai/v1', label: 'Grok' })
const groq = createOpenAICompatAdapter({ baseUrl: 'https://api.groq.com/openai/v1', label: 'Groq' })
const mistral = createOpenAICompatAdapter({ baseUrl: 'https://api.mistral.ai/v1', label: 'Mistral' })
const openRouter = createOpenAICompatAdapter({
  baseUrl: 'https://openrouter.ai/api/v1',
  label: 'OpenRouter',
  extraHeaders: {
    // OpenRouter uses these for analytics + safe-listing.
    'HTTP-Referer': 'https://speakai.app',
    'X-Title': 'SpeakAI'
  }
})

const ADAPTERS: Record<AIProviderId, AIProviderAdapter> = {
  gemini: geminiAdapter,
  claude: anthropicAdapter,
  openai: openAI,
  deepseek,
  grok,
  groq,
  mistral,
  openrouter: openRouter
}

export interface RouteOptions extends Omit<ChatStreamOptions, 'apiKey' | 'model'> {
  provider: AIProviderId
  model: string
  apiKey: string
}

export function chatStream(messages: ChatMessage[], opts: RouteOptions): AsyncIterable<string> {
  const adapter = ADAPTERS[opts.provider]
  if (!adapter) throw new Error(`No adapter for provider "${opts.provider}"`)
  return adapter.chatStream(messages, opts)
}

export { ADAPTERS }
