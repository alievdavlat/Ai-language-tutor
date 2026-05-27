import { cn } from '../../lib/classnames'
import { IconCheck } from '../icons'

export type DayState = 'done' | 'today' | 'future' | 'missed'

export interface StudyDay {
  label: string
  state: DayState
}

interface WeekStudyTrackerProps {
  days: StudyDay[]
  className?: string
}

function DayDot({ state }: { state: DayState }): JSX.Element {
  if (state === 'done') {
    return (
      <span className="w-9 h-9 rounded-full bg-grad-brand flex items-center justify-center shadow-glow-sm">
        <IconCheck className="w-4 h-4 text-white" />
      </span>
    )
  }
  if (state === 'today') {
    return (
      <span className="w-9 h-9 rounded-full ring-2 ring-brand-400 bg-brand-500/10 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-brand-300 animate-pulse" />
      </span>
    )
  }
  if (state === 'missed') {
    return <span className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.02]" />
  }
  return <span className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.06]" />
}

export default function WeekStudyTracker({ days, className }: WeekStudyTrackerProps): JSX.Element {
  return (
    <div className={cn('flex items-end justify-between', className)}>
      {days.map((d, i) => (
        <div key={`${d.label}-${i}`} className="flex flex-col items-center gap-2">
          <span
            className={cn(
              'text-[11px] font-medium',
              d.state === 'today' ? 'text-brand-300' : 'text-slate-500'
            )}
          >
            {d.label}
          </span>
          <DayDot state={d.state} />
        </div>
      ))}
    </div>
  )
}
