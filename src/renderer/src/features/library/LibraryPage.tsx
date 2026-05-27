import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { ListRow, Tabs, type TabItem } from '../../components/ui'
import { IconBook, IconHeadphones, IconPlay, IconVolume } from '../../components/icons'

type Tab = 'videos' | 'books' | 'podcasts'

const TABS: TabItem<Tab>[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' }
]

// Hardcoded preview content — real media is served from the content registry.
const VIDEOS = [
  { title: 'A day at school', series: 'Everyday English', mins: '6:12', level: 'A2', cover: 'from-sky-500 to-blue-700' },
  { title: 'Ordering food', series: 'Real dialogues', mins: '8:40', level: 'A2', cover: 'from-emerald-500 to-teal-700' },
  { title: 'Job interview tips', series: 'Work English', mins: '9:05', level: 'B1', cover: 'from-violet-500 to-purple-700' },
  { title: 'Past tenses explained', series: 'Grammar shorts', mins: '5:30', level: 'B1', cover: 'from-amber-500 to-orange-700' },
  { title: 'Small talk mastery', series: 'Social English', mins: '7:18', level: 'B2', cover: 'from-rose-500 to-pink-700' },
  { title: 'Phrasal verbs in action', series: 'Vocabulary', mins: '6:55', level: 'B2', cover: 'from-indigo-500 to-blue-800' }
]

const BOOKS = [
  { title: 'The Lazy Tourist', author: 'Graded reader', mins: '15 min', level: 'A2', cover: 'from-emerald-600 to-emerald-800' },
  { title: 'A Letter from London', author: 'Short story', mins: '20 min', level: 'B1', cover: 'from-blue-600 to-blue-800' },
  { title: 'The Interview', author: 'Graded reader', mins: '25 min', level: 'B1', cover: 'from-rose-600 to-rose-800' },
  { title: 'City of Strangers', author: 'Short novel', mins: '40 min', level: 'B2', cover: 'from-amber-500 to-amber-700' }
]

const PODCASTS = [
  { title: '6-Minute English: Habits', show: 'Daily listening', mins: '6:00', level: 'B1' },
  { title: 'Slow news of the week', show: 'News in slow English', mins: '12:30', level: 'B1' },
  { title: 'Travel stories', show: 'Conversations', mins: '18:10', level: 'B2' },
  { title: 'How idioms began', show: 'Word origins', mins: '9:45', level: 'B2' }
]

const LEVEL_TONE: Record<string, string> = {
  A2: 'bg-emerald-500/80',
  B1: 'bg-amber-500/80',
  B2: 'bg-rose-500/80'
}

function VideoCard({ v }: { v: (typeof VIDEOS)[number] }): JSX.Element {
  return (
    <button className="text-left group">
      <div className={cn('relative rounded-2xl bg-gradient-to-br h-32 flex items-center justify-center overflow-hidden', v.cover)}>
        <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
          <IconPlay className="w-5 h-5 text-white ml-0.5" />
        </span>
        <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/50 text-white rounded px-1.5 py-0.5">
          {v.mins}
        </span>
        <span className={cn('absolute top-2 left-2 text-[10px] font-bold text-white rounded px-1.5 py-0.5', LEVEL_TONE[v.level])}>
          {v.level}
        </span>
      </div>
      <p className="text-sm font-semibold text-white mt-2 leading-tight">{v.title}</p>
      <p className="text-xs text-slate-400">{v.series}</p>
    </button>
  )
}

function BookCard({ b }: { b: (typeof BOOKS)[number] }): JSX.Element {
  return (
    <button className="text-left group">
      <div className={cn('relative rounded-2xl bg-gradient-to-br h-40 p-4 flex flex-col justify-between overflow-hidden', b.cover)}>
        <div aria-hidden className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />
        <IconBook className="w-6 h-6 text-white/70" />
        <div>
          <p className="text-sm font-bold text-white leading-tight">{b.title}</p>
          <p className="text-[11px] text-white/70 mt-0.5">{b.author}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 px-0.5">
        <span className="text-xs text-slate-400">{b.mins} read</span>
        <span className="text-[10px] font-bold text-slate-300 bg-white/[0.06] rounded px-1.5 py-0.5">{b.level}</span>
      </div>
    </button>
  )
}

export default function LibraryPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('videos')

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library</h1>
          <p className="text-sm text-slate-400 mt-1">
            Watch, read and listen — graded to your level.
          </p>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'videos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {VIDEOS.map((v) => (
              <VideoCard key={v.title} v={v} />
            ))}
          </div>
        )}

        {tab === 'books' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BOOKS.map((b) => (
              <BookCard key={b.title} b={b} />
            ))}
          </div>
        )}

        {tab === 'podcasts' && (
          <div className="flex flex-col gap-2">
            {PODCASTS.map((p) => (
              <ListRow
                key={p.title}
                leading={
                  <span className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center">
                    <IconHeadphones className="w-5 h-5" />
                  </span>
                }
                title={p.title}
                subtitle={`${p.show} · ${p.mins} · transcript`}
                trailing={
                  <button className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center hover:bg-brand-500/25 transition">
                    <IconVolume className="w-[18px] h-[18px]" />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
