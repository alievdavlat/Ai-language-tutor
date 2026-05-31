import { NavLink } from 'react-router-dom'
import type { UserProfile } from '@shared/types'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { useT } from '../../i18n'
import type { StringKey } from '../../i18n'
import AvatarCircle from '../ui/AvatarCircle'
import {
  IconBolt,
  IconBook,
  IconBookmark,
  IconChart,
  IconChevronLeft,
  IconChevronRight,
  IconClipboard,
  IconGear,
  IconHeadphones,
  IconHome,
  IconLibrary,
  IconMic,
  IconPencilEdit,
  IconSearch,
  IconUsers,
  type IconProps
} from '../icons'

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_ICON_CLS = 'w-[18px] h-[18px] shrink-0'

// ─── Nav / item config ────────────────────────────────────────────────────────
// Labels are i18n keys, resolved at render via useT() so the sidebar localises
// with the user's native language.
interface NavConfig {
  to: string
  labelKey: StringKey
  Icon: (p: IconProps) => JSX.Element
}

const LEARN_NAV: readonly NavConfig[] = [
  { to: '/home', labelKey: 'nav.home', Icon: IconHome },
  { to: '/courses', labelKey: 'nav.courses', Icon: IconBook },
  { to: '/library', labelKey: 'nav.library', Icon: IconLibrary },
  { to: '/vocabulary', labelKey: 'nav.vocabulary', Icon: IconBookmark },
  // Dictionary moved into Vocabulary (a tab) — no longer a separate sidebar item.
  { to: '/progress', labelKey: 'nav.progress', Icon: IconChart }
]

const PRACTICE_NAV: readonly NavConfig[] = [
  { to: '/speaking', labelKey: 'nav.speaking', Icon: IconMic },
  { to: '/clips', labelKey: 'nav.clips', Icon: IconHeadphones },
  { to: '/writing', labelKey: 'nav.writing', Icon: IconPencilEdit },
  // Speaking partner now lives inside the Speaking hub (not the sidebar).
  { to: '/exams', labelKey: 'nav.exams', Icon: IconClipboard }
]

const COMMUNITY_NAV: readonly NavConfig[] = [
  // Explore = one Instagram-style social hub: feed, groups, challenges, discover,
  // plus live rooms + study-buddies surfaced via its "Now" bar.
  { to: '/community', labelKey: 'nav.explore', Icon: IconSearch }
]

// Teacher-mode navigation — teachers also learn, so they keep a Learn group.
const TEACHER_MANAGE: readonly NavConfig[] = [
  { to: '/teacher', labelKey: 'nav.dashboard', Icon: IconHome },
  { to: '/studio', labelKey: 'nav.studio', Icon: IconPencilEdit },
  { to: '/channel', labelKey: 'nav.channel', Icon: IconUsers }
]

const TEACHER_LEARN: readonly NavConfig[] = [
  { to: '/courses', labelKey: 'nav.courses', Icon: IconBook },
  { to: '/library', labelKey: 'nav.library', Icon: IconLibrary },
  { to: '/speaking', labelKey: 'nav.speaking', Icon: IconMic },
  { to: '/clips', labelKey: 'nav.clips', Icon: IconHeadphones },
  { to: '/writing', labelKey: 'nav.writing', Icon: IconPencilEdit },
  { to: '/exams', labelKey: 'nav.exams', Icon: IconClipboard }
]

const TEACHER_ENGAGE: readonly NavConfig[] = [
  { to: '/community', labelKey: 'nav.explore', Icon: IconSearch }
]

const BOTTOM_NAV: readonly NavConfig[] = [
  { to: '/settings', labelKey: 'nav.settings', Icon: IconGear }
]

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
  const t = useT()
  const Icon = collapsed ? IconChevronRight : IconChevronLeft

  return (
    <button
      onClick={onToggle}
      title={collapsed ? t('nav.expand') : t('nav.collapse')}
      className={cn(
        'flex items-center gap-3 rounded-xl text-xs text-slate-500 hover:text-slate-300',
        'hover:bg-white/5 transition-all duration-150 w-full',
        collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{t('nav.collapse')}</span>}
    </button>
  )
}

interface ProfileCardProps {
  profile: UserProfile
  collapsed: boolean
}

function ProfileCard({ profile, collapsed }: ProfileCardProps): JSX.Element {
  const t = useT()
  if (collapsed) {
    return (
      <NavLink to="/account" className="mx-auto mb-4" title={t('settings.account')}>
        <AvatarCircle name={profile.name ?? 'User'} size="sm" />
      </NavLink>
    )
  }

  return (
    <NavLink
      to="/account"
      className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center gap-3 hover:bg-white/[0.08] transition"
    >
      <AvatarCircle name={profile.name ?? 'User'} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate text-white">{profile.name ?? t('common.you')}</p>
        <p className="text-[11px] text-slate-400 truncate">{t('common.level')} {profile.level}</p>
      </div>
    </NavLink>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export interface SidebarProps {
  profile: UserProfile | null
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ profile, collapsed, onToggle }: SidebarProps): JSX.Element {
  const role = useAppStore((s) => s.role)
  const t = useT()
  const isAdmin = role === 'admin'
  // Admin is a superset of teacher (matches RequireRole in AppRoutes): admins get
  // the full Manage/Learn/Engage nav plus an Admin link.
  const isTeacher = role === 'teacher' || isAdmin

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
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{t('nav.tagline')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Primary navigation */}
      <nav className={cn('flex-1 py-1 overflow-y-auto', collapsed ? 'px-1' : 'px-3')}>
        {isTeacher ? (
          <>
            {!collapsed && <p className="section-title px-3 mb-2">{t('nav.section.manage')}</p>}
            <div className="space-y-0.5">
              {TEACHER_MANAGE.map((item) => (
                <NavItem key={item.to} to={item.to} label={t(item.labelKey)} Icon={item.Icon} collapsed={collapsed} />
              ))}
              {isAdmin && <NavItem to="/admin" label={t('nav.admin')} Icon={IconClipboard} collapsed={collapsed} />}
            </div>
            {!collapsed && <p className="section-title px-3 mb-2 mt-5">{t('nav.section.learn')}</p>}
            {collapsed && <div className="my-2 border-t border-white/[0.06]" />}
            <div className="space-y-0.5">
              {TEACHER_LEARN.map((item) => (
                <NavItem key={item.to} to={item.to} label={t(item.labelKey)} Icon={item.Icon} collapsed={collapsed} />
              ))}
            </div>
            {!collapsed && <p className="section-title px-3 mb-2 mt-5">{t('nav.section.engage')}</p>}
            {collapsed && <div className="my-2 border-t border-white/[0.06]" />}
            <div className="space-y-0.5">
              {TEACHER_ENGAGE.map((item) => (
                <NavItem key={item.to} to={item.to} label={t(item.labelKey)} Icon={item.Icon} collapsed={collapsed} />
              ))}
            </div>
          </>
        ) : (
          <>
            {!collapsed && <p className="section-title px-3 mb-2">{t('nav.section.learn')}</p>}
            <div className="space-y-0.5">
              {LEARN_NAV.map((item) => (
                <NavItem key={item.to} to={item.to} label={t(item.labelKey)} Icon={item.Icon} collapsed={collapsed} />
              ))}
            </div>

            {!collapsed && <p className="section-title px-3 mb-2 mt-5">{t('nav.section.practice')}</p>}
            {collapsed && <div className="my-2 border-t border-white/[0.06]" />}
            <div className="space-y-0.5">
              {PRACTICE_NAV.map((item) => (
                <NavItem key={item.to} to={item.to} label={t(item.labelKey)} Icon={item.Icon} collapsed={collapsed} />
              ))}
            </div>

            {!collapsed && <p className="section-title px-3 mb-2 mt-5">{t('nav.section.social')}</p>}
            {collapsed && <div className="my-2 border-t border-white/[0.06]" />}
            <div className="space-y-0.5">
              {COMMUNITY_NAV.map((item) => (
                <NavItem key={item.to} to={item.to} label={t(item.labelKey)} Icon={item.Icon} collapsed={collapsed} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Role badge (read-only — role is fixed at onboarding) */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className={cn(
            'w-full rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2',
            isTeacher
              ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-200'
              : 'bg-brand-500/10 border border-brand-400/20 text-brand-200'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', isTeacher ? 'bg-emerald-400' : 'bg-brand-400')} />
            {isAdmin ? t('role.adminAccount') : isTeacher ? t('role.teacherAccount') : t('role.studentAccount')}
          </div>
        </div>
      )}

      {/* Bottom: settings + collapse toggle */}
      <div className={cn('pb-2 space-y-0.5', collapsed ? 'px-1' : 'px-3')}>
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.to} to={item.to} label={t(item.labelKey)} Icon={item.Icon} collapsed={collapsed} />
        ))}
        <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
      </div>

      {/* Profile */}
      {profile && <ProfileCard profile={profile} collapsed={collapsed} />}

      {/* App version footer */}
      <div className={cn('pb-3 text-center', collapsed ? 'px-1' : 'px-3')}>
        <span className="text-[10px] text-slate-600 tracking-wide">
          v{typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.1'}
        </span>
      </div>
    </aside>
  )
}
