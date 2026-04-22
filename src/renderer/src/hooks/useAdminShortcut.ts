import { useEffect } from 'react'

/**
 * Phase 2 scaffolding: registers the global admin-mode shortcut.
 * Phase 3 will wire this to a real login modal. For now it only logs the
 * press so we can verify the listener is alive during QA.
 */
export function useAdminShortcut(onTriggered?: () => void): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!e.ctrlKey || !e.shiftKey) return
      if (e.code !== 'KeyA' && e.key?.toLowerCase() !== 'a') return
      e.preventDefault()
      console.info('[admin-shortcut] Ctrl+Shift+A pressed (Phase 3 will show login)')
      onTriggered?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onTriggered])
}
