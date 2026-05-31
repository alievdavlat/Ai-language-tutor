import { useEffect, type ReactNode } from 'react'
import { cn } from '../../../lib/classnames'
import { IconX } from '../../../components/icons'

interface DrawerProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg'
}

/**
 * Right-side slide-over used by the Admin console for create/edit forms.
 * Dark, dense chrome that matches the console (distinct from learner modals).
 */
export default function Drawer({ open, title, subtitle, onClose, children, footer, width = 'md' }: DrawerProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'relative h-full w-full flex flex-col border-l border-white/10 shadow-2xl animate-slide-in-right',
          width === 'lg' ? 'max-w-2xl' : 'max-w-xl'
        )}
        style={{ background: 'linear-gradient(180deg, #0e1119, #0a0c12)' }}
      >
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-start justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-white truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 shrink-0">
            <IconX className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2 shrink-0 bg-black/20">{footer}</footer>}
      </div>
    </div>
  )
}
