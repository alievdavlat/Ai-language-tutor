/**
 * Auth service (Task #30). Single seam for sign-up / sign-in / sign-out that
 * works whether the live backend is the local mock or Supabase — and is
 * resilient to Clerk being unreachable in the user's region (VITE_USE_CLERK=0).
 *
 * Default path = local/Supabase-row auth (an entry in the `users` table keyed by
 * email). When the project is built with Supabase creds AND VITE_USE_SUPABASE_AUTH=1
 * we additionally drive Supabase's email/password auth so sessions are real.
 *
 * Either way the persisted student/teacher role survives reloads (mirrored into
 * both the `users` row and the local store, which writes localStorage), and the
 * role-gated routing in AppRoutes keeps working unchanged.
 */
import type { PlatformUser, Role } from '@shared/types'
import { backend } from '../backend'
import { getSupabaseClient, hasSupabaseEnv } from '../backend/client'
import { useAppStore } from '../../store/useAppStore'

export type { Role }

/** Real Supabase email/password auth — opt-in, off by default. */
export const useSupabaseAuth =
  hasSupabaseEnv && import.meta.env.VITE_USE_SUPABASE_AUTH === '1'

function emailToName(email: string): string {
  const local = email.split('@')[0] ?? 'Learner'
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Mirror a signed-in backend user into the app store. */
function applySession(user: PlatformUser, adoptRole: boolean): void {
  const store = useAppStore.getState()
  store.setAuthenticated(true)
  // Returning users adopt the role the SERVER holds (student/teacher/admin) and
  // skip the /role step; brand-new sign-ups leave roleSelected=false so the
  // funnel routes them through /role. The server row is the source of truth, so
  // a tampered local `speakai.role` is corrected here on every sign-in.
  if (adoptRole && user.role) {
    store.setRole(user.role)
  }
}

export async function signUp(input: {
  name?: string
  email: string
  password?: string
  role?: Role
}): Promise<PlatformUser> {
  const email = input.email.trim().toLowerCase()
  const role: Role = input.role ?? (useAppStore.getState().role === 'teacher' ? 'teacher' : 'student')

  if (useSupabaseAuth && input.password) {
    const { error } = await getSupabaseClient().auth.signUp({ email, password: input.password })
    // 'User already registered' is fine — they can sign in; surface anything else.
    if (error && !/already/i.test(error.message)) throw error
  }

  const user = await backend.signUp({ name: input.name?.trim() || emailToName(email), email, role })
  applySession(user, false)
  return user
}

export async function signIn(input: { email: string; password?: string }): Promise<PlatformUser | null> {
  const email = input.email.trim().toLowerCase()

  if (useSupabaseAuth && input.password) {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password: input.password })
    if (error) throw error
  }

  const user = await backend.signIn(email)
  if (user) applySession(user, true)
  return user
}

/** Quick demo sign-in for the OAuth buttons when no real provider is wired. */
export async function quickContinue(provider: 'google' | 'apple'): Promise<PlatformUser> {
  const token = Math.random().toString(36).slice(2, 8)
  return signUp({ name: `${provider === 'google' ? 'Google' : 'Apple'} User`, email: `${provider}.${token}@speakai.app` })
}

export async function signOut(): Promise<void> {
  if (useSupabaseAuth) {
    await getSupabaseClient().auth.signOut().then(() => undefined, () => undefined)
  }
  // store.signOut() clears local flags + the backend session, and also ends the
  // Clerk session (window.Clerk) so every sign-out path is uniform.
  useAppStore.getState().signOut()
}

/** Persist a freshly-chosen role onto the current backend user (called from /role). */
export async function persistRole(role: Role): Promise<void> {
  const id = backend.currentUserId()
  if (id) await backend.updateUser(id, { role }).catch(() => undefined)
}
