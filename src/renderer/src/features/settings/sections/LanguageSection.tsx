import { SUPPORTED_LANGUAGES } from '@shared/constants'
import type { TargetLanguage } from '@shared/types'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'
import UILanguageSwitch from '../../../components/ui/UILanguageSwitch'

interface LanguageSectionProps {
  current: TargetLanguage
  onChange: (lang: TargetLanguage) => void
}

export default function LanguageSection({ current, onChange }: LanguageSectionProps): JSX.Element {
  const t = useT()
  return (
    <Card>
      <header className="mb-4">
        <h2 className="text-base font-bold text-white tracking-tight">{t('settings.learningLanguage')}</h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('settings.learningLanguageHint')}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {SUPPORTED_LANGUAGES.map((l) => {
          const active = current === l.code
          return (
            <button
              key={l.code}
              onClick={() => onChange(l.code)}
              className={cn(
                'rounded-2xl border p-4 text-left transition flex items-center gap-3',
                active
                  ? 'border-brand-400/60 bg-brand-500/15 ring-2 ring-brand-400/30'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
              )}
            >
              <span className="text-3xl leading-none shrink-0">{l.flag}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{l.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{l.nativeName}</p>
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

      {/* Interface language — moved here from Privacy (it never belonged there). */}
      <header className="mt-7 mb-3 pt-5 border-t border-white/[0.06]">
        <h2 className="text-base font-bold text-white tracking-tight">{t('settings.uiLanguage')}</h2>
      </header>
      <UILanguageSwitch variant="list" />
    </Card>
  )
}
