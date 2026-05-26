/**
 * Slim banner shown when the local AI is not yet ready.
 * User-friendly — no "Ollama" or model-tag terminology.
 */
export default function AINotReadyBanner(): JSX.Element {
  return (
    <div className="bg-brand-500/10 border-b border-brand-400/20 px-6 py-2.5 text-xs text-brand-200 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shrink-0" />
      <span>AI is starting up — this takes a moment on first launch.</span>
    </div>
  )
}
