import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VocabItem } from '@shared/types'
import { cn } from '../../lib/classnames'
import { ProgressRing, StatCard, Tabs, type TabItem, Input } from '../../components/ui'
import { useTargetLanguage } from '../../lib/language'
import { useVocab } from '../../services/study/useStudy'
import { formatInterval } from '../../services/study/fsrs'
import { IconBolt, IconBook, IconBookmark, IconPlus, IconStar, IconVolume, IconX } from '../../components/icons'
import DictionaryPanel from '../dictionary/DictionaryPanel'

type Tab = 'mine' | 'saved' | 'dictionary'
const TABS: TabItem<Tab>[] = [
  { id: 'mine', label: 'My words' },
  { id: 'saved', label: 'Saved' },
  { id: 'dictionary', label: 'Dictionary' }
]

function speak(text: string, lang: string): void {
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/\s*\/\s*/g, ', '))
    u.lang = lang
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* no TTS */ }
}

// ─── Add-word modal ────────────────────────────────────────────────────────
function AddWordModal({ onClose, onSave }: { onClose: () => void; onSave: (v: { term: string; translation: string; example?: string; deck?: string }) => Promise<void> }): JSX.Element {
  const [term, setTerm] = useState('')
  const [translation, setTranslation] = useState('')
  const [example, setExample] = useState('')
  const [deck, setDeck] = useState('My words')
  const [busy, setBusy] = useState(false)
  const canSave = !!term.trim() && !!translation.trim()
  const save = async (): Promise<void> => {
    if (!canSave) return
    setBusy(true)
    await onSave({ term: term.trim(), translation: translation.trim(), example: example.trim() || undefined, deck: deck.trim() || 'My words' })
    setBusy(false)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="border border-white/10 rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}>
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Add a word</h2>
            <p className="text-xs text-slate-400">It goes to My words and enters spaced review.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>
        <div className="px-6 py-5 space-y-3">
          <Input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Word or phrase *" />
          <Input value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Meaning / translation *" />
          <Input value={example} onChange={(e) => setExample(e.target.value)} placeholder="Example sentence (optional)" />
          <Input value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="Category (e.g. Travel, Business)" />
        </div>
        <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => void save()} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : 'Save word'}</button>
        </footer>
      </div>
    </div>
  )
}

// ─── Word card (click to expand) ─────────────────────────────────────────────
function WordCard({ w, lang, onRemove }: { w: VocabItem; lang: string; onRemove: () => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const overdue = Date.parse(w.due) <= Date.now()
  const days = Math.round((Date.parse(w.due) - Date.now()) / 86_400_000)
  return (
    <div className={cn('rounded-2xl border bg-white/[0.03] transition', open ? 'border-brand-400/40' : 'border-white/10 hover:border-white/20')}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{w.term}</p>
          <p className="text-xs text-slate-400 truncate">{w.translation}</p>
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0', overdue || w.state === 'new' ? 'bg-rose-500/15 text-rose-300' : 'bg-white/[0.05] text-slate-400')}>
          {w.state === 'new' ? 'New' : overdue ? 'Due' : `${days}d`}
        </span>
        <span onClick={(e) => { e.stopPropagation(); speak(w.term, lang) }} className="w-8 h-8 rounded-full bg-brand-500/15 hover:bg-brand-500/25 text-brand-200 flex items-center justify-center shrink-0" title="Pronounce"><IconVolume className="w-4 h-4" /></span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-2">
          <div><span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Meaning</span><p className="text-sm text-slate-200">{w.translation}</p></div>
          {w.example && <div><span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Example</span><p className="text-sm text-slate-300 italic">“{w.example}”</p></div>}
          {w.alternatives && w.alternatives.length > 0 && (
            <div><span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Also</span><p className="text-sm text-slate-300">{w.alternatives.join(', ')}</p></div>
          )}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] text-slate-500">{w.deck ?? 'My words'}</span>
            {w.reps > 0 && <span className="text-[11px] text-slate-500">· next in {formatInterval(w.scheduledDays || 1)}</span>}
            <button onClick={onRemove} className="ml-auto text-[11px] text-rose-300 hover:text-rose-200">Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VocabularyPage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const { cards, due, stats, add, remove, loading } = useVocab(lang.code)

  const [tab, setTab] = useState<Tab>('mine')
  const [category, setCategory] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  // Split by source: manually created vs saved from reading/dictionary.
  const tabCards = useMemo(
    () => cards.filter((c) => (tab === 'saved' ? c.source === 'saved' : c.source !== 'saved')),
    [cards, tab]
  )

  // Real categories = the decks present in the active tab.
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of tabCards) {
      const d = c.deck ?? 'My words'
      counts.set(d, (counts.get(d) ?? 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [tabCards])

  const visible = useMemo(() => {
    const list = category ? tabCards.filter((c) => (c.deck ?? 'My words') === category) : tabCards
    return [...list].sort((a, b) => Date.parse(a.due) - Date.parse(b.due))
  }, [tabCards, category])

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} {lang.name} vocabulary</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Vocabulary</h1>
            <p className="text-sm text-slate-400 mt-1">Save words, group them by category, and review with spaced repetition.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate('/flashcards')} disabled={cards.length === 0} className="btn-ghost px-4 py-2 text-sm inline-flex items-center gap-1.5 disabled:opacity-40" title={cards.length === 0 ? 'Add words to practice' : 'Practice with flashcards'}><IconBook className="w-4 h-4" /> Flashcards</button>
            <button onClick={() => setAdding(true)} className="btn-ghost px-4 py-2 text-sm inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> Add word</button>
            <button onClick={() => navigate('/vocabulary/review')} disabled={due.length === 0} className="btn-primary text-sm px-4 py-2 disabled:opacity-40">
              {due.length > 0 ? `Review ${due.length} →` : 'Nothing due'}
            </button>
          </div>
        </div>

        {/* Stats + retention */}
        {tab !== 'dictionary' && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
          <StatCard value={stats.due} label="To review" tone="rose" icon={<IconBolt />} />
          <StatCard value={stats.learning + stats.new} label="Learning" tone="amber" icon={<IconStar />} />
          <StatCard value={stats.mastered} label="Mastered" tone="emerald" icon={<IconBookmark />} />
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-3 flex items-center justify-center">
            <ProgressRing value={stats.retention} size={72} tone="brand">
              <span className="text-sm font-bold text-white">{stats.retention}%</span>
            </ProgressRing>
          </div>
        </div>
        )}

        <Tabs items={TABS} active={tab} onChange={(t) => { setTab(t); setCategory(null) }} className="self-start" />

        {tab === 'dictionary' && <DictionaryPanel />}

        {/* Category filter */}
        {tab !== 'dictionary' && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategory(null)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', category === null ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}>
              All ({tabCards.length})
            </button>
            {categories.map((c) => (
              <button key={c.name} onClick={() => setCategory(c.name)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', category === c.name ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}>
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        )}

        {/* Cards */}
        {tab !== 'dictionary' && (loading ? (
          <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-card border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-slate-400">
              {tab === 'saved' ? 'No saved words yet — tap a word while reading or in the dictionary to save it here.' : 'No words yet. Add your first word to start a deck.'}
            </p>
            {tab === 'mine' && <button onClick={() => setAdding(true)} className="btn-primary px-4 py-2 text-sm mt-3 inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> Add word</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((w) => <WordCard key={w.id} w={w} lang={lang.code} onRemove={() => void remove(w.id)} />)}
          </div>
        ))}
      </div>

      {adding && <AddWordModal onClose={() => setAdding(false)} onSave={async (v) => { await add(v); setTab('mine'); setCategory(null) }} />}
    </div>
  )
}
