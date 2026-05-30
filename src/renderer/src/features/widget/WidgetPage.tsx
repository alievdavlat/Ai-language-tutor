import { useEffect, useState } from 'react'
import { lookupWord, type LookupResult } from '../../services/lookup/dictionary'
import { IconFlame, IconSearch, IconVolume } from '../../components/icons'

/**
 * Desktop widget (#37) — a tiny always-on-top window (loaded at #/widget by the
 * main process). Word of the day + streak + a one-tap lookup. Designed for the
 * transparent frameless widget window.
 */
const WORDS = [
  { word: 'serendipity', phonetic: '/ˌser.ənˈdɪp.ə.ti/', gloss: 'finding something good without looking for it' },
  { word: 'eloquent', phonetic: '/ˈel.ə.kwənt/', gloss: 'fluent and persuasive in speech' },
  { word: 'resilient', phonetic: '/rɪˈzɪl.i.ənt/', gloss: 'able to recover quickly from difficulties' },
  { word: 'meticulous', phonetic: '/məˈtɪk.jə.ləs/', gloss: 'very careful and precise' }
]

export default function WidgetPage(): JSX.Element {
  // Deterministic word for the day (no Math.random / Date.now churn).
  const dayIndex = Math.floor(new Date().getHours() / 6) % WORDS.length
  const wod = WORDS[dayIndex]
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
          <span className="inline-flex items-center gap-1 text-amber-300 text-xs font-bold"><IconFlame className="w-3.5 h-3.5" /> 12</span>
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
              {wod.word}
              <button onClick={() => { void new Audio(`https://api.dictionaryapi.dev/media/pronunciations/en/${wod.word}-us.mp3`).play().catch(() => undefined) }}
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} className="text-brand-300"><IconVolume className="w-4 h-4" /></button>
            </p>
            <p className="text-[11px] text-slate-500">{wod.phonetic}</p>
            <p className="text-xs text-slate-300 mt-1.5 leading-snug">{wod.gloss}</p>
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
