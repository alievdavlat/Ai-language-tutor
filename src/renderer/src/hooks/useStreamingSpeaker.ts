import { useCallback, useRef } from 'react'
import { extractSentences, finalizeBuffer } from '../lib/sentences'

interface StreamingSpeakerDeps {
  /** Speak one sentence. Resolves when playback finishes. */
  speak: (text: string) => Promise<void>
  /** Cancel any currently-playing utterance. */
  cancel: () => void
}

export interface StreamingSpeaker {
  /** Feed a streamed token from the LLM. Chunks into sentences internally. */
  feedDelta: (delta: string) => void
  /** Flush the trailing buffer and wait until every chunk finishes speaking. */
  flushAndWait: () => Promise<void>
  /** Hard stop — clears buffer, drops queued chunks, cancels current utterance. */
  cancel: () => void
  /** True while at least one chunk is queued or playing. */
  isActive: () => boolean
}

/**
 * Wrap a TTS controller so the LLM's streamed output can be spoken sentence-
 * by-sentence instead of waiting for the full reply. The queue preserves
 * order (each speak() awaits the previous one), so sentences never overlap.
 *
 * A single cancel() wipes the pending queue, the unspoken buffer, and any
 * currently-playing utterance — used for barge-in and route teardown.
 */
export function useStreamingSpeaker(deps: StreamingSpeakerDeps): StreamingSpeaker {
  const bufferRef = useRef('')
  const chainRef = useRef<Promise<void>>(Promise.resolve())
  // `generation` guards against late promise resolutions after a cancel().
  // Every cancel() bumps it; any in-flight chain check ignores themselves
  // if their generation is stale.
  const genRef = useRef(0)
  const pendingRef = useRef(0)
  const depsRef = useRef(deps)
  depsRef.current = deps

  const enqueue = useCallback((sentence: string) => {
    if (!sentence.trim()) return
    const myGen = genRef.current
    pendingRef.current++
    chainRef.current = chainRef.current.then(async () => {
      if (myGen !== genRef.current) return
      try {
        await depsRef.current.speak(sentence)
      } catch (err) {
        console.error('[streaming-speaker] speak failed', err)
      } finally {
        pendingRef.current = Math.max(0, pendingRef.current - 1)
      }
    })
  }, [])

  const feedDelta = useCallback((delta: string) => {
    if (!delta) return
    bufferRef.current += delta
    const { complete, remainder } = extractSentences(bufferRef.current)
    if (complete.length > 0) {
      bufferRef.current = remainder
      for (const sentence of complete) enqueue(sentence)
    }
  }, [enqueue])

  const flushAndWait = useCallback(async () => {
    const tail = finalizeBuffer(bufferRef.current)
    bufferRef.current = ''
    if (tail) enqueue(tail)
    await chainRef.current
  }, [enqueue])

  const cancel = useCallback(() => {
    genRef.current++
    bufferRef.current = ''
    pendingRef.current = 0
    chainRef.current = Promise.resolve()
    depsRef.current.cancel()
  }, [])

  const isActive = useCallback(() => pendingRef.current > 0, [])

  return { feedDelta, flushAndWait, cancel, isActive }
}
