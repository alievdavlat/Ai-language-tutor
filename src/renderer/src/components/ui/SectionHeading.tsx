import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

interface SectionHeadingProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}

export default function SectionHeading({
  title,
  subtitle,
  action,
  className
}: SectionHeadingProps): JSX.Element {
  return (
    <div className={cn('flex items-end justify-between gap-3 mb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
