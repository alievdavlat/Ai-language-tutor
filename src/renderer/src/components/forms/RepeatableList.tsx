import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'
import { IconPlus, IconX } from '../icons'

interface RepeatableListProps<T> {
  items: T[]
  onChange: (items: T[]) => void
  /** Factory for a fresh blank item when "Add" is pressed. */
  create: () => T
  /**
   * Render a single item's editor. `update` shallow-merges a patch into the item;
   * `set` replaces it wholesale (handy for nested arrays).
   */
  render: (args: {
    item: T
    index: number
    update: (patch: Partial<T>) => void
    set: (next: T) => void
  }) => ReactNode
  addLabel: string
  /** Minimum items that must remain (remove is hidden below this). Default 0. */
  min?: number
  /** Maximum items (Add hides at the cap). */
  max?: number
  /** Show ▲▼ reorder controls. Default true. */
  reorder?: boolean
  /** Show the "1.", "2." index badge. Default true. */
  numbered?: boolean
  /** Extra classes on each item card. */
  itemClassName?: string
  className?: string
}

/**
 * Configurable repeatable-item input — the building block behind every list in
 * the authoring forms (units, lessons, exam sections + questions + options,
 * story parts, comprehension questions, exercise items, …). Handles add /
 * remove / reorder / per-item update generically so editors only describe one
 * row. (#A58 shared form library.)
 */
export default function RepeatableList<T>({
  items,
  onChange,
  create,
  render,
  addLabel,
  min = 0,
  max,
  reorder = true,
  numbered = true,
  itemClassName,
  className
}: RepeatableListProps<T>): JSX.Element {
  const update = (i: number, patch: Partial<T>): void =>
    onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const set = (i: number, next: T): void => onChange(items.map((x, j) => (j === i ? next : x)))
  const remove = (i: number): void => onChange(items.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1): void => {
    const t = i + dir
    if (t < 0 || t >= items.length) return
    const next = [...items]
    ;[next[i], next[t]] = [next[t], next[i]]
    onChange(next)
  }
  const canAdd = max === undefined || items.length < max

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            'rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex items-start gap-2',
            itemClassName
          )}
        >
          {reorder && (
            <div className="flex flex-col pt-1 shrink-0">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-slate-500 hover:text-brand-300 disabled:opacity-30 leading-none"
                title="Move up"
              >▲</button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="text-slate-500 hover:text-brand-300 disabled:opacity-30 leading-none"
                title="Move down"
              >▼</button>
            </div>
          )}
          {numbered && (
            <span className="w-6 h-6 mt-0.5 rounded-full bg-white/[0.06] text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
              {i + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            {render({ item, index: i, update: (patch) => update(i, patch), set: (next) => set(i, next) })}
          </div>
          {items.length > min && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-slate-500 hover:text-rose-300 shrink-0 mt-0.5"
              title="Remove"
            >
              <IconX className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={() => onChange([...items, create()])}
          className="text-xs font-bold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1 self-start"
        >
          <IconPlus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      )}
    </div>
  )
}
