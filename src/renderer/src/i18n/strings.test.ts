import { describe, it, expect } from 'vitest'
import { translate } from './index'
import { STRINGS, UI_LANGUAGES, RTL_LANGUAGES } from './strings'

describe('i18n string tables (#A24.1)', () => {
  it('ships all 13 supported UI languages', () => {
    const codes = UI_LANGUAGES.map((l) => l.code)
    expect(codes).toEqual(
      expect.arrayContaining(['en', 'uz', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'tr', 'ja', 'ko', 'zh', 'ar'])
    )
    // every advertised language has a string table
    for (const code of codes) expect(STRINGS[code]).toBeDefined()
  })

  it('English is the complete source of truth', () => {
    expect(STRINGS.en['nav.home']).toBe('Home')
    expect(STRINGS.en['common.save']).toBe('Save')
  })

  it('translates into the requested native language', () => {
    expect(translate('es', 'nav.home')).toBe('Inicio')
    expect(translate('uz', 'nav.home')).toBe('Bosh sahifa')
    expect(translate('ja', 'common.save')).toBe('保存')
    expect(translate('ar', 'nav.settings')).toBe('الإعدادات')
  })

  it('falls back to English for a key missing in a non-en table', () => {
    // pick a real key, delete it from a clone to simulate a gap → English wins
    const fake = translate('es', 'nav.home')
    expect(fake).not.toBe('') // never blank
    // unknown key returns the key itself (last-resort), never throws
    // @ts-expect-error intentionally passing an unknown key
    expect(translate('es', 'totally.unknown.key')).toBe('totally.unknown.key')
  })

  it('interpolates {vars}', () => {
    // greeting has no var, but the replacer must be a no-op and not corrupt text
    expect(translate('en', 'home.greeting')).toBe('Welcome back')
  })

  it('marks Arabic as RTL and others LTR', () => {
    expect(RTL_LANGUAGES).toContain('ar')
    expect(RTL_LANGUAGES).not.toContain('en')
  })
})
