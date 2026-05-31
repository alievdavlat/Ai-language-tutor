/**
 * Renderer-side permission helpers (#A55). Thin reactive wrappers over the
 * shared permission matrix in `@shared/constants/roles` that read the current
 * role from the app store. Pages should call these instead of inlining
 * `role === 'admin'` string checks.
 *
 *   const canModerate = useCan('content.moderate')
 *   const { role, can, isAdmin } = usePermissions()
 */
import {
  can as canFn,
  canAuthorContent as canAuthorContentFn,
  isAdminRole,
  isLearnerRole,
  roleAtLeast as roleAtLeastFn,
  type Permission,
  type Role
} from '@shared/constants'
import { useAppStore } from '../store/useAppStore'

/** Reactive: does the current user hold `permission`? */
export function useCan(permission: Permission): boolean {
  const role = useAppStore((s) => s.role)
  return canFn(role, permission)
}

export interface PermissionApi {
  role: Role
  can: (permission: Permission) => boolean
  roleAtLeast: (min: Role) => boolean
  canAuthorContent: boolean
  isAdmin: boolean
  isLearner: boolean
}

/** Reactive bundle for components that need several checks at once. */
export function usePermissions(): PermissionApi {
  const role = useAppStore((s) => s.role)
  return {
    role,
    can: (permission) => canFn(role, permission),
    roleAtLeast: (min) => roleAtLeastFn(role, min),
    canAuthorContent: canAuthorContentFn(role),
    isAdmin: isAdminRole(role),
    isLearner: isLearnerRole(role)
  }
}
