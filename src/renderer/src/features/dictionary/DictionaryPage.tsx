import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading, Spinner } from '../../components/ui'
import { IconBookmark, IconSearch, IconVolume } from '../../components/icons'
import { lookup, translate, PHRASEBOOK, type DictEntry } from '../../services/dictionary'
import { saveVocab, isWordSaved } from '../../services/content/vocab'
import { useContentState } from '../../services/content/progress'
import { useAppStore } from '../../store/useAppStore'

function speak(word: string): void {
  try {
    // "Hello / Hi" must not be read as "Hello slash Hi" — speak natural variants.
    const spoken = word.replace(/\s*\/\s*/g, ', ').replace(/[()[\]]/g, ' ').trim()
    const u = new SpeechSynthesisUtterance(spoken)
    u.lang = 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* no TTS */ }
}

export default function DictionaryPage(): JSX.Element {
  const nativeLang = useAppStore((s) => s.profile?.nativeLanguage ?? 'uz')
  const content = useContentState()
  const [term, setTerm] = useState('')
  const [entry, setEntry] = useState<DictEntry | null>(null)
  const [source, setSource] = useState<'offline' | 'online' | 'none' | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeCat, setActiveCat] = useState(PHRASEBOOK[0].id)

  async function search(q: string): Promise<void> {
    const w = q.trim()
    if (!w) return
    setLoading(true)
    const r = await lookup(w)
    setEntry(r.entry)
    setSource(r.source)
    setLoading(false)
  }

  const nativeTr = entry && nativeLang !== 'en' ? (entry.tr?.[nativeLang] ?? translate(entry.word, nativeLang)) : undefined
  const saved = entry ? isWordSaved(entry.word, 'en') : false
  void content // re-render when save state changes
  const cat = PHRASEBOOK.find((c) => c.id === activeCat) ?? PHRASEBOOK[0]

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-3xl mx-auto flex flex-col gap-6">
        <PageHeader
          eyebrow="Offline dictionary"
          title="Dictionary & phrasebook"
          subtitle="Look up any English word — works offline, with definitions and translations."
        />

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); search(term) }} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-4 py-2.5">
            <IconSearch className="w-4 h-4 text-slate-400" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Type a word…"
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
            />
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Look up</button>
        </form>

        {/* Result */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400"><Spinner /> Looking up…</div>
        ) : entry ? (
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">{entry.word}</h2>
                {entry.phonetic && <p className="text-sm text-brand-300 font-mono">{entry.phonetic}</p>}
                {source && <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{source === 'online' ? 'online dictionary' : source === 'offline' ? 'offline' : ''}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => speak(entry.word)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200" title="Pronounce"><IconVolume className="w-4 h-4" /></button>
                <button
                  onClick={() => saveVocab({ word: entry.word, lang: 'en', pos: entry.meanings[0]?.pos, meaning: entry.meanings[0]?.definition, translation: nativeTr, example: entry.meanings[0]?.example, source: 'Dictionary' })}
                  className={cn('inline-flex items-center gap-1.5 rounded-full text-xs font-bold px-3 py-2 transition', saved ? 'bg-amber-500/20 text-amber-200' : 'bg-brand-500/20 text-brand-200 hover:bg-brand-500/30')}
                >
                  <IconBookmark className="w-3.5 h-3.5" /> {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
            {nativeTr && <p className="mt-3 text-sm text-emerald-200"><span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold mr-1.5">{nativeLang}</span>{nativeTr}</p>}
            <div className="mt-3 flex flex-col gap-3">
              {entry.meanings.map((m, i) => (
                <div key={i}>
                  <p className="text-[11px] italic text-slate-500">{m.pos}</p>
                  <p className="text-sm text-slate-200">{m.definition}</p>
                  {m.example && <p className="text-xs text-slate-400 mt-0.5">"{m.example}"</p>}
                </div>
              ))}
            </div>
          </div>
        ) : source === 'none' ? (
          <p className="text-sm text-slate-400">No definition found{navigator.onLine ? '' : ' (offline)'} — try another word.</p>
        ) : null}

        {/* Phrasebook */}
        <div>
          <SectionHeading title="Phrasebook" subtitle="Common phrases with translations" />
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PHRASEBOOK.map((c) => (
              <button key={c.id} onClick={() => setActiveCat(c.id)} className={cn('rounded-full text-xs font-bold px-3 py-1.5 transition border', activeCat === c.id ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]')}>
                {c.emoji} {c.title}
              </button>
            ))}
          </div>
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {cat.phrases.map((ph) => (
              <div key={ph.en} className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => speak(ph.en)} className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 flex items-center justify-center shrink-0" title="Pronounce"><IconVolume className="w-4 h-4" /></button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{ph.en}</p>
                  <p className="text-xs text-emerald-200">{ph.tr[nativeLang] ?? ph.tr.uz ?? Object.values(ph.tr)[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
