/**
 * Common surface for every cloud AI provider. Each adapter implements
 * `chatStream` — an async iterable that yields plain text deltas. The router
 * (./router.ts) picks one based on the active provider in user settings.
 */
import type { ChatMessage } from '@shared/types'

export interface ChatStreamOptions {
  /** Provider-specific model id (e.g. "gemini-2.5-flash"). */
  model: string
  /** Bearer / API key for the provider. */
  apiKey: string
  /** AbortSignal — the router wires this from the UI's barge-in. */
  signal?: AbortSignal
  /** 0–1, default 0.7 — used by every provider that supports it. */
  temperature?: number
  /** Hard cap on response tokens, default ~800. */
  maxTokens?: number
}

export interface AIProviderAdapter {
  /** Yields text deltas. The consumer (useChatStream) accumulates them. */
  chatStream(messages: ChatMessage[], opts: ChatStreamOptions): AsyncIterable<string>
}
