import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

export type IconBubbleTone = 'speak' | 'vocab' | 'grammar' | 'listen' | 'read' | 'write' | 'brand'

const TONE_BG: Record<IconBubbleTone, string> = {
  brand: 'bg-grad-brand shadow-glow',
  speak: 'bg-grad-speak shadow-glow-speak',
  vocab: 'bg-grad-vocab shadow-glow-vocab',
  grammar: 'bg-grad-grammar shadow-glow-grammar',
  listen: 'bg-grad-listen shadow-glow-listen',
  read: 'bg-gradient-to-br from-read-500 to-read-600',
  write: 'bg-gradient-to-br from-write-500 to-write-600'
}

interface IconBubbleProps {
  tone?: IconBubbleTone
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-sm rounded-xl',
  md: 'w-11 h-11 text-lg rounded-2xl',
  lg: 'w-14 h-14 text-2xl rounded-2xl'
} as const

export default function IconBubble({
  tone = 'brand',
  size = 'md',
  children,
  className
}: IconBubbleProps): JSX.Element {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center text-white ring-1 ring-white/10',
        TONE_BG[tone],
        SIZE_CLASSES[size],
        className
      )}
    >
      {children}
    </div>
  )
}
