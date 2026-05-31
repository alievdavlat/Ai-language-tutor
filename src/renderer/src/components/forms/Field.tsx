import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'

interface FieldProps {
  /** Uppercase eyebrow label shown above the control. */
  label?: ReactNode
  /** Mark the field required (renders a rose asterisk). */
  required?: boolean
  /** Helper text under the label. */
  hint?: ReactNode
  /** Validation error — shown in rose, replaces hint when set. */
  error?: ReactNode
  /** Optional id wired to the label's htmlFor. */
  htmlFor?: string
  className?: string
  children: ReactNode
}

/**
 * Labeled form-field wrapper used across every authoring form. Standardises the
 * uppercase-tracking label, required asterisk, hint and inline error so editors
 * don't re-implement field chrome. (#A58 shared form library.)
 */
export default function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  className,
  children
}: FieldProps): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12px] text-rose-400">⚠ {error}</p>
      ) : hint ? (
        <p className="text-[12px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
