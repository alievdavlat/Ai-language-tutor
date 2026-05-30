import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { realtimeConfig, realtimeRequirements } from '../../services/realtime'
import { IconLive, IconChevronRight } from '../icons'

/**
 * Honest, dismissible status chip for the live pages. Tells the user whether
 * rooms sync across devices (Supabase Realtime) or only between windows on this
 * machine (BroadcastChannel demo mode), and what env/servers unlock the rest.
 */
export default function RealtimeStatus({ className }: { className?: string }): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const reqs = realtimeRequirements()
  const live = realtimeConfig.crossMachine

  if (reqs.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold px-2.5 py-1',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Realtime connected
      </span>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition',
          live
            ? 'border-emerald-400/25 bg-emerald-500/[0.06] hover:bg-emerald-500/10'
            : 'border-amber-400/25 bg-amber-500/[0.06] hover:bg-amber-500/10'
        )}
      >
        <IconLive className={cn('w-4 h-4 shrink-0', live ? 'text-emerald-300' : 'text-amber-300')} />
        <span className="text-xs font-semibold text-white">
          {live ? 'Live across devices' : 'Demo mode — syncs between windows on this machine'}
        </span>
        <IconChevronRight
          className={cn('w-4 h-4 ml-auto text-slate-400 transition-transform', open && 'rotate-90')}
        />
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          {reqs.map((r, i) => (
            <li key={i} className="text-[11px] leading-relaxed text-slate-400 flex gap-2">
              <span className="text-slate-500 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
          <li className="text-[10px] text-slate-500 pt-1 border-t border-white/[0.06]">
            See <span className="font-mono text-slate-400">docs/REALTIME.md</span> for setup.
          </li>
        </ul>
      )}
    </div>
  )
}
