import { cn } from '../../lib/classnames'

interface ProgressBarProps {
  value: number // 0..100
  className?: string
  color?: 'brand' | 'green' | 'amber'
}

const COLOR_CLASSES: Record<NonNullable<ProgressBarProps['color']>, string> = {
  brand: 'bg-brand-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500'
}

export default function ProgressBar({
  value,
  className,
  color = 'brand'
}: ProgressBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-white/5 overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all duration-200', COLOR_CLASSES[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
