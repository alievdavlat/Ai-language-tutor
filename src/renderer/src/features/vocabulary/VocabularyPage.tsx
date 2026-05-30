import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VocabItem } from '@shared/types'
import { cn } from '../../lib/classnames'
import { ProgressRing, SectionHeading, StatCard } from '../../components/ui'
import { useTargetLanguage } from '../../lib/language'
import { getTrendingDecksForLanguage } from '../../lib/contentByLanguage'
import { useVocab } from '../../services/study/useStudy'
import { formatInterval } from '../../services/study/fsrs'
import {
  IconBolt,
  IconBookmark,
  IconPlus,
  IconStar,
  IconVolume,
  IconX
} from '../../components/icons'

interface DeckTile {
  title: string
  count: number
  emoji: string
  cover: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

const CATEGORIES: { name: string; emoji: string }[] = [
  { name: 'Daily life', emoji: '🏠' },
  { name: 'Business', emoji: '💼' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Academic', emoji: '🎓' },
  { name: 'My words', emoji: '⭐' },
  { name: 'Tech', emoji: '💻' }
]

const PROFESSIONAL: DeckTile[] = [
  { title: 'Business emails', count: 32, emoji: '📧', cover: 'from-sky-500 to-blue-700', difficulty: 'MEDIUM' },
  { title: 'Meeting language', count: 26, emoji: '🤝', cover: 'from-violet-500 to-indigo-700', difficulty: 'MEDIUM' },
  { title: 'Negotiations', count: 18, emoji: '⚖️', cover: 'from-amber-500 to-orange-700', difficulty: 'HARD' },
  { title: 'Presentations', count: 22, emoji: '📊', cover: 'from-emerald-500 to-teal-700', difficulty: 'MEDIUM' }
]

const DIFFICULTY_TINT: Record<DeckTile['difficulty'], string> = {
  EASY: 'bg-teal-500',
  MEDIUM: 'bg-blue-500',
  HARD: 'bg-orange-500'
}

function speak(text: string, lang: string): void {
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    /* no TTS */
  }
}

function DeckCard({ d }: { d: DeckTile }): JSX.Element {
  return (
    <div className="text-left w-56 shrink-0">
      <div className={cn('relative rounded-2xl h-40 bg-gradient-to-br ring-1 ring-white/10 flex items-end p-3 overflow-hidden', d.cover)}>
        <span className={cn('absolute top-2 left-2 text-[10px] font-black tracking-widest text-white rounded px-1.5 py-0.5', DIFFICULTY_TINT[d.difficulty])}>{d.difficulty}</span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl drop-shadow-lg">{d.emoji}</span>
        <p className="relative text-base font-bold text-white drop-shadow-lg">{d.title}</p>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 inline-flex items-center gap-1">
        <IconBookmark className="w-3 h-3" /> {d.count} words
      </p>
    </div>
  )
}

export default function VocabularyPage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const TRENDING = getTrendingDecksForLanguage(lang.code)
  const { cards, due, stats, add, remove, loading } = useVocab(lang.code)

  const [filter, setFilter] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ term: '', translation: '', example: '', deck: 'My words' })
  const [saving, setSaving] = useState(false)

  const decks = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of cards) {
      const d = c.deck ?? 'My words'
      counts.set(d, (counts.get(d) ?? 0) + 1)
    }
    return [...counts.entries()].map(([title, count]) => ({ title, count }))
  }, [cards])

  const visible = useMemo(() => {
    const list = filter ? cards.filter((c) => (c.deck ?? 'My words') === filter) : cards
    return [...list].sort((a, b) => Date.parse(a.due) - Date.parse(b.due))
  }, [cards, filter])

  const submit = async (): Promise<void> => {
    if (!form.term.trim() || !form.translation.trim()) return
    setSaving(true)
    await add(form)
    setForm({ term: '', translation: '', example: '', deck: form.deck })
    setSaving(false)
    setAdding(false)
  }

  const dueBadge = (c: VocabItem): JSX.Element => {
    const overdue = Date.parse(c.due) <= Date.now()
    const days = Math.round((Date.parse(c.due) - Date.now()) / 86_400_000)
    return (
      <span className={cn('text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5', overdue ? 'bg-rose-500/15 text-rose-300' : 'bg-white/[0.05] text-slate-400')}>
        {c.state === 'new' ? 'New' : overdue ? 'Due' : `${days}d`}
      </span>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} {lang.name} vocabulary</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Vocabulary</h1>
            <p className="text-sm text-slate-400 mt-1">Discover, save, and review words with FSRS spaced repetition.</p>
          </div>
          <button
            onClick={() => navigate('/vocabulary/review')}
            disabled={due.length === 0}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-40"
          >
            {due.length > 0 ? `Review ${due.length} due →` : 'Nothing due'}
          </button>
        </div>

        {/* Stats — real FSRS counts */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={stats.due} label="To review" tone="rose" icon={<IconBolt />} />
          <StatCard value={stats.learning + stats.new} label="Learning" tone="amber" icon={<IconStar />} />
          <StatCard value={stats.mastered} label="Mastered" tone="emerald" icon={<IconBookmark />} />
        </div>

        {/* Retention ring + review CTA */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row items-center gap-5">
          <ProgressRing value={stats.retention} size={104} tone="brand">
            <span className="text-xl font-bold text-white">{stats.retention}%</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">retention</span>
          </ProgressRing>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-base font-bold text-white">Your saved vocabulary</h3>
            <p className="text-sm text-slate-400 mt-1">
              {loading
                ? 'Loading your deck…'
                : due.length > 0
                  ? `${due.length} word${due.length === 1 ? '' : 's'} due for review. A quick session keeps them fresh.`
                  : `${stats.total} words saved · all reviews are up to date.`}
            </p>
            <button
              onClick={() => navigate('/vocabulary/review')}
              disabled={due.length === 0}
              className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-40"
            >
              Start review →
            </button>
          </div>
        </div>

        {/* Add custom word */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
          {!adding ? (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-pill bg-brand-500/15 text-brand-200 text-xs font-bold px-4 py-2 hover:bg-brand-500/25">
              <IconPlus className="w-3.5 h-3.5" /> Add a custom word
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">New word</p>
                <button onClick={() => setAdding(false)} className="text-slate-500 hover:text-white"><IconX className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  autoFocus
                  value={form.term}
                  onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
                  placeholder="Word or phrase"
                  className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/70 focus:outline-none"
                />
                <input
                  value={form.translation}
                  onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
                  placeholder="Meaning / translation"
                  className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/70 focus:outline-none"
                />
              </div>
              <input
                value={form.example}
                onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
                placeholder="Example sentence (optional)"
                className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/70 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  value={form.deck}
                  onChange={(e) => setForm((f) => ({ ...f, deck: e.target.value }))}
                  placeholder="Deck"
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/70 focus:outline-none"
                />
                <button
                  onClick={() => void submit()}
                  disabled={saving || !form.term.trim() || !form.translation.trim()}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save word'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category / deck filter */}
        <div>
          <SectionHeading title="Your decks" subtitle="Tap to filter your saved words" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(null)}
              className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', filter === null ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}
            >
              All ({cards.length})
            </button>
            {decks.map((d) => (
              <button
                key={d.title}
                onClick={() => setFilter(d.title)}
                className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', filter === d.title ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}
              >
                {d.title} ({d.count})
              </button>
            ))}
          </div>
        </div>

        {/* Saved words — real cards */}
        <div>
          <SectionHeading title={filter ?? 'All saved words'} subtitle={`${visible.length} word${visible.length === 1 ? '' : 's'}`} />
          {visible.length === 0 ? (
            <div className="rounded-card border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
              No words here yet. Add one above to start a deck.
            </div>
          ) : (
            <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
              {visible.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                      {w.term}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/[0.05] rounded px-1.5 py-0.5">{w.deck ?? 'My words'}</span>
                      {dueBadge(w)}
                    </p>
                    <p className="text-xs text-slate-400">{w.translation}</p>
                  </div>
                  {w.reps > 0 && (
                    <span className="text-[10px] text-slate-500 hidden sm:block" title="FSRS interval">
                      {formatInterval(w.scheduledDays || 1)}
                    </span>
                  )}
                  <button onClick={() => speak(w.term, lang.code)} title="Play" className="w-9 h-9 rounded-full bg-brand-500/15 hover:bg-brand-500/25 text-brand-200 flex items-center justify-center">
                    <IconVolume className="w-4 h-4" />
                  </button>
                  <button onClick={() => void remove(w.id)} title="Delete" className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <IconX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discovery rails (browse) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Trending decks ✨</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {TRENDING.map((d) => <div key={d.title} className="snap-start"><DeckCard d={d as DeckTile} /></div>)}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Professional settings 💼</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {PROFESSIONAL.map((d) => <div key={d.title} className="snap-start"><DeckCard d={d} /></div>)}
          </div>
        </div>

        {/* Browse-by-topic strip kept for discovery */}
        <div>
          <SectionHeading title="Browse by topic" subtitle="Filter your decks" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => setFilter(c.name)}
                className={cn('rounded-2xl border p-3 flex flex-col items-center gap-2 transition', filter === c.name ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]')}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-[11px] font-bold text-slate-200">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
