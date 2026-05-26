import { cn } from '../../../lib/classnames'

interface DailyProgressCardProps {
  current: number
  goal: number
}

const RING_R = 46
const RING_CIRC = 2 * Math.PI * RING_R  // ≈ 289

export default function DailyProgressCard({
  current,
  goal
}: DailyProgressCardProps): JSX.Element {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0
  const offset = RING_CIRC * (1 - pct)
  const done = pct >= 1

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5">
      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-4">
        Daily goal
      </p>

      <div className="flex items-center gap-4">
        {/* SVG progress ring */}
        <div className="relative shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke={done ? '#34d399' : 'url(#dg)'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
              <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-xl font-bold leading-none', done ? 'text-emerald-400' : 'text-white')}>
              {current}
            </span>
            <span className="text-[10px] text-slate-500 leading-none mt-0.5">/ {goal}</span>
          </div>
        </div>

        {/* Text info */}
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold', done ? 'text-emerald-400' : 'text-slate-200')}>
            {done ? '✓ Goal reached!' : `${goal - current} min left`}
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {done
              ? 'Great job today!'
              : 'Keep going — you\'re building a habit.'}
          </p>
        </div>
      </div>
    </div>
  )
}
