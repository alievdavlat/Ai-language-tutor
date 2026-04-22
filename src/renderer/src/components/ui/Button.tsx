import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/classnames'

type Variant = 'primary' | 'ghost' | 'danger' | 'record'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-400 active:bg-brand-600',
  ghost: 'bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10',
  danger: 'bg-white/5 text-red-200 hover:bg-red-500/10 border border-red-400/40',
  record: 'bg-red-500 text-white animate-pulse'
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold',
        'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className
      )}
    />
  )
}
