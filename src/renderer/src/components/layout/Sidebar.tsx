import { NavLink } from 'react-router-dom'
import type { UserProfile } from '@shared/types'
import { cn } from '../../lib/classnames'
import AvatarCircle from '../ui/AvatarCircle'

// ─── SVG icons (inline, zero deps) ───────────────────────────────────────────
function IconHome({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  )
}

function IconMic({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
    </svg>
  )
}

function IconBook({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
  )
}

function IconPencil({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

function IconChart({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  )
}

function IconGear({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  )
}

// ─── Nav items config ─────────────────────────────────────────────────────────
const iconCls = 'w-[18px] h-[18px] shrink-0'

const PRIMARY_ITEMS = [
  { to: '/home', label: 'Home', Icon: IconHome, enabled: true },
  { to: '/speaking', label: 'Speaking', Icon: IconMic, enabled: true }
] as const

const BOTTOM_ITEMS = [
  { to: '/settings', label: 'Settings', Icon: IconGear, enabled: true }
] as const

const LOCKED_ITEMS = [
  { label: 'Vocabulary', Icon: IconBook },
  { label: 'Grammar', Icon: IconPencil },
  { label: 'Progress', Icon: IconChart }
] as const

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({
  to,
  label,
  Icon
}: {
  to: string
  label: string
  Icon: (p: { className?: string }) => JSX.Element
}): JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-brand-500/15 text-brand-100 ring-1 ring-brand-400/30'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        )
      }
    >
      <Icon className={iconCls} />
      <span>{label}</span>
    </NavLink>
  )
}

// ─── Locked item (tiny, unobtrusive) ─────────────────────────────────────────
function LockedItem({
  label,
  Icon
}: {
  label: string
  Icon: (p: { className?: string }) => JSX.Element
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 cursor-not-allowed select-none">
      <Icon className="w-4 h-4 shrink-0 opacity-40" />
      <span className="opacity-50">{label}</span>
      <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-700 font-semibold">
        soon
      </span>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  profile: UserProfile | null
}

export default function Sidebar({ profile }: SidebarProps): JSX.Element {
  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col border-r border-canvas-line bg-canvas-soft/60 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-grad-brand flex items-center justify-center shadow-glow shrink-0">
            <IconMic className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight text-white">SpeakAI</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Offline coach
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5">
        <p className="section-title px-3 mb-2">Learn</p>
        {PRIMARY_ITEMS.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} Icon={item.Icon} />
        ))}

        {/* Locked items — very subdued */}
        <div className="pt-1 mt-1 border-t border-white/[0.04]">
          {LOCKED_ITEMS.map((item) => (
            <LockedItem key={item.label} label={item.label} Icon={item.Icon} />
          ))}
        </div>
      </nav>

      {/* Bottom: Settings */}
      <div className="px-3 pb-2 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} Icon={item.Icon} />
        ))}
      </div>

      {/* Profile card */}
      {profile && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center gap-3">
          <AvatarCircle name={profile.name ?? 'User'} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-white">{profile.name ?? 'You'}</p>
            <p className="text-[11px] text-slate-400 truncate">
              {profile.level} · {profile.settings.performanceMode}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
