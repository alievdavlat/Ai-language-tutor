import type { ReactNode } from 'react'

interface PageHeaderProps {
  left?: ReactNode
  title: string
  subtitle?: ReactNode
  right?: ReactNode
}

export default function PageHeader({
  left,
  title,
  subtitle,
  right
}: PageHeaderProps): JSX.Element {
  return (
    <header className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {left}
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  )
}
