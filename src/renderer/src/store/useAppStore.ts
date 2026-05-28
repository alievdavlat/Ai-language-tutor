import { create } from 'zustand'
import type {
  HardwareProfile,
  ModelRecommendation,
  OllamaStatus,
  UserProfile
} from '@shared/types'
import { backend } from '../services/backend'

export type AutoSetupPhase = null | 'starting' | 'pulling' | 'ready' | 'failed'

export interface AutoSetupState {
  phase: AutoSetupPhase
  pullPct: number
}

/** UI-level role until real auth (Clerk) lands in a later phase. */
export type UserRole = 'student' | 'teacher'

interface AppState {
  booted: boolean
  bootError: string | null
  hw: HardwareProfile | null
  rec: ModelRecommendation | null
  ollama: OllamaStatus | null
  profile: UserProfile | null
  autoSetup: AutoSetupState
  role: UserRole
  /** Whether the user has explicitly picked a role. The default `role` field
   *  is 'student' for typing convenience — `roleSelected` tells us if that
   *  is the real pick or just the placeholder. */
  roleSelected: boolean
  /** Until real Clerk lands this is a local flag toggled by /signin. */
  authenticated: boolean
  /** True once the user has finished onboarding (picked role + goals). */
  onboardingComplete: boolean

  setProfile: (profile: UserProfile | null) => void
  setRole: (role: UserRole) => void
  setAuthenticated: (authenticated: boolean) => void
  setOnboardingComplete: (complete: boolean) => void
  signOut: () => void
  bootstrap: () => Promise<void>
  refreshOllama: () => Promise<void>
}

/** Used when the status IPC call itself fails — treated the same as "not running". */
const FALLBACK_OLLAMA: OllamaStatus = {
  installed: false,
  running: false,
  models: []
}

async function safely<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[bootstrap:${label}]`, err)
    return null
  }
}

function hasApi(): boolean {
  return typeof window !== 'undefined' && !!window.api
}

/**
 * Silently start Ollama and pull the recommended model if needed.
 * Called after the app boots — never blocks the UI.
 */
async function runAutoSetup(
  rec: ModelRecommendation | null,
  initial: OllamaStatus,
  update: (patch: Partial<AppState>) => void
): Promise<void> {
  if (!rec) return
  let current = initial

  // Step 1: Start Ollama if installed but not running
  if (!current.running) {
    update({ autoSetup: { phase: 'starting', pullPct: 0 } })
    const result = await safely('ollama.start', () => window.api.ollama.start())
    if (result?.running) {
      current = result.status
      update({ ollama: current })
    } else {
      update({ autoSetup: { phase: 'failed', pullPct: 0 } })
      return
    }
  }

  // Step 2: Pull the recommended model if not already downloaded
  if (!current.models.includes(rec.llm.tag)) {
    update({ autoSetup: { phase: 'pulling', pullPct: 0 } })

    const unsub = window.api.ollama.onAutoPullProgress((p) => {
      update({ autoSetup: { phase: 'pulling', pullPct: p.pct ?? 0 } })
    })

    const pullResult = await safely('ollama.autoPull', () =>
      window.api.ollama.autoPull(rec.llm.tag)
    )
    unsub()

    if (pullResult?.ok) {
      const fresh = await safely('ollama.status', () => window.api.ollama.status())
      if (fresh) update({ ollama: fresh })
      update({ autoSetup: { phase: 'ready', pullPct: 100 } })
    } else {
      update({ autoSetup: { phase: 'failed', pullPct: 0 } })
    }
  } else {
    update({ autoSetup: { phase: 'ready', pullPct: 100 } })
  }
}

// localStorage keys for the lightweight stand-in for real auth & onboarding state.
const LS_AUTH = 'speakai.authenticated'
const LS_ONBOARDING = 'speakai.onboardingComplete'
const LS_ROLE = 'speakai.role'

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const v = window.localStorage?.getItem(key)
  return v === null ? fallback : v === '1'
}
function readRole(): UserRole {
  if (typeof window === 'undefined') return 'student'
  const v = window.localStorage?.getItem(LS_ROLE)
  return v === 'teacher' ? 'teacher' : 'student'
}
function readRoleSelected(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage?.getItem(LS_ROLE) !== null
}
function writeBool(key: string, v: boolean): void {
  if (typeof window !== 'undefined') window.localStorage?.setItem(key, v ? '1' : '0')
}

export const useAppStore = create<AppState>((set, get) => ({
  booted: false,
  bootError: null,
  hw: null,
  rec: null,
  ollama: null,
  profile: null,
  autoSetup: { phase: null, pullPct: 0 },
  role: readRole(),
  roleSelected: readRoleSelected(),
  authenticated: readBool(LS_AUTH, false),
  onboardingComplete: readBool(LS_ONBOARDING, false),

  setProfile: (profile) => set({ profile }),
  setRole: (role) => {
    if (typeof window !== 'undefined') window.localStorage?.setItem(LS_ROLE, role)
    set({ role, roleSelected: true })
  },
  setAuthenticated: (authenticated) => {
    writeBool(LS_AUTH, authenticated)
    set({ authenticated })
  },
  setOnboardingComplete: (complete) => {
    writeBool(LS_ONBOARDING, complete)
    set({ onboardingComplete: complete })
  },
  signOut: () => {
    writeBool(LS_AUTH, false)
    writeBool(LS_ONBOARDING, false)
    if (typeof window !== 'undefined') window.localStorage?.removeItem(LS_ROLE)
    set({ authenticated: false, onboardingComplete: false, profile: null, role: 'student', roleSelected: false })
  },

  bootstrap: async () => {
    if (get().booted) return
    if (!hasApi()) {
      set({
        booted: true,
        bootError:
          'Preload bridge (window.api) is not available. The preload script did not load. Check DevTools console.'
      })
      return
    }

    const [recResult, ollamaStatus, profile] = await Promise.all([
      safely('hardware.recommend', () => window.api.hardware.recommend()),
      safely('ollama.status', () => window.api.ollama.status()),
      safely('profile.load', () => window.api.profile.load())
    ])

    const ollama = ollamaStatus ?? FALLBACK_OLLAMA
    const rec = recResult?.rec ?? null

    // Migrate legacy `targetLanguage: 'english'` (pre-multi-language type widening)
    // to the new ISO code 'en'. Same persistence flag check applies.
    let migrated = profile
    if (profile && (profile.targetLanguage as unknown) === 'english') {
      migrated = { ...profile, targetLanguage: 'en' }
      try { await window.api.profile.save(migrated) } catch { /* swallow — display lookup falls back to 'en' anyway */ }
    }

    // Auto-seed the first-launch flags for users who have a complete profile from
    // a pre-PR install (no LS_AUTH/LS_ONBOARDING/LS_ROLE keys yet). Without this
    // they'd be forced through the funnel again, overwriting their existing
    // profile with empty defaults at the end of onboarding.
    const hasCompleteProfile = !!migrated && migrated.goals.length > 0
    const state = get()
    if (hasCompleteProfile && !state.authenticated && !state.onboardingComplete && !state.roleSelected) {
      writeBool(LS_AUTH, true)
      writeBool(LS_ONBOARDING, true)
      if (typeof window !== 'undefined') window.localStorage?.setItem(LS_ROLE, 'student')
    }

    set({
      booted: true,
      bootError: null,
      hw: recResult?.hw ?? null,
      rec,
      ollama,
      profile: migrated ?? null,
      authenticated: hasCompleteProfile ? true : state.authenticated,
      onboardingComplete: hasCompleteProfile ? true : state.onboardingComplete,
      roleSelected: hasCompleteProfile ? true : state.roleSelected
    })

    // Make sure the local backend has a current user so pages can read/write
    // likes, saves, enrollments, follows etc. without showing "sign in first".
    // If we already have a Supabase-style session we'd use that; for the mock
    // backend we sign in the canonical student account (or create it).
    if (hasCompleteProfile && !backend.currentUserId()) {
      const email = `${(migrated?.name ?? 'aziz').toLowerCase().replace(/\s+/g, '.')}@speakai.app`
      const existing = await backend.signIn(email).catch(() => null)
      if (!existing) {
        await backend.signUp({
          name: migrated?.name ?? 'You',
          email,
          role: get().role
        }).catch(() => null)
      }
    }

    // Auto-setup runs in the background after the UI is painted.
    void runAutoSetup(rec, ollama, set)
  },

  refreshOllama: async () => {
    const ollama = await safely('ollama.status', () => window.api.ollama.status())
    if (ollama) set({ ollama })
  }
}))
