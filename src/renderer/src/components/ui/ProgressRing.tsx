import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

export type RingTone = 'brand' | 'vocab' | 'grammar' | 'listen' | 'read' | 'write'

const TONE_STROKE: Record<RingTone, string> = {
  brand: '#3b82f6',
  vocab: '#10b981',
  grammar: '#f43f5e',
  listen: '#f59e0b',
  read: '#0ea5e9',
  write: '#a855f7'
}

interface ProgressRingProps {
  /** 0–100 */
  value: number
  size?: number
  stroke?: number
  tone?: RingTone
  className?: string
  children?: ReactNode
}

export default function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  tone = 'brand',
  className,
  children
}: ProgressRingProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}
