/**
 * i18n runtime (Task #38). Dependency-free: a tiny zustand store holds the
 * active UI language (persisted to localStorage), and `useT()` returns a
 * translate function. Missing keys fall back English → raw key.
 *
 * Usage:
 *   const t = useT()
 *   <span>{t('nav.home')}</span>
 *   const [lang, setLang] = useUILanguage()
 */
import { create } from 'zustand'
import { STRINGS, type StringKey, type UILanguage } from './strings'

const LS_KEY = 'speakai.uiLanguage'

function detectInitial(): UILanguage {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage?.getItem(LS_KEY)
    if (saved === 'en' || saved === 'uz' || saved === 'ru') return saved
    const nav = window.navigator?.language?.slice(0, 2)
    if (nav === 'uz' || nav === 'ru') return nav
  }
  return 'en'
}

interface I18nState {
  lang: UILanguage
  setLang: (lang: UILanguage) => void
}

export const useI18n = create<I18nState>((set) => ({
  lang: detectInitial(),
  setLang: (lang) => {
    if (typeof window !== 'undefined') window.localStorage?.setItem(LS_KEY, lang)
    if (typeof document !== 'undefined') document.documentElement.lang = lang
    set({ lang })
  }
}))

/** Pure translate (use in non-React code). */
export function translate(lang: UILanguage, key: StringKey, vars?: Record<string, string | number>): string {
  const raw = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
}

/** React hook returning a translate function bound to the active language. */
export function useT(): (key: StringKey, vars?: Record<string, string | number>) => string {
  const lang = useI18n((s) => s.lang)
  return (key, vars) => translate(lang, key, vars)
}

/** [activeLanguage, setLanguage]. */
export function useUILanguage(): [UILanguage, (lang: UILanguage) => void] {
  const lang = useI18n((s) => s.lang)
  const setLang = useI18n((s) => s.setLang)
  return [lang, setLang]
}

export { UI_LANGUAGES } from './strings'
export type { UILanguage, StringKey } from './strings'
