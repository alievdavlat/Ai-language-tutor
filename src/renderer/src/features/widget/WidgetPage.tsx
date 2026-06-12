import { useEffect, useState } from 'react'
import { lookupWord, type LookupResult } from '../../services/lookup/dictionary'
import { useVocab } from '../../services/study/useStudy'
import { useStats } from '../../services/progress/useProgress'
import { useAppStore } from '../../store/useAppStore'
import { IconFlame, IconSearch, IconVolume } from '../../components/icons'

/**
 * Desktop widget (#37) — a tiny always-on-top window (loaded at #/widget by the
 * main process). Word of the day + streak + a one-tap lookup. Designed for the
 * transparent frameless widget window.
 */
const FALLBACK = { term: 'serendipity', translation: 'finding something good without looking for it', example: undefined as string | undefined }

export default function WidgetPage(): JSX.Element {
  const targetLanguage = useAppStore((s) => s.profile?.targetLanguage) ?? 'en'
  const { cards } = useVocab(targetLanguage)
  const { streak } = useStats()
  // Deterministic word for the day from the learner's own deck — rotates daily.
  const dayKey = Math.floor(new Date().setHours(0, 0, 0, 0) / 86_400_000)
  const wod = cards.length > 0 ? cards[dayKey % cards.length] : FALLBACK
  const [q, setQ] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)

  useEffect(() => {
    document.body.style.background = 'transparent'
  }, [])

  return (
    <div className="w-full h-screen p-2 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="w-full h-full rounded-2xl border border-white/12 bg-[#0f1424]/95 backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">Word of the day</p>
          <span className="inline-flex items-center gap-1 text-amber-300 text-xs font-bold"><IconFlame className="w-3.5 h-3.5" /> {streak}</span>
        </div>

        {result ? (
          <div className="flex-1 overflow-y-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <p className="text-lg font-bold text-white">{result.word}</p>
            <p className="text-xs text-slate-300 mt-1">{result.senses[0]?.definition ?? 'No definition found.'}</p>
            <button onClick={() => setResult(null)} className="text-[11px] text-brand-300 mt-2">← word of the day</button>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-lg font-bold text-white flex items-center gap-2">
              {wod.term}
              <button onClick={() => { void new Audio(`https://api.dictionaryapi.dev/media/pronunciations/en/${wod.term}-us.mp3`).play().catch(() => undefined) }}
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} className="text-brand-300"><IconVolume className="w-4 h-4" /></button>
            </p>
            <p className="text-xs text-slate-300 mt-1.5 leading-snug">{wod.translation}</p>
            {wod.example && <p className="text-[11px] text-slate-500 mt-1 italic leading-snug">{wod.example}</p>}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); void lookupWord(q).then(setResult) }}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5"
        >
          <IconSearch className="w-3.5 h-3.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quick lookup…" className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none" />
        </form>
      </div>
    </div>
  )
}
