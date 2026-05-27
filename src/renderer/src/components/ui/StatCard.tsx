import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

export type StatTone = 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky'

const TONE: Record<StatTone, { icon: string; value: string }> = {
  brand: { icon: 'bg-brand-500/15 text-brand-300', value: 'text-brand-200' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-300', value: 'text-emerald-200' },
  amber: { icon: 'bg-amber-500/15 text-amber-300', value: 'text-amber-200' },
  rose: { icon: 'bg-rose-500/15 text-rose-300', value: 'text-rose-200' },
  violet: { icon: 'bg-violet-500/15 text-violet-300', value: 'text-violet-200' },
  sky: { icon: 'bg-sky-500/15 text-sky-300', value: 'text-sky-200' }
}

interface StatCardProps {
  value: ReactNode
  label: string
  icon?: ReactNode
  tone?: StatTone
  className?: string
}

export default function StatCard({
  value,
  label,
  icon,
  tone = 'brand',
  className
}: StatCardProps): JSX.Element {
  const t = TONE[tone]
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/[0.035] border border-white/10 p-4 flex flex-col gap-2',
        className
      )}
    >
      {icon && (
        <span className={cn('inline-flex w-9 h-9 rounded-xl items-center justify-center', t.icon)}>
          <span className="w-[18px] h-[18px] [&>svg]:w-full [&>svg]:h-full">{icon}</span>
        </span>
      )}
      <div>
        <p className={cn('text-2xl font-bold leading-none', t.value)}>{value}</p>
        <p className="text-xs text-slate-400 mt-1.5">{label}</p>
      </div>
    </div>
  )
}
