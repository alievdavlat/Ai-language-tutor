import { cn } from '../../lib/classnames'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4'
}

export default function Spinner({ size = 'md', className }: SpinnerProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-full border-brand-500/30 border-t-brand-400 animate-spin',
        SIZE_CLASSES[size],
        className
      )}
    />
  )
}
