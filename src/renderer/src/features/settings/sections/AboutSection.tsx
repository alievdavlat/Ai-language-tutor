import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { useUpdateStatus } from '../../../hooks/useUpdateStatus'

/** Maps the updater phase to a friendly line + dot color for the status pill. */
function phaseLabel(
  phase: string,
  newVersion?: string,
  progressPercent?: number
): { text: string; dot: string } {
  switch (phase) {
    case 'checking':
      return { text: 'Checking for updates…', dot: 'bg-amber-400 animate-pulse' }
    case 'available':
      return {
        text:
          progressPercent != null && progressPercent > 0
            ? `Downloading v${newVersion ?? ''} — ${progressPercent}%`
            : `Update available${newVersion ? ` (v${newVersion})` : ''} — downloading…`,
        dot: 'bg-brand-400 animate-pulse'
      }
    case 'downloaded':
      return {
        text: `Update ready${newVersion ? ` (v${newVersion})` : ''} — restart to apply`,
        dot: 'bg-green-400'
      }
    case 'up-to-date':
      return { text: 'Up to date', dot: 'bg-green-400' }
    case 'error':
      return { text: 'Update check failed', dot: 'bg-rose-400' }
    default:
      return { text: 'Not checked yet', dot: 'bg-slate-500' }
  }
}

export default function AboutSection(): JSX.Element {
  const { status, check, checking } = useUpdateStatus()
  const { text, dot } = phaseLabel(status.phase, status.newVersion, status.progressPercent)

  return (
    <Card>
      <h2 className="font-semibold mb-1">About</h2>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        SpeakAI updates itself silently in the background and installs the next version when you
        quit — no prompts, no manual downloads.
      </p>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <dt className="text-slate-400">Version</dt>
        <dd className="font-mono">v{status.currentVersion}</dd>
        <dt className="text-slate-400">Updates</dt>
        <dd className="flex items-center gap-2">
          <span className={cn('inline-block h-2 w-2 rounded-full', dot)} aria-hidden />
          <span>{text}</span>
        </dd>
      </dl>

      {status.phase === 'downloaded' && (
        <p className="text-xs text-green-300/90 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-3 leading-relaxed">
          The new version is downloaded. It installs automatically the next time you close the app.
        </p>
      )}

      {status.phase === 'error' && status.error && (
        <p className="text-xs text-rose-300/80 mb-3 leading-relaxed break-words">{status.error}</p>
      )}

      <button
        type="button"
        onClick={() => void check()}
        disabled={checking || status.phase === 'checking'}
        className={cn(
          'rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition',
          'hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {checking || status.phase === 'checking' ? 'Checking…' : 'Check for updates'}
      </button>
    </Card>
  )
}
