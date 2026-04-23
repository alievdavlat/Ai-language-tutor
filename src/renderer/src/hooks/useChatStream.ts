import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, ChatStreamChunk } from '@shared/types'
import { createId } from '../lib/ids'

interface PendingStream {
  full: string
  resolve: (value: string) => void
  onDelta?: (delta: string, full: string) => void
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

export function useChatStream(model: string): ChatStreamController {
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef<Map<string, PendingStream>>(new Map())

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
      return new Promise<string>((resolve) => {
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
    [model]
  )

  const abort = useCallback(() => {
    // Snapshot the ids so we resolve + delete without mutating mid-iteration.
    const ids = Array.from(pendingRef.current.keys())
    if (ids.length === 0) return
    for (const id of ids) {
      const handle = pendingRef.current.get(id)
      if (handle) handle.resolve(handle.full) // resolve with partial text
      pendingRef.current.delete(id)
      void window.api.ollama.chatStreamAbort(id).catch(() => {
        // best-effort — main side may have already finished the stream
      })
    }
    setStreaming(false)
  }, [])

  return { streaming, error, send, abort }
}
