/**
 * Labelled field wrapper — consistent label / hint / error chrome around any
 * input. Part of the shared authoring form kit (#A58). Dark-first.
 */
import type { ReactNode } from 'react'

export interface FieldProps {
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
  children: ReactNode
  className?: string
}

export default function Field({ label, hint, error, required, children, className }: FieldProps): JSX.Element {
  return (
    <div className={className}>
      {label && (
        <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className={label ? 'mt-1.5' : ''}>{children}</div>
      {hint && !error && <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>}
      {error && <p className="text-[12px] text-rose-400 mt-1.5">⚠ {error}</p>}
    </div>
  )
}
