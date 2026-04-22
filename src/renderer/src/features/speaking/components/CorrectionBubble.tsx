import { useState } from 'react'
import type { TurnCorrection } from '../types'

interface CorrectionBubbleProps {
  correction: TurnCorrection
  /** Optional: the original full sentence, so we can show the fix in context. */
  fullOriginal?: string
}

/**
 * Friendly correction card:
 *   - Big, clear strikethrough on the mistake
 *   - Green replacement right next to it
 *   - One-line plain-English hint
 *   - "Why?" toggle for learners who want the grammar rule
 */
export default function CorrectionBubble({
  correction,
  fullOriginal
}: CorrectionBubbleProps): JSX.Element {
  const [showDetail, setShowDetail] = useState(false)
  const { mistake, replacement, message } = correction

  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 max-w-full">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/30 text-amber-100 text-sm"
          aria-hidden
        >
          ✨
        </span>
        <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider">
          Quick tip
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 text-sm">
        <span className="line-through text-red-300/90 decoration-red-400/70 decoration-[1.5px]">
          {mistake}
        </span>
        {replacement && (
          <>
            <span className="text-amber-200/60" aria-hidden>
              →
            </span>
            <span className="font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {replacement}
            </span>
          </>
        )}
      </div>

      {replacement && fullOriginal && (
        <p className="text-[11px] text-amber-100/70 mb-2">
          Full form: <span className="text-amber-100">{buildFixedSentence(fullOriginal, correction)}</span>
        </p>
      )}

      <button
        onClick={() => setShowDetail((v) => !v)}
        className="text-[11px] text-amber-200 hover:text-amber-100 underline underline-offset-2"
      >
        {showDetail ? 'Hide detail' : 'Why?'}
      </button>

      {showDetail && (
        <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">{message}</p>
      )}
    </div>
  )
}

function buildFixedSentence(original: string, correction: TurnCorrection): string {
  if (!correction.replacement) return original
  const idx = original.indexOf(correction.mistake)
  if (idx < 0) return `${original} (→ ${correction.replacement})`
  return (
    original.slice(0, idx) + correction.replacement + original.slice(idx + correction.mistake.length)
  )
}
