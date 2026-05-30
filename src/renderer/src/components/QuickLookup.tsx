import { useEffect, useRef, useState } from 'react'
import { lookupWord, type LookupResult } from '../services/lookup/dictionary'
import { cn } from '../lib/classnames'
import { IconSearch, IconVolume, IconX } from './icons'

/**
 * Global quick-lookup overlay (#37). Opens on the Electron global hotkey
 * (Ctrl/Cmd+Shift+Space, even when the app is in the background) and on an
 * in-app Ctrl/Cmd+K so it also works in the browser preview. A command-palette
 * over a free dictionary API.
 */
export default function QuickLookup(): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Electron global hotkey (works when unfocused).
  useEffect(() => {
    const api = (window as unknown as { api?: { productivity?: { onQuickLookup: (cb: () => void) => () => void } } }).api
    if (!api?.productivity?.onQuickLookup) return
    return api.productivity.onQuickLookup(() => setOpen(true))
  }, [])

  // In-app fallback: Ctrl/Cmd+K (and Esc to close).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const search = async (term: string): Promise<void> => {
    if (!term.trim()) { setResult(null); return }
    setLoading(true)
    setResult(await lookupWord(term))
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl mx-4 rounded-2xl border border-white/12 bg-[#0f1424] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <form
          onSubmit={(e) => { e.preventDefault(); void search(q) }}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10"
        >
          <IconSearch className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Look up any word…"
            className="flex-1 bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-500 border border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
          <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white"><IconX className="w-4 h-4" /></button>
        </form>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading && <p className="px-4 py-6 text-sm text-slate-400 text-center">Looking up…</p>}
          {!loading && !result && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              <p>Type a word and press Enter.</p>
              <p className="text-xs mt-2 text-slate-600">Tip: the global hotkey is <kbd className="font-mono text-slate-400">Ctrl/⌘ + Shift + Space</kbd> anywhere on your computer.</p>
            </div>
          )}
          {!loading && result && (
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-white">{result.word}</h3>
                {result.phonetic && <span className="text-sm text-slate-400">{result.phonetic}</span>}
                {result.audio && (
                  <button onClick={() => { void new Audio(result.audio).play().catch(() => undefined) }} className="text-brand-300 hover:text-brand-200"><IconVolume className="w-4 h-4" /></button>
                )}
              </div>
              {result.senses.length === 0 ? (
                <p className="text-sm text-slate-400">No definition found. Check the spelling, or it may not be an English word.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {result.senses.map((s, i) => (
                    <div key={i}>
                      <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200')}>{s.partOfSpeech}</span>
                      <p className="text-sm text-slate-200 mt-1.5">{s.definition}</p>
                      {s.example && <p className="text-xs text-slate-500 italic mt-0.5">"{s.example}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
