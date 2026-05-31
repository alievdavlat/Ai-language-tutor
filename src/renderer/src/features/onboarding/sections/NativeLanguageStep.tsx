import { UI_LANGUAGES, type UILanguage } from '../../../i18n'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/classnames'

interface NativeLanguageStepProps {
  value: UILanguage
  onChange: (lang: UILanguage) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Second language step: the learner's OWN language. Drives the whole-app UI
 * text (sidebar, pages) and the language vocabulary meanings are shown in.
 * Offered set = the languages we ship full UI translations for (en/uz/ru);
 * more are added as their string tables land.
 */
export default function NativeLanguageStep({
  value,
  onChange,
  onNext,
  onBack
}: NativeLanguageStepProps): JSX.Element {
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 sm:p-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-grad-brand shadow-glow mb-3 text-2xl">🗣️</span>
        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Step 2 — Your language</p>
        <h1 className="text-3xl font-black tracking-tight text-white mt-1">What&apos;s your native language?</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          The app&apos;s menus and text will be in this language, and word meanings will be translated into it.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {UI_LANGUAGES.map((l) => {
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
                <p className="text-sm font-bold text-white">{l.nativeName}</p>
                <p className="text-[11px] text-slate-400 truncate">{l.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-5">
        You can change this later in Settings. More interface languages are on the way.
      </p>

      <div className="flex items-center justify-between mt-6 gap-3">
        <Button onClick={onBack} className="!bg-white/[0.05] !text-slate-300 hover:!bg-white/[0.08]">← Back</Button>
        <Button onClick={onNext} className="!px-8">Continue →</Button>
      </div>
    </div>
  )
}
