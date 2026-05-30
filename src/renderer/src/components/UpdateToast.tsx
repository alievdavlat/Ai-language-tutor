import { useEffect, useState } from 'react'
import { useUpdateStatus } from '../hooks/useUpdateStatus'
import { cn } from '../lib/classnames'

/**
 * Subtle, non-blocking toast (#43). Appears once the silent background download
 * finishes (`phase === 'downloaded'`) to let the user know the new version will
 * apply on next quit. Dismissible; never interrupts what they're doing.
 */
export default function UpdateToast(): JSX.Element | null {
  const { status } = useUpdateStatus()
  const [dismissed, setDismissed] = useState(false)

  // Re-show if a newer version is staged after a previous dismissal.
  useEffect(() => {
    if (status.phase === 'downloaded') setDismissed(false)
  }, [status.phase, status.newVersion])

  if (status.phase !== 'downloaded' || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-fade-in">
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border border-green-500/25 bg-canvas-raised/95',
          'shadow-card backdrop-blur px-4 py-3 max-w-xs'
        )}
      >
        <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-green-400" aria-hidden />
        <div className="flex-1">
          <div className="text-sm font-semibold">
            Update ready{status.newVersion ? ` · v${status.newVersion}` : ''}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            It installs automatically the next time you close SpeakAI.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
