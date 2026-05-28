import type { TargetLanguage } from '../types/user.types'

/** Single source of truth for supported learning targets — used by Onboarding,
 * Sidebar language switcher, and every per-language data table. */
export interface LanguageDef {
  code: TargetLanguage
  name: string
  nativeName: string
  flag: string
  /** Hue used to tint UI accents when this language is active (not yet wired). */
  hue: string
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', hue: 'blue' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', hue: 'amber' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', hue: 'rose' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', hue: 'orange' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', hue: 'red' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', hue: 'emerald' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', hue: 'red' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', hue: 'pink' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', hue: 'violet' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', hue: 'green' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', hue: 'cyan' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', hue: 'sky' }
]

/**
 * Looks up a language by code. Accepts the legacy literal `'english'`
 * (pre-multi-language schema) as an alias for `'en'`. Falls back to English
 * for anything unrecognised so callers never see undefined.
 */
export function getLanguage(code: TargetLanguage | string): LanguageDef {
  const normalized = code === 'english' ? 'en' : code
  return SUPPORTED_LANGUAGES.find((l) => l.code === normalized) ?? SUPPORTED_LANGUAGES[0]
}
