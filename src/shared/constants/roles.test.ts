import { describe, it, expect } from 'vitest'
import {
  can,
  roleAtLeast,
  canAuthorContent,
  isAdminRole,
  isLearnerRole,
  ROLE_RANK,
  ROLE_PERMISSIONS
} from './roles'

describe('role hierarchy (#A55)', () => {
  it('orders student < teacher < admin < owner', () => {
    expect(ROLE_RANK.student).toBeLessThan(ROLE_RANK.teacher)
    expect(ROLE_RANK.teacher).toBeLessThan(ROLE_RANK.admin)
    expect(ROLE_RANK.admin).toBeLessThan(ROLE_RANK.owner)
  })

  it('roleAtLeast compares by rank', () => {
    expect(roleAtLeast('owner', 'admin')).toBe(true)
    expect(roleAtLeast('teacher', 'admin')).toBe(false)
    expect(roleAtLeast('admin', 'admin')).toBe(true)
  })
})

describe('permission matrix', () => {
  it('students only learn + participate, never admin', () => {
    expect(can('student', 'learn.access')).toBe(true)
    expect(can('student', 'community.participate')).toBe(true)
    expect(can('student', 'admin.access')).toBe(false)
    expect(can('student', 'users.manage')).toBe(false)
  })

  it('teachers author their own content but are not platform admins', () => {
    expect(can('teacher', 'content.author.own')).toBe(true)
    expect(can('teacher', 'channel.manage.own')).toBe(true)
    expect(can('teacher', 'content.manage.any')).toBe(false)
    expect(can('teacher', 'admin.access')).toBe(false)
  })

  it('admins operate the platform but are NOT learners (no learn.access)', () => {
    expect(can('admin', 'admin.access')).toBe(true)
    expect(can('admin', 'users.manage')).toBe(true)
    expect(can('admin', 'content.manage.any')).toBe(true)
    expect(can('admin', 'learn.access')).toBe(false)
  })

  it('only the owner can assign roles and manage billing', () => {
    expect(can('owner', 'roles.assign')).toBe(true)
    expect(can('owner', 'billing.manage')).toBe(true)
    expect(can('admin', 'roles.assign')).toBe(false)
    expect(can('admin', 'billing.manage')).toBe(false)
  })

  it('null/undefined role holds no permission', () => {
    expect(can(null, 'learn.access')).toBe(false)
    expect(can(undefined, 'admin.access')).toBe(false)
  })
})

describe('role predicates', () => {
  it('isAdminRole is true for admin + owner only', () => {
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('owner')).toBe(true)
    expect(isAdminRole('teacher')).toBe(false)
    expect(isAdminRole('student')).toBe(false)
  })

  it('isLearnerRole is true for student + teacher only', () => {
    expect(isLearnerRole('student')).toBe(true)
    expect(isLearnerRole('teacher')).toBe(true)
    expect(isLearnerRole('admin')).toBe(false)
  })

  it('canAuthorContent: teacher own-scope OR admin platform-scope', () => {
    expect(canAuthorContent('teacher')).toBe(true)
    expect(canAuthorContent('admin')).toBe(true)
    expect(canAuthorContent('owner')).toBe(true)
    expect(canAuthorContent('student')).toBe(false)
  })

  it('every role has an explicit permission set', () => {
    for (const role of ['student', 'teacher', 'admin', 'owner'] as const) {
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
    }
  })
})
