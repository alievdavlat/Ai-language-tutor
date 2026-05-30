/**
 * Interface-language switcher (Task #38). Swaps the *UI* language (chrome),
 * not the learner's target language. Two layouts: a compact segmented control
 * (default) and a labelled card row for Settings.
 */
import { UI_LANGUAGES, useUILanguage } from '../../i18n'
import { cn } from '../../lib/classnames'

export default function UILanguageSwitch({
  variant = 'segmented',
  className
}: {
  variant?: 'segmented' | 'list'
  className?: string
}): JSX.Element {
  const [lang, setLang] = useUILanguage()

  if (variant === 'list') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {UI_LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
              lang === l.code
                ? 'border-brand-400/50 bg-brand-500/10'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
            )}
          >
            <span className="text-xl">{l.flag}</span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-white">{l.nativeName}</span>
              <span className="block text-[11px] text-slate-400">{l.label}</span>
            </span>
            {lang === l.code && <span className="text-brand-300 text-sm font-black">✓</span>}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('inline-flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1', className)}>
      {UI_LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.nativeName}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-bold transition',
            lang === l.code ? 'bg-grad-brand text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'
          )}
        >
          {l.flag} {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
