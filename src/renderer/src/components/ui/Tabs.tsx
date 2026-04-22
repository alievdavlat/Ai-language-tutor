import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

export interface TabItem<T extends string> {
  id: T
  label: string
  icon?: ReactNode
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  active: T
  onChange: (id: T) => void
  className?: string
}

export default function Tabs<T extends string>({
  items,
  active,
  onChange,
  className
}: TabsProps<T>): JSX.Element {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-pill bg-white/[0.04] border border-white/10',
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'px-4 py-1.5 rounded-pill text-sm font-medium transition',
              isActive
                ? 'bg-white/10 text-white shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {item.icon && <span className="mr-1.5">{item.icon}</span>}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
