/**
 * Settings → Language: "Your language" (native) picker (Task #A24). Lets the
 * learner change their native language at any time. Writing it through
 * `useSetNativeLanguage` persists `profile.nativeLanguage`, re-migrates vocab
 * meanings (useVocab keys on the native language), and — for en/uz/ru — swaps
 * the whole-app UI text too. Any of the supported languages can be picked since
 * the app is global; meanings for languages without a bundled table are
 * translated on demand.
 */
import { SUPPORTED_LANGUAGES } from '@shared/constants'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'
import { useNativeLanguageCode, useSetNativeLanguage } from '../../../lib/language'

export default function NativeLanguageSection(): JSX.Element {
  const t = useT()
  const current = useNativeLanguageCode()
  const setNative = useSetNativeLanguage()

  return (
    <Card>
      <header className="mb-4">
        <h2 className="text-base font-bold text-white tracking-tight">{t('settings.nativeLanguage')}</h2>
        <p className="text-xs text-slate-400 mt-1">{t('settings.nativeLanguageHint')}</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {SUPPORTED_LANGUAGES.map((l) => {
          const active = current === l.code
          return (
            <button
              key={l.code}
              onClick={() => setNative(l.code)}
              className={cn(
                'rounded-2xl border p-4 text-left transition flex items-center gap-3',
                active
                  ? 'border-brand-400/60 bg-brand-500/15 ring-2 ring-brand-400/30'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
              )}
            >
              <span className="text-3xl leading-none shrink-0">{l.flag}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{l.nativeName}</p>
                <p className="text-[11px] text-slate-400 truncate">{l.name}</p>
              </div>
              {active && (
                <span className="ml-auto inline-flex w-5 h-5 rounded-full bg-brand-500 text-white items-center justify-center text-[10px] font-black shrink-0">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-slate-500 mt-4">{t('settings.changeLater')}</p>
    </Card>
  )
}
