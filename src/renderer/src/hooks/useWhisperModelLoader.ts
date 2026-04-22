import { useCallback, useEffect, useState } from 'react'
import type { WhisperModelTag } from '@shared/types'
import {
  isPipelineLoaded,
  loadWhisperPipeline,
  subscribeWhisperProgress,
  type WhisperProgressEvent
} from '../lib/whisper-client'

interface LoaderState {
  loaded: boolean
  loading: boolean
  progress: number // 0..1
  status: string
  error: string | null
}

interface LoaderController extends LoaderState {
  load: () => Promise<void>
}

function initialState(tag: WhisperModelTag): LoaderState {
  const ready = isPipelineLoaded(tag)
  return {
    loaded: ready,
    loading: false,
    progress: ready ? 1 : 0,
    status: ready ? 'ready' : '',
    error: null
  }
}

/**
 * Tracks the on-demand load of the active Whisper pipeline. transformers.js
 * caches weights in IndexedDB, so subsequent loads are instant.
 * Progress comes via the shared listener in `whisper-client` — this is the
 * single source of truth, no matter which hook triggered the actual load.
 */
export function useWhisperModelLoader(tag: WhisperModelTag): LoaderController {
  const [state, setState] = useState<LoaderState>(() => initialState(tag))

  useEffect(() => {
    setState(initialState(tag))
  }, [tag])

  useEffect(() => {
    const unsub = subscribeWhisperProgress((event: WhisperProgressEvent) => {
      setState((prev) => {
        const next = { ...prev, status: event.status }

        if (event.status === 'starting') {
          next.loading = true
          next.progress = 0
          next.error = null
        } else if (event.status === 'downloading' || event.status === 'progress') {
          next.loading = true
          if (typeof event.progress === 'number') {
            next.progress = Math.min(1, event.progress / 100)
          }
        } else if (event.status === 'ready' || event.status === 'done') {
          next.loading = false
          next.loaded = true
          next.progress = 1
        } else if (event.status === 'error') {
          next.loading = false
          next.error = event.error ?? 'load failed'
        }

        return next
      })
    })
    return unsub
  }, [])

  const load = useCallback(async (): Promise<void> => {
    if (state.loading) return
    try {
      await loadWhisperPipeline(tag)
    } catch {
      // error is already surfaced via the shared listener
    }
  }, [tag, state.loading])

  return { ...state, load }
}
