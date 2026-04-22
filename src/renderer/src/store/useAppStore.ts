import { create } from 'zustand'
import type {
  HardwareProfile,
  ModelRecommendation,
  OllamaStatus,
  UserProfile
} from '@shared/types'

interface AppState {
  booted: boolean
  bootError: string | null
  hw: HardwareProfile | null
  rec: ModelRecommendation | null
  ollama: OllamaStatus | null
  profile: UserProfile | null

  setProfile: (profile: UserProfile | null) => void
  bootstrap: () => Promise<void>
  refreshOllama: () => Promise<void>
}

const FALLBACK_OLLAMA: OllamaStatus = {
  installed: false,
  running: false,
  models: [],
  error: 'status call failed'
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

export const useAppStore = create<AppState>((set, get) => ({
  booted: false,
  bootError: null,
  hw: null,
  rec: null,
  ollama: null,
  profile: null,

  setProfile: (profile) => set({ profile }),

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

    const [recResult, ollama, profile] = await Promise.all([
      safely('hardware.recommend', () => window.api.hardware.recommend()),
      safely('ollama.status', () => window.api.ollama.status()),
      safely('profile.load', () => window.api.profile.load())
    ])

    set({
      booted: true,
      bootError: null,
      hw: recResult?.hw ?? null,
      rec: recResult?.rec ?? null,
      ollama: ollama ?? FALLBACK_OLLAMA,
      profile: profile ?? null
    })
  },

  refreshOllama: async () => {
    const ollama = await safely('ollama.status', () => window.api.ollama.status())
    if (ollama) set({ ollama })
  }
}))
