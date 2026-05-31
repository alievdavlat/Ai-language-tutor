import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { useLevels } from '../../services/levels/store'

interface LevelSelectProps {
  value: string
  onChange: (code: string) => void
  /** Prepend an "All" sentinel (for filters). */
  allowAll?: boolean
  /** Allow adding a custom level inline (authoring). Default true. */
  allowCustom?: boolean
  className?: string
}

/**
 * Shared level picker backed by the dynamic level registry (services/levels).
 * Replaces the hardcoded A1–C2 arrays everywhere — and lets teachers/admins add
 * a custom level (e.g. "Pre-beginner") inline, fixing the "can't make Beginner"
 * gap. (2026-05-31)
 */
export default function LevelSelect({ value, onChange, allowAll, allowCustom = true, className }: LevelSelectProps): JSX.Element {
  const { list, add } = useLevels()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const chip = (code: string, label: string): JSX.Element => (
    <button
      key={code}
      type="button"
      onClick={() => onChange(code)}
      className={cn(
        'rounded-pill border px-3 py-1.5 text-xs font-bold transition',
        value === code ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
      )}
    >
      {label}
    </button>
  )

  const commit = (): void => {
    const n = name.trim()
    if (!n) { setAdding(false); return }
    const lvl = add(n)
    onChange(lvl.code)
    setName('')
    setAdding(false)
  }

  return (
    <div className={cn('flex flex-wrap gap-2 items-center', className)}>
      {allowAll && chip('All', 'All')}
      {list.map((l) => chip(l.code, l.name))}
      {allowCustom && (
        adding ? (
          <span className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(false) }}
              onBlur={commit}
              placeholder="New level…"
              className="w-28 rounded-pill bg-white/[0.05] border border-brand-400/40 px-3 py-1.5 text-xs text-white outline-none"
            />
          </span>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="rounded-pill border border-dashed border-white/20 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:border-white/40">+ Level</button>
        )
      )}
    </div>
  )
}
