import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, ChatStreamChunk } from '@shared/types'
import { createId } from '../lib/ids'
import { useAppStore } from '../store/useAppStore'
import { getProvider, type AIProviderId } from '@shared/constants'
import { chatStream as cloudChatStream } from '../services/ai/router'

interface PendingStream {
  full: string
  resolve: (value: string) => void
  onDelta?: (delta: string, full: string) => void
  /** Set only for cloud streams — gives us a way to cancel mid-stream. */
  abort?: AbortController
}

interface ChatStreamController {
  streaming: boolean
  error: string | null
  send: (
    messages: ChatMessage[],
    onDelta?: (delta: string, full: string) => void
  ) => Promise<string>
  /** Cancel every in-flight LLM stream. Used for barge-in and page teardown. */
  abort: () => void
}

/**
 * Hybrid chat-stream hook. When the user has configured a cloud AI provider
 * (Settings → AI), every send routes through fetch-based SSE. Otherwise we
 * fall back to the existing Ollama IPC path so local users still work.
 */
export function useChatStream(model: string): ChatStreamController {
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef<Map<string, PendingStream>>(new Map())

  // Read the active AI selection from the store. We compute it inside `send` so
  // each call uses the freshest token, but subscribe here to trigger re-renders
  // when the user activates an AI from Settings.
  const aiConfig = useAppStore((s) => s.profile?.settings.ai)

  useEffect(() => {
    const unsub = window.api.ollama.onChatStreamChunk((chunk: ChatStreamChunk) => {
      const handle = pendingRef.current.get(chunk.id)
      if (!handle) return
      if (chunk.error) setError(chunk.error)
      if (chunk.delta) {
        handle.full += chunk.delta
        handle.onDelta?.(chunk.delta, handle.full)
      }
      if (chunk.done) {
        pendingRef.current.delete(chunk.id)
        if (pendingRef.current.size === 0) setStreaming(false)
        handle.resolve(handle.full)
      }
    })
    return () => {
      unsub()
    }
  }, [])

  const send = useCallback(
    (messages: ChatMessage[], onDelta?: (delta: string, full: string) => void) => {
      const id = createId('chat')
      setStreaming(true)
      setError(null)

      // Snapshot active AI at the moment of the call so a settings change
      // mid-stream doesn't switch providers underneath us.
      const activeProviderId = aiConfig?.activeProviderId as AIProviderId | undefined
      const token = activeProviderId ? aiConfig?.tokens?.[activeProviderId] : undefined
      const provider = activeProviderId ? getProvider(activeProviderId) : undefined
      const cloudModel = activeProviderId ? aiConfig?.models?.[activeProviderId] : undefined
      const useCloud = !!(provider && token && cloudModel)

      return new Promise<string>((resolve) => {
        if (useCloud) {
          const ac = new AbortController()
          const handle: PendingStream = { full: '', resolve, onDelta, abort: ac }
          pendingRef.current.set(id, handle)
          ;(async (): Promise<void> => {
            try {
              for await (const delta of cloudChatStream(messages, {
                provider: activeProviderId!,
                model: cloudModel!,
                apiKey: token!,
                signal: ac.signal
              })) {
                if (ac.signal.aborted) break
                if (!delta) continue
                handle.full += delta
                handle.onDelta?.(delta, handle.full)
              }
            } catch (err) {
              if (ac.signal.aborted) return // user cancelled; not an error
              const message = err instanceof Error ? err.message : String(err)
              setError(message)
            } finally {
              if (pendingRef.current.has(id)) {
                pendingRef.current.delete(id)
                if (pendingRef.current.size === 0) setStreaming(false)
                resolve(handle.full)
              }
            }
          })()
          return
        }

        // Local Ollama path — unchanged.
        pendingRef.current.set(id, { full: '', resolve, onDelta })
        window.api.ollama.chatStream({ id, model, messages }).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
          pendingRef.current.delete(id)
          if (pendingRef.current.size === 0) setStreaming(false)
          resolve('')
        })
      })
    },
    [model, aiConfig]
  )

  const abort = useCallback(() => {
    const ids = Array.from(pendingRef.current.keys())
    if (ids.length === 0) return
    for (const id of ids) {
      const handle = pendingRef.current.get(id)
      if (!handle) continue
      // Cloud path — abort the fetch.
      if (handle.abort) handle.abort.abort()
      handle.resolve(handle.full)
      pendingRef.current.delete(id)
      // Ollama path — best-effort cancel on the main side.
      if (!handle.abort) {
        void window.api.ollama.chatStreamAbort(id).catch(() => {
          // already finished on the main side
        })
      }
    }
    setStreaming(false)
  }, [])

  return { streaming, error, send, abort }
}
