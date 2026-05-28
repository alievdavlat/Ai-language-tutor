import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsAIReady } from '../../lib/ai'
import { IconLock } from '../icons'
import { cn } from '../../lib/classnames'

interface AIGateProps {
  /** What feature is being gated, surfaced in the lock-screen copy. */
  featureName: string
  /** Optional sub-line of copy. */
  description?: string
  /** Children render only when an AI provider is configured. */
  children: ReactNode
  /** If true, render the gate as a full-page lockscreen instead of a section card. */
  fullscreen?: boolean
}

/**
 * Wraps any AI-dependent feature with a lock screen when no provider is
 * configured. Tap-through CTA jumps to Settings → AI.
 */
export default function AIGate({ featureName, description, children, fullscreen }: AIGateProps): JSX.Element {
  const ready = useIsAIReady()
  const navigate = useNavigate()
  if (ready) return <>{children}</>

  return (
    <div className={cn('flex items-center justify-center p-8', fullscreen ? 'h-full' : 'min-h-[60vh]')}>
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 max-w-md text-center flex flex-col items-center gap-4">
        <span className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
          <IconLock className="w-8 h-8" />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">{featureName} is locked</h2>
          <p className="text-sm text-slate-400 mt-2">
            {description ?? `${featureName} needs a cloud AI to work.`}
            {' '}Pick a provider in <b className="text-white">Settings → AI</b> — many have a free tier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/settings')} className="btn-primary px-6 py-2.5 text-sm">
            Configure AI →
          </button>
          <button onClick={() => navigate(-1)} className="btn-ghost px-4 py-2.5 text-sm">Back</button>
        </div>
        <p className="text-[11px] text-slate-500">
          Free options: Gemini · Groq · Mistral · OpenRouter
        </p>
      </div>
    </div>
  )
}
