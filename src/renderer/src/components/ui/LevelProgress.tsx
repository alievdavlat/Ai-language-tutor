import type { CEFRLevel } from '@shared/types'
import { CEFR_ORDER } from '@shared/types'
import Card from './Card'

interface LevelProgressProps {
  current: CEFRLevel
  /** 0..1 progress within the current level towards the next one. */
  progress?: number
}

function nextLevel(level: CEFRLevel): CEFRLevel | null {
  const i = CEFR_ORDER.indexOf(level)
  if (i < 0 || i === CEFR_ORDER.length - 1) return null
  return CEFR_ORDER[i + 1]
}

export default function LevelProgress({
  current,
  progress = 0.25
}: LevelProgressProps): JSX.Element {
  const next = nextLevel(current)
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title !mb-1">Your level</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{current}</span>
            {next && <span className="text-sm text-slate-400">→ {next}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">{pct}%</div>
          <div className="text-xs text-slate-500">to {next ?? 'mastery'}</div>
        </div>
      </div>

      <div className="relative h-2 rounded-pill bg-white/5 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-grad-brand rounded-pill"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-y-0 -translate-x-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
          style={{ left: `${pct}%` }}
        />
      </div>

      <div className="flex gap-1 text-[10px] text-slate-500 justify-between">
        {CEFR_ORDER.map((l) => (
          <span
            key={l}
            className={l === current ? 'text-brand-300 font-semibold' : undefined}
          >
            {l}
          </span>
        ))}
      </div>
    </Card>
  )
}
