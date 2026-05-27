import { create } from 'zustand'
import type {
  HardwareProfile,
  ModelRecommendation,
  OllamaStatus,
  UserProfile
} from '@shared/types'

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

  setProfile: (profile: UserProfile | null) => void
  setRole: (role: UserRole) => void
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

export const useAppStore = create<AppState>((set, get) => ({
  booted: false,
  bootError: null,
  hw: null,
  rec: null,
  ollama: null,
  profile: null,
  autoSetup: { phase: null, pullPct: 0 },
  role: 'student',

  setProfile: (profile) => set({ profile }),
  setRole: (role) => set({ role }),

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

    set({
      booted: true,
      bootError: null,
      hw: recResult?.hw ?? null,
      rec,
      ollama,
      profile: profile ?? null
    })

    // Auto-setup runs in the background after the UI is painted.
    void runAutoSetup(rec, ollama, set)
  },

  refreshOllama: async () => {
    const ollama = await safely('ollama.status', () => window.api.ollama.status())
    if (ollama) set({ ollama })
  }
}))
