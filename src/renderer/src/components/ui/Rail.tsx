import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

interface RailProps {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled horizontal-scroll row of cards. Children set their own width (shrink-0). */
export default function Rail({ title, action, children, className }: RailProps): JSX.Element {
  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        {action}
      </div>
      <div
        className={cn(
          'flex gap-4 overflow-x-auto pb-2 -mx-6 px-6',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x'
        )}
      >
        {children}
      </div>
    </section>
  )
}
