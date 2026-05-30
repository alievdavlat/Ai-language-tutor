import { cn } from '../../lib/classnames'

interface AvatarCircleProps {
  name?: string
  /** Profile image (data: or remote URL). Falls back to initials when unset. */
  src?: string
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
  src,
  size = 'md',
  className
}: AvatarCircleProps): JSX.Element {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'user'}
        className={cn('rounded-full object-cover ring-2 ring-white/10 shadow-glow', SIZE_CLASSES[size], className)}
      />
    )
  }
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
