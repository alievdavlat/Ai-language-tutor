/**
 * Role hierarchy + permission matrix — the single source of truth (#A55 / #A57).
 *
 * Every role/permission decision in the app — route guards, sidebar nav,
 * "can this user create X" buttons, the admin console — funnels through `can()`
 * / `roleAtLeast()` here, instead of the ad-hoc `role === 'admin'` string
 * checks that used to be scattered across pages.
 *
 *   Hierarchy (low → high):   student  <  teacher  <  admin  <  owner
 *
 * IMPORTANT — admins/owners are NOT learners. They operate the platform from a
 * dedicated admin shell and do NOT get the learner Home/Courses/Practice
 * surfaces by default. Teachers DO learn (they keep the learner shell *plus*
 * their own-scope authoring tools). That is why permissions are an explicit set
 * per role rather than pure top-down inheritance.
 *
 * Scope split (#A57):
 *   - `*.own`  = teacher own-scope    (their courses / channel / students)
 *   - `*.any`  = platform-wide admin  (every entity, every user)
 */

export type Role = 'student' | 'teacher' | 'admin' | 'owner'

export const ROLES: readonly Role[] = ['student', 'teacher', 'admin', 'owner'] as const

/** Ordinal rank for hierarchy comparisons. Higher = more authority. */
export const ROLE_RANK: Record<Role, number> = {
  student: 0,
  teacher: 1,
  admin: 2,
  owner: 3
}

export type Permission =
  // ── Learner surfaces (student + teacher only) ──
  | 'learn.access' //          Home, Courses, Library, Practice, Vocabulary…
  | 'community.participate' //  post / comment / join groups & challenges
  // ── Teacher own-scope ──
  | 'content.author.own' //    create/edit OWN courses, lessons, clips, exams, stories
  | 'channel.manage.own' //    own channel page
  | 'students.view.own' //     own students, analytics, earnings
  | 'monetization.own' //      own payouts / pricing
  // ── Platform-wide admin scope ──
  | 'admin.access' //          reach the admin console shell
  | 'content.manage.any' //    create/edit/delete ANY content, platform-wide
  | 'content.moderate' //      reports, takedowns, featured
  | 'users.manage' //          CRM: view/ban/edit any user
  | 'analytics.platform' //    platform-wide metrics
  // ── Owner-only ──
  | 'roles.assign' //          change other users' roles (incl. minting admins)
  | 'platform.settings' //     global config, integrations, branding
  | 'billing.manage' //        platform billing / revenue config

const LEARNER: Permission[] = ['learn.access', 'community.participate']

const TEACHER_OWN: Permission[] = [
  'content.author.own',
  'channel.manage.own',
  'students.view.own',
  'monetization.own'
]

const ADMIN_PLATFORM: Permission[] = [
  'admin.access',
  'content.manage.any',
  'content.moderate',
  'users.manage',
  'analytics.platform',
  // Admins moderate the community, so they can act inside it.
  'community.participate'
]

const OWNER_ONLY: Permission[] = ['roles.assign', 'platform.settings', 'billing.manage']

/**
 * The matrix. Note that `content.manage.any` (admin/owner) subsumes the teacher
 * own-scope authoring perms, so admins/owners don't need `content.author.own`.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: [...LEARNER],
  teacher: [...LEARNER, ...TEACHER_OWN],
  // Admins are operators, not learners — no learn.access.
  admin: [...ADMIN_PLATFORM],
  // Owner = admin + the keys to the platform itself.
  owner: [...ADMIN_PLATFORM, ...OWNER_ONLY]
}

/** Does `role` hold `permission`? The one check the whole app should call. */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/** Hierarchy gate: is `role` at least as high as `min`? */
export function roleAtLeast(role: Role | null | undefined, min: Role): boolean {
  if (!role) return false
  return ROLE_RANK[role] >= ROLE_RANK[min]
}

/** Learners get the learner shell (student + teacher). Admin/owner do not. */
export function isLearnerRole(role: Role | null | undefined): boolean {
  return role === 'student' || role === 'teacher'
}

/** Admin/owner operate the platform from the admin shell. */
export function isAdminRole(role: Role | null | undefined): boolean {
  return role === 'admin' || role === 'owner'
}

/**
 * May this role author content at all? True for teacher (own-scope) AND for
 * admin/owner (platform-wide). The teacher authoring routes / "Create" buttons
 * gate on this rather than a raw role string, so the admin CMS keeps working.
 */
export function canAuthorContent(role: Role | null | undefined): boolean {
  return can(role, 'content.author.own') || can(role, 'content.manage.any')
}

/**
 * Can `actor` set someone's role to `next`? Only owners manage roles, and nobody
 * can grant a role at or above their own rank (an owner can mint admins, but an
 * admin cannot mint admins). Guards the future real role-management UI
 * (#A54/#A56); the dev RoleSwitcher deliberately bypasses it.
 */
export function canAssignRole(actor: Role | null | undefined, next: Role): boolean {
  if (!actor || !can(actor, 'roles.assign')) return false
  return ROLE_RANK[next] < ROLE_RANK[actor]
}

export interface RoleMeta {
  id: Role
  label: string
  description: string
  /** Where this role lands after the auth funnel / role switch. */
  home: string
}

export const ROLE_META: Record<Role, RoleMeta> = {
  student: {
    id: 'student',
    label: 'Student',
    description: 'Learner home, courses, practice',
    home: '/home'
  },
  teacher: {
    id: 'teacher',
    label: 'Teacher',
    description: 'Teach + learn: dashboard, Creator Studio, channel',
    home: '/teacher'
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'Platform console: content CMS, user CRM, moderation',
    home: '/admin'
  },
  owner: {
    id: 'owner',
    label: 'Owner',
    description: 'Full control: admin powers + platform settings & billing',
    home: '/admin'
  }
}

/** Landing route for a role after the auth funnel or a role switch. */
export function homeForRole(role: Role | null | undefined): string {
  return role ? ROLE_META[role].home : '/home'
}
