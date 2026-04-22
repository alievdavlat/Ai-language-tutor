import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/classnames'

export type GradientTone = 'speak' | 'vocab' | 'grammar' | 'listen' | 'read' | 'write' | 'brand'

const TONE_CLASSES: Record<GradientTone, string> = {
  brand: 'bg-grad-brand shadow-glow',
  speak: 'bg-grad-speak shadow-glow-speak',
  vocab: 'bg-grad-vocab shadow-glow-vocab',
  grammar: 'bg-grad-grammar shadow-glow-grammar',
  listen: 'bg-grad-listen shadow-glow-listen',
  read: 'bg-gradient-to-br from-read-500 to-read-600',
  write: 'bg-gradient-to-br from-write-500 to-write-600'
}

interface GradientCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: GradientTone
  children: ReactNode
}

export default function GradientCard({
  tone = 'brand',
  children,
  className,
  ...rest
}: GradientCardProps): JSX.Element {
  return (
    <div
      {...rest}
      className={cn(
        'relative overflow-hidden rounded-card ring-1 ring-white/15 text-white p-6',
        TONE_CLASSES[tone],
        className
      )}
    >
      {/* Soft top-left sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-60 h-60 rounded-full bg-white/20 blur-3xl"
      />
      <div className="relative">{children}</div>
    </div>
  )
}
