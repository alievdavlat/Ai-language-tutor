import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { IconChevronRight } from '../icons'

const LANGS = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish' },
  { code: 'fr', flag: '🇫🇷', name: 'French' },
  { code: 'de', flag: '🇩🇪', name: 'German' },
  { code: 'ru', flag: '🇷🇺', name: 'Russian' },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese' }
]

export default function LanguageSwitcher(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(LANGS[0])

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
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setCur(l); setOpen(false) }}
              className={cn('w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition', l.code === cur.code ? 'bg-brand-500/15 text-white' : 'text-slate-300 hover:bg-white/5')}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
