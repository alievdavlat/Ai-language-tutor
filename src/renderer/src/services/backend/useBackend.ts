import { useEffect, useState } from 'react'
import { backend } from './index'

/**
 * Tiny suspense-less hook for reading from the backend. Re-fetches when the
 * deps change. Loading/error are kept simple — pages show inline shells.
 */
export function useBackendQuery<T>(
  fn: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
  initial: T
): { data: T; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fn()
      .then((r) => { if (!cancelled) setData(r) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, refresh: () => setTick((t) => t + 1) }
}

export { backend }
