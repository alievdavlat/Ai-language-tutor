import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/classnames'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  children: ReactNode
}

export default function Chip({
  selected = false,
  className,
  children,
  ...rest
}: ChipProps): JSX.Element {
  return (
    <button
      aria-pressed={selected}
      {...rest}
      className={cn(
        'inline-flex items-center gap-2 rounded-pill px-3.5 py-2 text-sm font-semibold',
        'cursor-pointer select-none transition',
        !selected &&
          'bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08] hover:text-white',
        selected &&
          'bg-grad-brand text-white border border-brand-300/50 shadow-glow ring-2 ring-brand-400/30',
        className
      )}
    >
      {selected && (
        <span
          aria-hidden
          className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
        />
      )}
      {children}
    </button>
  )
}
