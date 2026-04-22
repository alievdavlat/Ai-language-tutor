import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

interface OllamaModelsController {
  installed: string[]
  running: boolean
  refresh: () => Promise<void>
  pull: (tag: string) => Promise<{ ok: boolean }>
  pullProgress: Record<string, { status: string; pct?: number }>
}

/**
 * Thin wrapper around the Ollama bridge that exposes installed model tags
 * and tracks pull progress per tag for the Settings UI.
 */
export function useOllamaModels(): OllamaModelsController {
  const ollama = useAppStore((s) => s.ollama)
  const refreshOllama = useAppStore((s) => s.refreshOllama)
  const [pullProgress, setPullProgress] = useState<
    Record<string, { status: string; pct?: number }>
  >({})

  useEffect(() => {
    const unsub = window.api.ollama.onPullProgress(({ tag, status, pct }) => {
      setPullProgress((prev) => ({ ...prev, [tag]: { status, pct } }))
    })
    return () => {
      unsub()
    }
  }, [])

  const pull = useCallback(
    async (tag: string): Promise<{ ok: boolean }> => {
      setPullProgress((prev) => ({ ...prev, [tag]: { status: 'starting', pct: 0 } }))
      try {
        await window.api.ollama.pull(tag)
        setPullProgress((prev) => {
          const next = { ...prev }
          delete next[tag]
          return next
        })
        await refreshOllama()
        return { ok: true }
      } catch {
        return { ok: false }
      }
    },
    [refreshOllama]
  )

  return {
    installed: ollama?.models ?? [],
    running: !!ollama?.running,
    refresh: refreshOllama,
    pull,
    pullProgress
  }
}
