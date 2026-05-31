import type { ReactNode } from 'react'
import { cn } from '../../lib/classnames'
import { IconX } from '../icons'

interface FormModalProps {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  /** Sticky footer content (Cancel / Save buttons). */
  footer?: ReactNode
  /** Tailwind max-width class. Default max-w-2xl. */
  maxWidthClassName?: string
  children: ReactNode
}

/**
 * Standard dark-gradient authoring modal — sticky header (title + close) and
 * sticky footer (actions), scrollable body. Extracted from the exam/story
 * editors so every entity editor shares identical chrome. (#A58)
 */
export default function FormModal({
  title,
  subtitle,
  onClose,
  footer,
  maxWidthClassName = 'max-w-2xl',
  children
}: FormModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={cn('border border-white/10 rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto', maxWidthClassName)}
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}
      >
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between sticky top-0 bg-[#14182a]/90 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400">
            <IconX className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">{children}</div>

        {footer && (
          <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2 sticky bottom-0 bg-[#14182a]/90 backdrop-blur">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
