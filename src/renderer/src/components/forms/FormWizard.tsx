import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'
import { IconChevronLeft, IconChevronRight } from '../icons'

export interface WizardStep<T extends string> {
  id: T
  label: string
  /** Optional per-step completeness flag — drives the stepper's ✓/badge. */
  complete?: boolean
}

interface FormWizardProps<T extends string> {
  steps: readonly WizardStep<T>[]
  active: T
  onChange: (id: T) => void
  children: ReactNode
  /** Disable advancing past the current step (e.g. required fields missing). */
  canAdvance?: boolean
  /** Rendered to the right of the Back button on the final step (publish CTA). */
  finalAction?: ReactNode
  className?: string
}

/**
 * Multi-step form shell — numbered stepper header + Back/Next footer. Click a
 * step to jump; Next/Back walk the sequence. The page owns the step content and
 * the final publish action (passed via `finalAction`). Powers the full-page
 * authoring wizards (course, lesson). (#A58)
 */
export default function FormWizard<T extends string>({
  steps,
  active,
  onChange,
  children,
  canAdvance = true,
  finalAction,
  className
}: FormWizardProps<T>): JSX.Element {
  const idx = steps.findIndex((s) => s.id === active)
  const isFirst = idx <= 0
  const isLast = idx >= steps.length - 1

  const go = (dir: -1 | 1): void => {
    const t = idx + dir
    if (t < 0 || t >= steps.length) return
    onChange(steps[t].id)
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Stepper */}
      <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-pill bg-white/[0.04] border border-white/10 self-start flex-wrap">
        {steps.map((s, i) => {
          const isActive = s.id === active
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(s.id)}
              className={cn(
                'px-4 py-1.5 rounded-pill text-sm font-medium transition inline-flex items-center gap-1.5',
                isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span className={cn('text-[10px] font-black', s.complete ? 'text-emerald-400' : 'text-slate-500')}>
                {s.complete ? '✓' : i + 1}
              </span>
              {s.label}
            </button>
          )
        })}
      </div>

      {children}

      {/* Step nav */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => go(-1)}
          disabled={isFirst}
          className="btn-ghost text-xs px-4 py-2 disabled:opacity-40 inline-flex items-center gap-1"
        >
          <IconChevronLeft className="w-4 h-4" /> Back
        </button>
        {isLast ? (
          finalAction ?? <span />
        ) : (
          <button
            onClick={() => go(1)}
            disabled={!canAdvance}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-40 inline-flex items-center gap-1"
          >
            Next <IconChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
