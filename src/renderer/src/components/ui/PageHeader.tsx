import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { IconChevronLeft } from '../icons'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  /** Override default `navigate(-1)` behavior. Pass `false` to hide the back button entirely. */
  back?: string | (() => void) | false
  /** Optional breadcrumb trail rendered above the title. Click a crumb to navigate. */
  crumbs?: { label: string; to?: string }[]
  className?: string
}

/**
 * Standard top-of-page header used by every sub-page that isn't a sidebar root.
 * Provides a consistent back affordance + optional breadcrumb trail.
 */
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  back,
  crumbs,
  className
}: PageHeaderProps): JSX.Element {
  const navigate = useNavigate()

  const handleBack = (): void => {
    if (back === false) return
    if (typeof back === 'function') back()
    else if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <header className={cn('flex flex-col gap-2', className)}>
      {crumbs && crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[11px] text-slate-500" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {c.to ? (
                <button onClick={() => navigate(c.to!)} className="hover:text-brand-300 transition">
                  {c.label}
                </button>
              ) : (
                <span className="text-slate-300">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <span className="text-slate-700">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start gap-3">
        {back !== false && (
          <button
            onClick={handleBack}
            title="Back"
            className="mt-0.5 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white flex items-center justify-center transition shrink-0"
          >
            <IconChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{eyebrow}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
