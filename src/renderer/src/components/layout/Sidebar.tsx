import { NavLink } from 'react-router-dom'
import type { UserProfile } from '@shared/types'
import { cn } from '../../lib/classnames'
import AvatarCircle from '../ui/AvatarCircle'

export interface SidebarItem {
  to: string
  label: string
  icon: string
  enabled: boolean
  comingSoon?: boolean
}

const PRIMARY_ITEMS: readonly SidebarItem[] = [
  { to: '/home', label: 'Home', icon: '🏠', enabled: true },
  { to: '/speaking', label: 'Speaking', icon: '🗣️', enabled: true },
  { to: '/vocabulary', label: 'Vocabulary', icon: '📚', enabled: false, comingSoon: true },
  { to: '/grammar', label: 'Grammar', icon: '✍️', enabled: false, comingSoon: true },
  { to: '/progress', label: 'Progress', icon: '📊', enabled: false, comingSoon: true }
] as const

const BOTTOM_ITEMS: readonly SidebarItem[] = [
  { to: '/settings', label: 'Settings', icon: '⚙️', enabled: true }
] as const

interface SidebarProps {
  profile: UserProfile | null
}

function NavItem({ item }: { item: SidebarItem }): JSX.Element {
  const base =
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative'

  if (!item.enabled) {
    return (
      <div
        className={cn(base, 'text-slate-500 cursor-not-allowed opacity-70')}
        title={item.comingSoon ? 'Coming soon' : 'Disabled'}
      >
        <span className="text-lg" aria-hidden>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.comingSoon && (
          <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5">
            soon
          </span>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          base,
          isActive
            ? 'bg-brand-500/15 text-brand-100 ring-1 ring-brand-400/30'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        )
      }
    >
      <span className="text-lg" aria-hidden>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar({ profile }: SidebarProps): JSX.Element {
  return (
    <aside className="w-60 shrink-0 hidden md:flex flex-col border-r border-canvas-line bg-canvas-soft/60 backdrop-blur-xl">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-grad-brand flex items-center justify-center shadow-glow">
            <span className="text-white font-bold text-base">🗣</span>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight">Speaking App</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Offline AI coach
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        <p className="section-title px-3">Learn</p>
        {PRIMARY_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      <div className="px-3 space-y-1 mb-3">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </div>

      {profile && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
          <AvatarCircle name={profile.name ?? 'User'} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{profile.name ?? 'You'}</p>
            <p className="text-[11px] text-slate-400">
              Level {profile.level} ·{' '}
              <span className="capitalize">{profile.settings.performanceMode}</span>
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
