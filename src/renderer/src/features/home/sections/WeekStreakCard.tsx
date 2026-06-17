import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

function getTodayIndex(): number {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1  // Mo=0 … Su=6
}

interface WeekStreakCardProps {
  streak: number
  /** Indices 0-6 (Mo=0) of days this week where user practiced. Phase 8 will populate. */
  practisedDays?: number[]
}

export default function WeekStreakCard({
  streak,
  practisedDays = []
}: WeekStreakCardProps): JSX.Element {
  const t = useT()
  const todayIdx = getTodayIndex()
  const practisedSet = new Set(practisedDays)

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
          {t('home.thisWeek')}
        </p>
        <div className="flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-400/20 px-3 py-1">
          <span className="text-sm">🔥</span>
          <span className="text-sm font-bold text-orange-300">{streak}</span>
          <span className="text-xs text-orange-400/70">
            {streak === 1 ? t('home.day') : t('home.days')}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 justify-between">
        {DAYS.map((day, i) => {
          const isToday = i === todayIdx
          const done = practisedSet.has(i)
          const isPast = i < todayIdx

          return (
            <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isToday ? 'text-brand-400' : 'text-slate-500'
                )}
              >
                {day}
              </span>
              <div
                className={cn(
                  'w-full aspect-square max-w-[34px] rounded-full flex items-center justify-center text-[11px] transition-all duration-300',
                  done
                    ? 'bg-brand-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] text-white font-bold'
                    : isToday
                      ? 'bg-white/[0.06] ring-2 ring-brand-400/60 text-brand-400'
                      : isPast
                        ? 'bg-white/[0.03] ring-1 ring-white/[0.08] text-slate-600 opacity-60'
                        : 'bg-white/[0.03] ring-1 ring-white/[0.08]'
                )}
              >
                {done ? '✓' : isToday ? '·' : null}
              </div>
            </div>
          )
        })}
      </div>

      {streak === 0 && (
        <p className="text-xs text-slate-600 mt-3 text-center">
          {t('home.practiceToStreak')}
        </p>
      )}
    </div>
  )
}
