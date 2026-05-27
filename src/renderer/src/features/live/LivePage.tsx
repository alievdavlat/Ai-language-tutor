import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import { IconLive, IconPlus, IconUsers } from '../../components/icons'

type Filter = 'following' | 'courses' | 'teachers' | 'students'
const FILTERS: TabItem<Filter>[] = [
  { id: 'following', label: 'Following' },
  { id: 'courses', label: 'Courses' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'students', label: 'Students' }
]

// Live-now "stories" (Instagram-style)
const STORIES = ['Emma', 'James', 'Sara', 'Bekzod', 'Dilnoza', 'Tom', 'Aziza']

interface Stream {
  title: string
  streamer: string
  role: 'teacher' | 'student'
  category: string
  viewers: string
  tags: string[]
  cover: string
  group?: boolean
}

const STREAMS: Stream[] = [
  { title: 'Everyday English: Small Talk', streamer: 'Emma Carter', role: 'teacher', category: 'Speaking practice', viewers: '342', tags: ['English', 'B1'], cover: 'from-rose-600 to-red-800' },
  { title: 'IELTS Speaking — live Q&A', streamer: 'James Lee', role: 'teacher', category: 'IELTS', viewers: '210', tags: ['English', 'Exam'], cover: 'from-blue-600 to-indigo-800' },
  { title: 'Practice hour — join the table!', streamer: 'Speaking Club', role: 'student', category: 'Group live', viewers: '96', tags: ['English', 'Group'], cover: 'from-emerald-600 to-teal-800', group: true },
  { title: 'Pronunciation clinic', streamer: 'Sara Kim', role: 'teacher', category: 'Speaking practice', viewers: '154', tags: ['English', 'A2-B1'], cover: 'from-violet-600 to-purple-800' },
  { title: 'Just chatting in English', streamer: 'Bekzod', role: 'student', category: 'Just chatting', viewers: '48', tags: ['English'], cover: 'from-amber-500 to-orange-700' },
  { title: 'Business English roundtable', streamer: 'Sara & friends', role: 'student', category: 'Group live', viewers: '73', tags: ['English', 'Business'], cover: 'from-sky-600 to-blue-800', group: true }
]

function StoryRing({ name, onClick, add }: { name: string; onClick: () => void; add?: boolean }): JSX.Element {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
      <span className={cn('p-0.5 rounded-full', add ? 'bg-white/15' : 'bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-amber-400')}>
        <span className="block p-0.5 rounded-full bg-canvas">
          {add ? (
            <span className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-slate-300"><IconPlus className="w-5 h-5" /></span>
          ) : (
            <AvatarCircle name={name} size="md" />
          )}
        </span>
      </span>
      <span className="text-[11px] text-slate-400 truncate max-w-[60px]">{add ? 'Go live' : name}</span>
    </button>
  )
}

function StreamCard({ s }: { s: Stream }): JSX.Element {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(s.group ? '/live/group' : '/live/room')} className="text-left group">
      <div className={cn('relative rounded-xl bg-gradient-to-br h-40 ring-1 ring-white/10 overflow-hidden', s.cover)}>
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white rounded px-1.5 py-0.5">Live</span>
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[11px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">
          <IconUsers className="w-3 h-3" /> {s.viewers}
        </span>
        {s.group && (
          <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-black rounded px-1.5 py-0.5">Group</span>
        )}
      </div>
      <div className="flex gap-2.5 mt-2">
        <AvatarCircle name={s.streamer} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition">{s.title}</p>
          <p className="text-xs text-slate-400 truncate">{s.streamer} · {s.category}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {s.tags.map((t) => (
              <span key={t} className="text-[10px] font-medium rounded-full bg-white/[0.06] text-slate-300 px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function LivePage(): JSX.Element {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('following')

  const visible = STREAMS.filter((s) => {
    if (filter === 'teachers') return s.role === 'teacher'
    if (filter === 'students') return s.role === 'student'
    if (filter === 'courses') return s.category === 'IELTS' || s.category === 'Speaking practice'
    return true
  })
  const featured = visible[0] ?? STREAMS[0]

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live</h1>
            <p className="text-sm text-slate-400 mt-1">Watch live lessons, join group streams, or go live.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/live/group')} className="btn-ghost px-4 py-2.5 inline-flex items-center gap-2 text-sm">
              <IconUsers className="w-4 h-4" /> Group live
            </button>
            <button onClick={() => navigate('/live/room')} className="btn-primary px-5 py-2.5 inline-flex items-center gap-2">
              <IconLive className="w-4 h-4" /> Go live
            </button>
          </div>
        </div>

        {/* Live-now stories */}
        <div className="flex gap-4 overflow-x-auto pb-1 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <StoryRing name="You" add onClick={() => navigate('/live/room')} />
          {STORIES.map((n) => <StoryRing key={n} name={n} onClick={() => navigate('/live/room')} />)}
        </div>

        {/* Featured */}
        <button onClick={() => navigate(featured.group ? '/live/group' : '/live/room')} className="text-left">
          <div className={cn('relative overflow-hidden rounded-card bg-gradient-to-br h-56 sm:h-64 ring-1 ring-white/10 flex flex-col justify-end p-6', featured.cover)}>
            <div aria-hidden className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
            <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs text-white bg-black/40 rounded-full px-3 py-1.5"><IconUsers className="w-3.5 h-3.5" /> {featured.viewers}</span>
            <h2 className="relative text-2xl font-bold text-white">{featured.title}</h2>
            <div className="relative flex items-center gap-2 mt-2">
              <AvatarCircle name={featured.streamer} size="sm" />
              <span className="text-sm text-white/90">{featured.streamer}</span>
              <span className="text-xs text-white/60">· {featured.category}</span>
            </div>
          </div>
        </button>

        {/* Filters */}
        <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />

        {/* Grid */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Live channels you might like</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-6">
            {visible.map((s) => <StreamCard key={s.title} s={s} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
