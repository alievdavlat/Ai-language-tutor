import { useCallback, useEffect, useState } from 'react'
import type { WhisperDownloadProgress, WhisperModelStatus, WhisperModelTag } from '@shared/types'

interface WhisperModelsController {
  models: WhisperModelStatus[]
  progress: Record<string, WhisperDownloadProgress>
  refresh: () => Promise<void>
  download: (tag: WhisperModelTag) => Promise<{ ok: boolean; error?: string }>
}

export function useWhisperModels(): WhisperModelsController {
  const [models, setModels] = useState<WhisperModelStatus[]>([])
  const [progress, setProgress] = useState<Record<string, WhisperDownloadProgress>>({})

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const list = await window.api.stt.listModels()
      setModels(list)
    } catch (err) {
      console.error('[useWhisperModels] refresh failed', err)
    }
  }, [])

  const download = useCallback(
    async (tag: WhisperModelTag): Promise<{ ok: boolean; error?: string }> => {
      const result = await window.api.stt.downloadModel(tag)
      await refresh()
      return result
    },
    [refresh]
  )

  useEffect(() => {
    void refresh()
    const unsub = window.api.stt.onDownloadProgress((payload) => {
      setProgress((prev) => ({ ...prev, [payload.tag]: payload }))
      if (payload.phase === 'done' || payload.phase === 'error') {
        void refresh()
      }
    })
    return () => {
      unsub()
    }
  }, [refresh])

  return { models, progress, refresh, download }
}
