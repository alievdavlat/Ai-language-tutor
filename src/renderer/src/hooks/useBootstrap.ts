import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useBootstrap(): void {
  const bootstrap = useAppStore((state) => state.bootstrap)
  useEffect(() => {
    bootstrap().catch((err) => {
      console.error('[bootstrap]', err)
    })
  }, [bootstrap])
}
