import { AI_PROVIDERS, getProvider } from '@shared/constants'
import type { AIProvider, AIProviderId } from '@shared/constants'
import { useAppStore } from '../store/useAppStore'

export interface ActiveAI {
  provider: AIProvider
  modelId: string
  token: string
}

/** Returns the configured cloud AI, or null when nothing is set up yet. */
export function useActiveAI(): ActiveAI | null {
  const ai = useAppStore((s) => s.profile?.settings.ai)
  if (!ai?.activeProviderId) return null
  const provider = getProvider(ai.activeProviderId as AIProviderId)
  if (!provider) return null
  const token = ai.tokens?.[provider.id]
  if (!token) return null
  const modelId = ai.models?.[provider.id] || provider.models[0]?.id || ''
  return { provider, modelId, token }
}

/** True when any AI feature (Speaking, IELTS sim, writing rubric) is ready. */
export function useIsAIReady(): boolean {
  return useActiveAI() !== null
}

export { AI_PROVIDERS, getProvider }
export type { AIProvider, AIProviderId }
