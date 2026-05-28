import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading, Tabs, type TabItem } from '../../components/ui'
import { IconBolt, IconBook, IconHeadphones, IconStar } from '../../components/icons'

type Tab = 'reading' | 'listening' | 'mixed'
const TABS: TabItem<Tab>[] = [
  { id: 'reading', label: 'Reading' },
  { id: 'listening', label: 'Listening' },
  { id: 'mixed', label: 'Mixed' }
]

interface Story {
  title: string
  emoji: string
  level: string
  minutes: number
  xp: number
  parts: number
  done?: number
  cover: string
}

const STORIES: Story[] = [
  { title: 'A Day in Tokyo', emoji: '🗼', level: 'A2', minutes: 8, xp: 40, parts: 5, done: 3, cover: 'from-rose-500 to-orange-500' },
  { title: 'The Coffee Mystery', emoji: '☕', level: 'B1', minutes: 12, xp: 60, parts: 6, cover: 'from-amber-500 to-rose-500' },
  { title: 'Lost in Translation', emoji: '🌍', level: 'B1', minutes: 10, xp: 50, parts: 5, cover: 'from-sky-500 to-blue-700' },
  { title: 'My First Job', emoji: '💼', level: 'A2', minutes: 9, xp: 40, parts: 4, cover: 'from-emerald-500 to-teal-700' },
  { title: 'The Sleepless Astronaut', emoji: '🚀', level: 'B2', minutes: 15, xp: 80, parts: 7, cover: 'from-indigo-500 to-violet-700' },
  { title: 'Family Dinner', emoji: '🍝', level: 'A1', minutes: 6, xp: 30, parts: 3, done: 3, cover: 'from-orange-500 to-red-700' }
]

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1']

function StoryCard({ s }: { s: Story }): JSX.Element {
  const isDone = s.done === s.parts
  return (
    <article className="group rounded-card border border-white/10 bg-white/[0.025] overflow-hidden hover:border-white/20 transition cursor-pointer">
      <div className={cn('relative h-36 bg-gradient-to-br flex items-center justify-center text-6xl', s.cover)}>
        <span className="absolute top-3 left-3 rounded-full bg-black/30 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{s.level}</span>
        {isDone && <span className="absolute top-3 right-3 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5">✓ Done</span>}
        {s.emoji}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-white">{s.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
          <span>{s.minutes} min</span>
          <span>· {s.parts} parts</span>
          <span className="inline-flex items-center gap-1 ml-auto text-amber-200"><IconBolt className="w-3 h-3" /> +{s.xp}</span>
        </div>
        {s.done != null && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-brand-500" style={{ width: `${(s.done / s.parts) * 100}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Part {s.done}/{s.parts}</p>
          </div>
        )}
      </div>
    </article>
  )
}

export default function StoriesPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('mixed')
  const [level, setLevel] = useState('All')

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Mini-fiction"
          title="Stories"
          subtitle="Short reading and listening stories with comprehension checks."
          back="/library"
          crumbs={[{ label: 'Library', to: '/library' }, { label: 'Stories' }]}
        />

        {/* Continue */}
        <div className="rounded-card p-5 bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-400/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">🗼</div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-brand-200/80 font-bold">Continue reading</p>
            <p className="text-sm font-bold text-white">A Day in Tokyo · Part 4 of 5</p>
            <p className="text-xs text-slate-300 mt-0.5">~3 min left</p>
          </div>
          <button className="btn-primary text-xs px-4 py-2">Resume</button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={cn(
                  'rounded-full text-[11px] font-bold px-3 py-1 transition border',
                  level === l ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <SectionHeading
          title={tab === 'reading' ? 'Reading stories' : tab === 'listening' ? 'Listening stories' : 'All stories'}
          subtitle={`${STORIES.length} available`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STORIES.map((s) => <StoryCard key={s.title} s={s} />)}
        </div>

        {/* Categories rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Reading', Icon: IconBook, tint: 'bg-rose-500/15 text-rose-300', count: 24 },
            { label: 'Listening', Icon: IconHeadphones, tint: 'bg-sky-500/15 text-sky-300', count: 18 },
            { label: 'Daily', Icon: IconStar, tint: 'bg-amber-500/15 text-amber-300', count: 1 },
            { label: 'Saved', Icon: IconBolt, tint: 'bg-violet-500/15 text-violet-300', count: 4 }
          ].map((c) => (
            <button key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3 hover:bg-white/[0.06]">
              <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.tint)}><c.Icon className="w-5 h-5" /></span>
              <div className="text-left">
                <p className="text-sm font-bold text-white">{c.label}</p>
                <p className="text-[11px] text-slate-400">{c.count} stories</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
