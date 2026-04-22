import { useCallback, useEffect, useState } from 'react'
import type { SidecarStatus } from '@shared/types'

interface SidecarsController {
  sidecars: SidecarStatus[]
  refresh: () => Promise<void>
  start: (name: string) => Promise<void>
  stop: (name: string) => Promise<void>
  restart: (name: string) => Promise<void>
}

export function useSidecars(): SidecarsController {
  const [sidecars, setSidecars] = useState<SidecarStatus[]>([])

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const list = await window.api.sidecars.list()
      setSidecars(list)
    } catch (err) {
      console.error('[useSidecars] refresh failed', err)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const unsubState = window.api.sidecars.onStateChange(() => {
      void refresh()
    })
    const interval = window.setInterval(() => void refresh(), 10_000)
    return () => {
      unsubState()
      window.clearInterval(interval)
    }
  }, [refresh])

  const start = useCallback(
    async (name: string): Promise<void> => {
      await window.api.sidecars.start(name)
      await refresh()
    },
    [refresh]
  )

  const stop = useCallback(
    async (name: string): Promise<void> => {
      await window.api.sidecars.stop(name)
      await refresh()
    },
    [refresh]
  )

  const restart = useCallback(
    async (name: string): Promise<void> => {
      await window.api.sidecars.restart(name)
      await refresh()
    },
    [refresh]
  )

  return { sidecars, refresh, start, stop, restart }
}
