import { useCallback, useEffect, useState } from 'react'
import type { UpdateStatus } from '@shared/types'

const FALLBACK_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.1'

const INITIAL: UpdateStatus = { phase: 'idle', currentVersion: FALLBACK_VERSION }

type UpdateApi = {
  status: () => Promise<UpdateStatus>
  check: () => Promise<UpdateStatus>
  onChange: (cb: (s: UpdateStatus) => void) => () => void
}

function getApi(): UpdateApi | undefined {
  return (window as unknown as { api?: { update?: UpdateApi } }).api?.update
}

/**
 * Subscribes to the silent auto-updater (#43). Reads the current status on
 * mount and live-updates as the background download progresses. Never blocks —
 * the install happens on app quit regardless of what the UI shows.
 */
export function useUpdateStatus(): {
  status: UpdateStatus
  check: () => Promise<void>
  checking: boolean
} {
  const [status, setStatus] = useState<UpdateStatus>(INITIAL)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const api = getApi()
    if (!api) return
    let alive = true
    void api.status().then((s) => {
      if (alive) setStatus(s)
    })
    const unsub = api.onChange((s) => setStatus(s))
    return () => {
      alive = false
      unsub()
    }
  }, [])

  const check = useCallback(async () => {
    const api = getApi()
    if (!api) return
    setChecking(true)
    try {
      const s = await api.check()
      setStatus(s)
    } finally {
      setChecking(false)
    }
  }, [])

  return { status, check, checking }
}
