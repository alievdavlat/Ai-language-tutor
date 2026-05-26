import { ProgressBar } from '../ui'

interface WhisperLoadingBannerProps {
  progress: number
  error?: string | null
  onFallback?: () => void
}

/**
 * Banner shown while the Whisper speech-recognition model is downloading
 * for the first time. Used on both SpeakingPage and CallPage.
 */
export default function WhisperLoadingBanner({
  progress,
  error,
  onFallback
}: WhisperLoadingBannerProps): JSX.Element {
  return (
    <div className="bg-white/[0.03] border-b border-white/[0.06] px-6 py-3 text-xs text-slate-300">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span>Loading speech recognition — one-time download, cached afterwards.</span>
        <span className="shrink-0 font-semibold text-brand-300">{progress}%</span>
      </div>
      <ProgressBar value={progress} />
      {error && (
        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-red-300">Could not load. Check your internet connection.</span>
          {onFallback && (
            <button
              onClick={onFallback}
              className="underline text-brand-300 hover:text-brand-200 shrink-0"
            >
              Use alternative
            </button>
          )}
        </div>
      )}
    </div>
  )
}
