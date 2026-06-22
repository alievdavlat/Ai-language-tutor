import { SUPPORTED_LANGUAGES } from '@shared/constants'
import type { TargetLanguage } from '@shared/types'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'

interface LanguageStepProps {
  value: TargetLanguage
  onChange: (lang: TargetLanguage) => void
  onNext: () => void
  onBack: () => void
}

export default function LanguageStep({
  value,
  onChange,
  onNext,
  onBack
}: LanguageStepProps): JSX.Element {
  const t = useT()
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 sm:p-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-grad-brand shadow-glow mb-3 text-2xl">🌍</span>
        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{t('ob.lang.eyebrow')}</p>
        <h1 className="text-3xl font-black tracking-tight text-white mt-1">{t('ob.lang.title')}</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          {t('ob.lang.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map((l) => {
          const active = value === l.code
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
              <span className="text-3xl leading-none">{l.flag}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{l.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{l.nativeName}</p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-5">
        {t('ob.lang.changeLater')}
      </p>

      <div className="flex items-center justify-between mt-6 gap-3">
        <Button onClick={onBack} className="!bg-white/[0.05] !text-slate-300 hover:!bg-white/[0.08]">← {t('common.back')}</Button>
        <Button onClick={onNext} className="!px-8">{t('common.continue')} →</Button>
      </div>
    </div>
  )
}
