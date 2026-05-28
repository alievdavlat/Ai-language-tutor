import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressRing, SectionHeading, StatCard } from '../../components/ui'
import { useTargetLanguage } from '../../lib/language'
import { getTrendingDecksForLanguage } from '../../lib/contentByLanguage'
import {
  IconBolt,
  IconBookmark,
  IconHeart,
  IconPlus,
  IconStar,
  IconVolume,
  type IconProps
} from '../../components/icons'

const STATS = [
  { value: 8, label: 'To review', tone: 'rose' as const, icon: <IconBolt /> },
  { value: 23, label: 'Learning', tone: 'amber' as const, icon: <IconStar /> },
  { value: 142, label: 'Mastered', tone: 'emerald' as const, icon: <IconBookmark /> }
]

// Elsa "Discover" style — image cards in horizontal categories
interface DeckTile {
  title: string
  count: number
  emoji: string
  cover: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

const CATEGORIES: { name: string; emoji: string; tint: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { name: 'Daily life', emoji: '🏠', tint: 'bg-brand-500/15 text-brand-300', Icon: IconHeart },
  { name: 'Business', emoji: '💼', tint: 'bg-violet-500/15 text-violet-300', Icon: IconStar },
  { name: 'Travel', emoji: '✈️', tint: 'bg-emerald-500/15 text-emerald-300', Icon: IconBolt },
  { name: 'Academic', emoji: '🎓', tint: 'bg-amber-500/15 text-amber-300', Icon: IconBookmark },
  { name: 'Slang', emoji: '🗯️', tint: 'bg-rose-500/15 text-rose-300', Icon: IconStar },
  { name: 'Tech', emoji: '💻', tint: 'bg-sky-500/15 text-sky-300', Icon: IconBolt }
]

// TRENDING is now driven by useTargetLanguage() — see component body

const PROFESSIONAL: DeckTile[] = [
  { title: 'Business emails', count: 32, emoji: '📧', cover: 'from-sky-500 to-blue-700', difficulty: 'MEDIUM' },
  { title: 'Meeting language', count: 26, emoji: '🤝', cover: 'from-violet-500 to-indigo-700', difficulty: 'MEDIUM' },
  { title: 'Negotiations', count: 18, emoji: '⚖️', cover: 'from-amber-500 to-orange-700', difficulty: 'HARD' },
  { title: 'Presentations', count: 22, emoji: '📊', cover: 'from-emerald-500 to-teal-700', difficulty: 'MEDIUM' }
]

const POPULAR = [
  { word: 'itinerary', meaning: 'a planned route or journey', tag: 'Travel', emoji: '🗺️' },
  { word: 'reservation', meaning: 'an arrangement to be kept', tag: 'Travel', emoji: '📅' },
  { word: 'spontaneous', meaning: 'done without planning ahead', tag: 'Daily', emoji: '🎲' },
  { word: 'negotiate', meaning: 'discuss to reach an agreement', tag: 'Business', emoji: '🤝' },
  { word: 'deadline', meaning: 'the latest time to finish', tag: 'Work', emoji: '⏰' }
]

const DIFFICULTY_TINT: Record<DeckTile['difficulty'], string> = {
  EASY: 'bg-teal-500',
  MEDIUM: 'bg-blue-500',
  HARD: 'bg-orange-500'
}

function DeckCard({ d, onClick }: { d: DeckTile; onClick?: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="text-left w-56 shrink-0 group">
      <div className={cn('relative rounded-2xl h-40 bg-gradient-to-br ring-1 ring-white/10 flex items-end p-3 overflow-hidden', d.cover)}>
        <span className={cn('absolute top-2 left-2 text-[10px] font-black tracking-widest text-white rounded px-1.5 py-0.5', DIFFICULTY_TINT[d.difficulty])}>{d.difficulty}</span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl drop-shadow-lg">{d.emoji}</span>
        <p className="relative text-base font-bold text-white drop-shadow-lg">{d.title}</p>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 inline-flex items-center gap-1">
        <IconBookmark className="w-3 h-3" /> {d.count} words
      </p>
    </button>
  )
}

export default function VocabularyPage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const TRENDING = getTrendingDecksForLanguage(lang.code)
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} {lang.name} vocabulary</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Vocabulary</h1>
            <p className="text-sm text-slate-400 mt-1">Discover, save, and review words with spaced repetition.</p>
          </div>
          <button onClick={() => navigate('/flashcards')} className="btn-primary text-xs px-4 py-2">Start flashcards</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((s) => <StatCard key={s.label} value={s.value} label={s.label} tone={s.tone} icon={s.icon} />)}
        </div>

        {/* Saved set + review ring */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row items-center gap-5">
          <ProgressRing value={62} size={104} tone="brand">
            <span className="text-xl font-bold text-white">62%</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">retention</span>
          </ProgressRing>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-base font-bold text-white">Your saved vocabulary</h3>
            <p className="text-sm text-slate-400 mt-1">31 words are due for review today. A quick 5-minute session keeps them fresh.</p>
            <button onClick={() => navigate('/flashcards')} className="btn-primary mt-3 px-4 py-2 text-sm">Start review →</button>
          </div>
        </div>

        {/* Category strip — Elsa Discover style */}
        <div>
          <SectionHeading title="Browse by topic" subtitle="Pick a category to find decks" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center gap-2 hover:bg-white/[0.06] transition">
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-[11px] font-bold text-slate-200">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending decks — horizontal scroll Elsa style */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Trending decks ✨</p>
            <button className="text-xs font-semibold text-brand-300 hover:text-brand-200">See all →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {TRENDING.map((d) => <div key={d.title} className="snap-start"><DeckCard d={d} /></div>)}
          </div>
        </div>

        {/* Professional decks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Professional settings 💼</p>
            <button className="text-xs font-semibold text-brand-300 hover:text-brand-200">See all →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {PROFESSIONAL.map((d) => <div key={d.title} className="snap-start"><DeckCard d={d} /></div>)}
          </div>
        </div>

        {/* Saved words list */}
        <div>
          <SectionHeading title="Recently saved" subtitle={`${POPULAR.length} words`} />
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {POPULAR.map((w) => (
              <div key={w.word} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
                <span className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl shrink-0">{w.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    {w.word}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/[0.05] rounded px-1.5 py-0.5">{w.tag}</span>
                  </p>
                  <p className="text-xs text-slate-400">{w.meaning}</p>
                </div>
                <button title="Play" className="w-9 h-9 rounded-full bg-brand-500/15 hover:bg-brand-500/25 text-brand-200 flex items-center justify-center">
                  <IconVolume className="w-4 h-4" />
                </button>
                <button title="Saved" className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-300 flex items-center justify-center">
                  <IconBookmark className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-brand-500/15 text-brand-200 text-xs font-bold px-4 py-2 hover:bg-brand-500/25">
            <IconPlus className="w-3.5 h-3.5" /> Add a custom word
          </button>
        </div>
      </div>
    </div>
  )
}
