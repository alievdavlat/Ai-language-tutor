import { NavLink } from 'react-router-dom'
import type { UserProfile } from '@shared/types'
import { cn } from '../../lib/classnames'
import AvatarCircle from '../ui/AvatarCircle'
import {
  IconBook,
  IconBookmark,
  IconChart,
  IconChevronLeft,
  IconChevronRight,
  IconGear,
  IconHome,
  IconMic,
  type IconProps
} from '../icons'

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_ICON_CLS = 'w-[18px] h-[18px] shrink-0'

// ─── Nav / item config ────────────────────────────────────────────────────────
const PRIMARY_NAV = [
  { to: '/home', label: 'Home', Icon: IconHome },
  { to: '/speaking', label: 'Practice', Icon: IconMic },
  { to: '/lessons', label: 'Lessons', Icon: IconBook },
  { to: '/vocabulary', label: 'Vocabulary', Icon: IconBookmark },
  { to: '/progress', label: 'Progress', Icon: IconChart }
] as const

const BOTTOM_NAV = [
  { to: '/settings', label: 'Settings', Icon: IconGear }
] as const

// ─── Sub-components ───────────────────────────────────────────────────────────

interface NavItemProps {
  to: string
  label: string
  Icon: (p: IconProps) => JSX.Element
  collapsed: boolean
}

function NavItem({ to, label, Icon, collapsed }: NavItemProps): JSX.Element {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
          collapsed ? 'justify-center px-0 py-2.5 w-full' : 'px-3 py-2.5',
          isActive
            ? 'bg-brand-500/15 text-brand-100 ring-1 ring-brand-400/30'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        )
      }
    >
      <Icon className={NAV_ICON_CLS} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

/** The gradient mic pill used as the app logo mark. */
function LogoPill(): JSX.Element {
  return (
    <div className="w-8 h-8 rounded-lg bg-grad-brand flex items-center justify-center shadow-glow shrink-0">
      <IconMic className="w-4 h-4 text-white" />
    </div>
  )
}

interface CollapseToggleProps {
  collapsed: boolean
  onToggle: () => void
}

function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps): JSX.Element {
  const Icon = collapsed ? IconChevronRight : IconChevronLeft

  return (
    <button
      onClick={onToggle}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cn(
        'flex items-center gap-3 rounded-xl text-xs text-slate-500 hover:text-slate-300',
        'hover:bg-white/5 transition-all duration-150 w-full',
        collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>Collapse</span>}
    </button>
  )
}

interface ProfileCardProps {
  profile: UserProfile
  collapsed: boolean
}

function ProfileCard({ profile, collapsed }: ProfileCardProps): JSX.Element {
  if (collapsed) {
    return (
      <div className="mx-auto mb-4">
        <AvatarCircle name={profile.name ?? 'User'} size="sm" />
      </div>
    )
  }

  return (
    <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center gap-3">
      <AvatarCircle name={profile.name ?? 'User'} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate text-white">{profile.name ?? 'You'}</p>
        <p className="text-[11px] text-slate-400 truncate">Level {profile.level}</p>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export interface SidebarProps {
  profile: UserProfile | null
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ profile, collapsed, onToggle }: SidebarProps): JSX.Element {
  return (
    <aside
      className={cn(
        'shrink-0 hidden md:flex flex-col border-r border-canvas-line',
        'bg-canvas-soft/60 backdrop-blur-xl transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* App logo */}
      <div className={cn('pt-5 pb-4', collapsed ? 'px-0 flex justify-center' : 'px-4')}>
        {collapsed ? (
          <LogoPill />
        ) : (
          <div className="flex items-center gap-2.5">
            <LogoPill />
            <div className="leading-tight">
              <div className="font-bold text-sm tracking-tight text-white">SpeakAI</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Your coach</div>
            </div>
          </div>
        )}
      </div>

      {/* Primary navigation */}
      <nav className={cn('flex-1 py-1 space-y-0.5', collapsed ? 'px-1' : 'px-3')}>
        {!collapsed && <p className="section-title px-3 mb-2">Learn</p>}

        {PRIMARY_NAV.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom: settings + collapse toggle */}
      <div className={cn('pb-2 space-y-0.5', collapsed ? 'px-1' : 'px-3')}>
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
        <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
      </div>

      {/* Profile */}
      {profile && <ProfileCard profile={profile} collapsed={collapsed} />}
    </aside>
  )
}
