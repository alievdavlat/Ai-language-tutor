import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { Notif } from '@shared/types'
import { cn } from '../../lib/classnames'
import { IconBell } from '../icons'
import { notifMeta, useNotifications } from '../../services/notifications'

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

interface BellProps {
  collapsed: boolean
}

/**
 * The single notification bell (#A50 — one bell, not two). Lives at the sidebar
 * bottom, shows an unread badge, and opens a popover of recent notifications.
 * Clicking an item marks it read and deep-links. Anchored via a portal so the
 * sidebar's `overflow` never clips it.
 */
export default function NotificationBell({ collapsed }: BellProps): JSX.Element {
  const navigate = useNavigate()
  const { items, unread, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 })

  // Anchor the panel to the bell button (fixed, opens up-and-to-the-right).
  useEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ left: r.right + 10, bottom: window.innerHeight - r.bottom })
  }, [open])

  // Close on outside-click / Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent): void => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if ((t as HTMLElement).closest?.('[data-notif-panel]')) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown) }
  }, [open])

  const openItem = (n: Notif): void => {
    void markRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const recent = items.slice(0, 6)

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className={cn(
          'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 w-full',
          collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
          open ? 'bg-brand-500/15 text-brand-100 ring-1 ring-brand-400/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        )}
      >
        <span className="relative shrink-0">
          <IconBell className="w-[18px] h-[18px]" />
          {unread > 0 && (
            <span className={cn(
              'absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full',
              'bg-rose-500 text-white text-[9px] font-black leading-none flex items-center justify-center',
              'ring-2 ring-canvas-soft shadow-[0_0_8px_rgba(244,63,94,0.6)]'
            )}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        {!collapsed && <span>Notifications</span>}
        {!collapsed && unread > 0 && (
          <span className="ml-auto text-[10px] font-bold text-rose-300">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && createPortal(
        <div
          data-notif-panel
          style={{ position: 'fixed', left: pos.left, bottom: pos.bottom, width: 344 }}
          className="z-[60] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in"
        >
          <div style={{ background: 'linear-gradient(to bottom, #161a2c, #0c0f1a)' }}>
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white">Notifications</h3>
                {unread > 0 && <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 rounded-full px-1.5 py-0.5">{unread} new</span>}
              </div>
              {unread > 0 && (
                <button onClick={() => void markAllRead()} className="text-[11px] font-semibold text-brand-300 hover:text-brand-200">Mark all read</button>
              )}
            </header>

            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <span className="inline-flex w-11 h-11 rounded-full bg-white/[0.04] items-center justify-center text-slate-500 mb-2"><IconBell className="w-5 h-5" /></span>
                <p className="text-sm text-slate-400">You&apos;re all caught up.</p>
              </div>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto divide-y divide-white/[0.05]">
                {recent.map((n, i) => {
                  const meta = notifMeta(n)
                  return (
                    <li key={n.id} style={{ animationDelay: `${i * 30}ms` }} className="animate-fade-in">
                      <button
                        onClick={() => openItem(n)}
                        className={cn(
                          'w-full flex items-start gap-3 px-4 py-3 text-left transition relative',
                          n.read ? 'hover:bg-white/[0.04]' : 'bg-brand-500/[0.05] hover:bg-brand-500/[0.09]'
                        )}
                      >
                        {!n.read && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-400" />}
                        <span className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', meta.tint)}>
                          <meta.Icon className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[13px] leading-tight truncate', n.read ? 'font-medium text-slate-200' : 'font-bold text-white')}>{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">{relTime(n.createdAt)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <footer className="border-t border-white/[0.07]">
              <button
                onClick={() => { setOpen(false); navigate('/notifications') }}
                className="w-full px-4 py-2.5 text-xs font-bold text-brand-300 hover:text-brand-200 hover:bg-white/[0.03] transition"
              >
                See all notifications
              </button>
            </footer>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
