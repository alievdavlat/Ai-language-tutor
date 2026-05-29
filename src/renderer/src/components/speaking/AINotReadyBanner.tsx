import { Link } from 'react-router-dom'

/**
 * Slim banner shown when no cloud AI provider is configured. Points the user at
 * Settings → AI where they can plug in a free cloud key in 30 seconds.
 */
export default function AINotReadyBanner(): JSX.Element {
  return (
    <div className="bg-brand-500/10 border-b border-brand-400/20 px-6 py-2.5 text-xs text-brand-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shrink-0" />
        <span className="truncate">Connect a cloud AI to start chatting — Gemini's free tier works, no card needed.</span>
      </div>
      <Link to="/settings" className="shrink-0 underline hover:text-white">Open Settings →</Link>
    </div>
  )
}
