import { useCallback } from 'react'
import { getLanguage, SUPPORTED_LANGUAGES, type LanguageDef } from '@shared/constants'
import type { TargetLanguage } from '@shared/types'
import { useAppStore } from '../store/useAppStore'
import { useI18n, type UILanguage } from '../i18n'

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

/** The languages we ship a full UI string table for. */
const UI_TABLE_LANGUAGES: ReadonlySet<string> = new Set<UILanguage>(['en', 'uz', 'ru'])

/**
 * Returns the learner's OWN language code (drives vocab meanings + UI text).
 * Falls back to English when no profile is loaded.
 */
export function useNativeLanguageCode(): string {
  const profile = useAppStore((s) => s.profile)
  return profile?.nativeLanguage ?? 'en'
}

/**
 * Setter for the native language. Writes `profile.nativeLanguage` (so it
 * persists and `useVocab` re-migrates word meanings — that hook keys its
 * effect on the native language), and mirrors it into the i18n UI-language
 * store when we ship a string table for it (en/uz/ru). Returns the same
 * fire-and-forget contract the sidebar/target switchers use.
 */
export function useSetNativeLanguage(): (code: string) => void {
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const setUILang = useI18n((s) => s.setLang)

  return useCallback(
    (code: string) => {
      // Always follow the UI language where we have a table — even before the
      // profile exists — so the chrome localises immediately.
      if (UI_TABLE_LANGUAGES.has(code)) setUILang(code as UILanguage)
      if (!profile || code === profile.nativeLanguage) return
      const next = { ...profile, nativeLanguage: code, updatedAt: new Date().toISOString() }
      setProfile(next)
      if (typeof window !== 'undefined' && window.api?.profile?.save) {
        void window.api.profile.save(next)
      }
    },
    [profile, setProfile, setUILang]
  )
}

export { SUPPORTED_LANGUAGES, getLanguage }
export type { LanguageDef }
