import { cn } from '../../lib/classnames'

export interface PillOption<T extends string> {
  value: T
  label: string
}

interface PillGroupProps<T extends string> {
  options: readonly PillOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * Inline pill single-select (exam family, story kind, exercise format, …).
 * Mirrors the LevelSelect chip styling for a consistent authoring look. (#A58)
 */
export default function PillGroup<T extends string>({
  options,
  value,
  onChange,
  className
}: PillGroupProps<T>): JSX.Element {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-pill border px-3 py-1.5 text-xs font-bold transition',
            value === o.value
              ? 'border-brand-400 bg-brand-500/15 text-white'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
