import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/classnames'
import {
  IconHome,
  IconUsers,
  IconLock,
  IconStar,
  IconClipboard,
  IconChat,
  IconArrowRight
} from '../../components/icons'
import { RESOURCES, getResource } from './resources'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ResourcePage from './pages/ResourcePage'
import ModerationPage from './pages/ModerationPage'
import FeaturedPage from './pages/FeaturedPage'
import AuditPage from './pages/AuditPage'
import NotificationsPage from './pages/NotificationsPage'

interface NavItem {
  view: string
  label: string
  icon: ReactNode
}
interface NavGroup {
  label: string
  items: NavItem[]
}

function buildNav(): NavGroup[] {
  const byGroup = (g: string): NavItem[] =>
    RESOURCES.filter((r) => r.group === g).map((r) => ({ view: `res:${r.key}`, label: r.label, icon: r.icon }))
  return [
    { label: 'Overview', items: [{ view: 'dashboard', label: 'Dashboard', icon: <IconHome className="w-4 h-4" /> }] },
    { label: 'People', items: [{ view: 'users', label: 'Users', icon: <IconUsers className="w-4 h-4" /> }] },
    { label: 'Learning content', items: byGroup('Learning') },
    { label: 'Practice content', items: byGroup('Practice') },
    { label: 'Community', items: byGroup('Community') },
    { label: 'Communications', items: [{ view: 'notifications', label: 'Notifications', icon: <IconChat className="w-4 h-4" /> }] },
    {
      label: 'Trust & safety',
      items: [
        { view: 'moderation', label: 'Moderation', icon: <IconLock className="w-4 h-4" /> },
        { view: 'featured', label: 'Featured', icon: <IconStar className="w-4 h-4" /> },
        { view: 'audit', label: 'Audit log', icon: <IconClipboard className="w-4 h-4" /> }
      ]
    }
  ]
}

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  notifications: 'Notifications',
  moderation: 'Moderation',
  featured: 'Featured',
  audit: 'Audit log'
}

function viewLabel(view: string): string {
  if (view.startsWith('res:')) return getResource(view.slice(4))?.label ?? 'Content'
  return LABELS[view] ?? 'Console'
}

/**
 * The Admin console's OWN shell — a dense, dark "control room" chrome that
 * replaces the learner AppShell entirely (no learner sidebar / docked chat /
 * retention nudges). Left rail groups every managed surface; the topbar carries
 * the breadcrumb and an explicit exit back to the learner app.
 */
export default function AdminConsole(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const [view, setView] = useState('dashboard')
  const nav = buildNav()

  const renderView = (): JSX.Element => {
    if (view.startsWith('res:')) {
      const def = getResource(view.slice(4))
      return def ? <ResourcePage def={def} /> : <DashboardPage go={setView} />
    }
    switch (view) {
      case 'users': return <UsersPage />
      case 'notifications': return <NotificationsPage />
      case 'moderation': return <ModerationPage />
      case 'featured': return <FeaturedPage />
      case 'audit': return <AuditPage />
      default: return <DashboardPage go={setView} />
    }
  }

  return (
    <div className="h-full flex bg-[#070910] text-slate-100">
      {/* Left rail */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0c12]">
        <div className="px-4 h-14 flex items-center gap-2.5 border-b border-white/[0.06]">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white"><IconLock className="w-3.5 h-3.5" /></span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Admin Console</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">CMS · CRM</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {nav.map((group) => (
            group.items.length === 0 ? null : (
              <div key={group.label}>
                <p className="px-2 mb-1 text-[10px] uppercase tracking-widest text-slate-600 font-bold">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = view === item.view
                    return (
                      <button
                        key={item.view}
                        onClick={() => setView(item.view)}
                        className={cn(
                          'relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition',
                          active ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        )}
                      >
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-400" />}
                        <span className={cn(active ? 'text-brand-300' : 'text-slate-500')}>{item.icon}</span>
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/[0.06]">
          <button onClick={() => navigate('/home')} className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-3 py-2 text-xs font-semibold text-slate-300">
            Exit to app <IconArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0a0c12]/60 backdrop-blur">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Console</span>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-white">{viewLabel(view)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
              <IconLock className="w-3 h-3" /> Owner / Admin
            </span>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-bold text-slate-200">{(profile?.name ?? 'A').slice(0, 1).toUpperCase()}</span>
              <span className="text-sm text-slate-300 hidden sm:block">{profile?.name ?? 'Admin'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-6 lg:px-8 py-6 max-w-6xl">{renderView()}</div>
        </main>
      </div>
    </div>
  )
}
