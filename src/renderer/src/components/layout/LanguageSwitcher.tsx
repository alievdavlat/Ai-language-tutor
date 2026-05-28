import { useState } from 'react'
import { SUPPORTED_LANGUAGES } from '@shared/constants'
import type { TargetLanguage } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useTargetLanguage } from '../../lib/language'
import { cn } from '../../lib/classnames'
import { IconChevronRight } from '../icons'

export default function LanguageSwitcher(): JSX.Element {
  const [open, setOpen] = useState(false)
  const cur = useTargetLanguage()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)

  const pick = (code: TargetLanguage): void => {
    setOpen(false)
    if (!profile || code === cur.code) return
    const next = { ...profile, targetLanguage: code, updatedAt: new Date().toISOString() }
    setProfile(next)
    // Best-effort persistence — fire-and-forget so the sidebar stays snappy.
    if (typeof window !== 'undefined' && window.api?.profile?.save) {
      void window.api.profile.save(next)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.07] px-3 py-2 text-sm hover:bg-white/[0.07] transition"
      >
        <span className="text-base leading-none">{cur.flag}</span>
        <span className="flex-1 text-left text-slate-200 truncate">Learning: {cur.name}</span>
        <IconChevronRight className={cn('w-3.5 h-3.5 text-slate-500 transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl bg-canvas-soft border border-white/10 shadow-xl shadow-black/40 p-1 max-h-64 overflow-y-auto">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition',
                l.code === cur.code ? 'bg-brand-500/15 text-white' : 'text-slate-300 hover:bg-white/5'
              )}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.name}</span>
              <span className="text-[10px] text-slate-500 ml-auto truncate">{l.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
