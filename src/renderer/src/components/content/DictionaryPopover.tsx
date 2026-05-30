import { useEffect, useRef, useState } from 'react'
import { lookup, translate, type DictEntry } from '../../services/dictionary'
import { isWordSaved } from '../../services/content/progress'
import { saveVocab, removeVocab } from '../../services/content/vocab'
import { IconBookmark, IconVolume, IconX } from '../icons'
import { Spinner } from '../ui'
import { cn } from '../../lib/classnames'

/**
 * Floating dictionary card anchored to a clicked word. Shows phonetic +
 * meanings (offline-first, online fallback), a native-language translation when
 * available, speak-aloud, and a save-to-vocabulary toggle.
 */

interface DictionaryPopoverProps {
  word: string
  /** Target language of the word (always 'en' here). */
  lang: string
  /** Learner's native language for the translation line. */
  nativeLang?: string
  /** Label stored with the saved word, e.g. "Watch · Grit". */
  source?: string
  anchor: { left: number; top: number; bottom: number } | null
  onClose: () => void
  onSavedChange?: () => void
}

function speak(word: string): void {
  try {
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* no TTS */ }
}

export default function DictionaryPopover({
  word, lang, nativeLang, source, anchor, onClose, onSavedChange
}: DictionaryPopoverProps): JSX.Element | null {
  const [entry, setEntry] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(() => isWordSaved(word, lang))
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSaved(isWordSaved(word, lang))
    lookup(word).then((r) => { if (!cancelled) { setEntry(r.entry); setLoading(false) } })
    return () => { cancelled = true }
  }, [word, lang])

  // Close on outside click / Esc.
  useEffect(() => {
    function onDown(e: MouseEvent): void {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent): void { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [onClose])

  if (!anchor) return null

  const nativeTr = nativeLang && nativeLang !== 'en' ? (entry?.tr?.[nativeLang] ?? translate(word, nativeLang)) : undefined

  // Position: prefer below the word, clamp to viewport.
  const W = 300
  const left = Math.min(Math.max(8, anchor.left), window.innerWidth - W - 8)
  const placeAbove = anchor.bottom > window.innerHeight - 220
  const style: React.CSSProperties = placeAbove
    ? { left, bottom: window.innerHeight - anchor.top + 8, width: W }
    : { left, top: anchor.bottom + 8, width: W }

  function toggleSave(): void {
    if (saved) { removeVocab(word, lang); setSaved(false) }
    else {
      saveVocab({
        word, lang,
        pos: entry?.meanings[0]?.pos,
        meaning: entry?.meanings[0]?.definition,
        translation: nativeTr,
        example: entry?.meanings[0]?.example,
        source
      })
      setSaved(true)
    }
    onSavedChange?.()
  }

  return (
    <div
      ref={cardRef}
      style={style}
      className="fixed z-50 rounded-2xl border border-white/15 bg-canvas-soft/95 backdrop-blur-xl shadow-2xl p-4 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-bold text-white leading-tight">{word}</p>
          {entry?.phonetic && <p className="text-xs text-brand-300 font-mono">{entry.phonetic}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => speak(word)} title="Pronounce" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200">
            <IconVolume className="w-4 h-4" />
          </button>
          <button onClick={onClose} title="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {nativeTr && (
        <p className="mt-2 text-sm text-emerald-200">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold mr-1.5">{nativeLang}</span>
          {nativeTr}
        </p>
      )}

      <div className="mt-2 max-h-44 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-2"><Spinner /> Looking up…</div>
        ) : entry ? (
          <div className="flex flex-col gap-2">
            {entry.meanings.map((m, i) => (
              <div key={i}>
                <p className="text-[11px] italic text-slate-500">{m.pos}</p>
                <p className="text-sm text-slate-200">{m.definition}</p>
                {m.example && <p className="text-xs text-slate-400 mt-0.5">"{m.example}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-1">No definition found{navigator.onLine ? '' : ' (offline)'}.</p>
        )}
      </div>

      <button
        onClick={toggleSave}
        className={cn(
          'mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-bold px-3 py-2 transition',
          saved ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 'bg-brand-500/20 text-brand-200 hover:bg-brand-500/30'
        )}
      >
        <IconBookmark className="w-3.5 h-3.5" /> {saved ? 'Saved to vocabulary' : 'Save to vocabulary'}
      </button>
    </div>
  )
}
