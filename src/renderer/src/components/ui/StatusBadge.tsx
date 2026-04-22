import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

type Tone = 'green' | 'amber' | 'red' | 'slate'

interface StatusBadgeProps {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  className?: string
}

const TONE_CLASSES: Record<Tone, string> = {
  green: 'text-green-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  slate: 'text-slate-400'
}

export default function StatusBadge({
  tone = 'slate',
  children,
  dot = true,
  className
}: StatusBadgeProps): JSX.Element {
  return (
    <span className={cn('text-xs font-semibold', TONE_CLASSES[tone], className)}>
      {dot && <span aria-hidden>● </span>}
      {children}
    </span>
  )
}
