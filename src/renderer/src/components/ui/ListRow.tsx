import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

interface ListRowProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  className?: string
}

export default function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className
}: ListRowProps): JSX.Element {
  const interactive = !!onClick
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3',
        interactive && 'cursor-pointer transition hover:bg-white/[0.06] hover:border-white/15',
        className
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 flex items-center gap-1.5">{trailing}</div>}
    </div>
  )
}
