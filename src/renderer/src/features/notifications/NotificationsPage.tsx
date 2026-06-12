import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, Tabs, type TabItem } from '../../components/ui'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { useAppStore } from '../../store/useAppStore'
import { canAuthorContent } from '@shared/constants'
import { IconBolt, IconPlus, IconStar, IconUsers, type IconProps } from '../../components/icons'
import { notifMeta, NOTIF_EVENT } from '../../services/notifications'
import NotificationComposer from './NotificationComposer'
import { useT } from '../../i18n'

type Filter = 'all' | 'social' | 'learning' | 'system'

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationsPage(): JSX.Element {
  const t = useT()
  const FILTERS: TabItem<Filter>[] = [
    { id: 'all', label: t('common.all') },
    { id: 'social', label: t('notifs.filter.social') },
    { id: 'learning', label: t('notifs.filter.learning') },
    { id: 'system', label: t('notifs.filter.system') }
  ]
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()
  const me = backend.currentUserId()
  const role = useAppStore((s) => s.role)
  // Teachers broadcast to their students; admins/owners broadcast platform-wide.
  const canSend = canAuthorContent(role)
  const [composing, setComposing] = useState(false)

  // Real notifications only — no hardcoded fallback (#A34). Icon/tint come from
  // the typed catalog (kind), inferred from the broad type for legacy rows.
  const live = useBackendQuery(() => (me ? backend.listNotifs(me) : Promise.resolve([])), [me], [])
  const rows = live.data.map((n) => {
    const meta = notifMeta(n)
    return {
      id: n.id,
      type: n.type,
      Icon: meta.Icon,
      tint: meta.tint,
      title: n.title,
      body: n.body,
      when: relTime(n.createdAt),
      unread: !n.read,
      to: n.link
    }
  })
  const list = filter === 'all' ? rows : rows.filter((n) => n.type === filter)
  const unread = rows.filter((n) => n.unread).length

  const markAllRead = async (): Promise<void> => {
    if (!me) return
    await backend.markAllRead(me)
    live.refresh()
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT))
  }

  // Per-item read-on-click: mark this one read, then follow its deep link.
  const open = async (id: string, to?: string): Promise<void> => {
    await backend.markNotif(id, true)
    live.refresh()
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT))
    if (to) navigate(to)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          title={t('nav.notifications')}
          subtitle={t('notifs.unread', { n: unread })}
          back="/home"
          crumbs={[{ label: t('nav.home'), to: '/home' }, { label: t('nav.notifications') }]}
          action={
            <div className="flex items-center gap-3">
              {canSend && (
                <button onClick={() => setComposing(true)} className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"><IconPlus className="w-3.5 h-3.5" /> {t('notifs.send')}</button>
              )}
              <button onClick={() => void markAllRead()} className="text-xs font-semibold text-brand-300 hover:text-brand-200">{t('notifs.markAllRead')}</button>
            </div>
          }
        />

        <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />

        {list.length === 0 ? (
          <div className="rounded-card border border-dashed border-white/12 bg-white/[0.02] p-10 text-center text-sm text-slate-400">
            {live.loading ? t('common.loading') : t('notifs.empty')}
          </div>
        ) : (
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {list.map((n) => (
              <button
                key={n.id}
                onClick={() => void open(n.id, n.to)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition relative',
                  n.unread ? 'bg-brand-500/[0.04] hover:bg-brand-500/[0.08]' : 'hover:bg-white/[0.04]'
                )}
              >
                {n.unread && <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-400" />}
                <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', n.tint)}>
                  <n.Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">{n.when}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {composing && (
        <NotificationComposer
          teacherOnly={role === 'teacher'}
          onClose={() => setComposing(false)}
          onSent={() => { setComposing(false); live.refresh() }}
        />
      )}
    </div>
  )
}
