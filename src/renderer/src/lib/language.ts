import { getLanguage, SUPPORTED_LANGUAGES, type LanguageDef } from '@shared/constants'
import type { TargetLanguage } from '@shared/types'
import { useAppStore } from '../store/useAppStore'

/**
 * Returns the language definition the user is currently learning.
 * Reads from the profile; falls back to English when no profile is loaded.
 */
export function useTargetLanguage(): LanguageDef {
  const profile = useAppStore((s) => s.profile)
  return getLanguage(profile?.targetLanguage ?? 'en')
}

/**
 * Convenience selector for components that only care about the code.
 */
export function useTargetLanguageCode(): TargetLanguage {
  const profile = useAppStore((s) => s.profile)
  return profile?.targetLanguage ?? 'en'
}

export { SUPPORTED_LANGUAGES, getLanguage }
export type { LanguageDef }
