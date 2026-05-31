import { cn } from '../../lib/classnames'

export interface OptionCard<T extends string> {
  value: T
  label: string
  sub?: string
}

interface OptionCardsProps<T extends string> {
  options: readonly OptionCard<T>[]
  value: T
  onChange: (value: T) => void
  /** Tailwind grid columns class, e.g. "grid-cols-3". Default auto-flow row. */
  columnsClassName?: string
  className?: string
}

/**
 * Card-style single-select (pricing model, source kind, …). Each option shows a
 * bold label + optional sub-line; the chosen one gets the brand highlight.
 * Used where a chip is too small to carry an explanation. (#A58)
 */
export default function OptionCards<T extends string>({
  options,
  value,
  onChange,
  columnsClassName = 'grid-cols-2 sm:grid-cols-3',
  className
}: OptionCardsProps<T>): JSX.Element {
  return (
    <div className={cn('grid gap-2', columnsClassName, className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-xl border p-3 text-left transition',
            value === o.value
              ? 'border-brand-400/40 bg-brand-500/10'
              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
          )}
        >
          <p className="text-sm font-bold text-white">{o.label}</p>
          {o.sub && <p className="text-[11px] text-slate-400 mt-0.5">{o.sub}</p>}
        </button>
      ))}
    </div>
  )
}
