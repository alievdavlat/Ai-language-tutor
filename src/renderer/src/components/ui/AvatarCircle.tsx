import { cn } from '../../lib/classnames'

interface AvatarCircleProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<AvatarCircleProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base'
}

function initialsFor(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export default function AvatarCircle({
  name,
  size = 'md',
  className
}: AvatarCircleProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-full bg-grad-brand text-white font-bold flex items-center justify-center',
        'shadow-glow ring-2 ring-white/10',
        SIZE_CLASSES[size],
        className
      )}
      aria-label={name ?? 'user'}
    >
      {initialsFor(name)}
    </div>
  )
}
