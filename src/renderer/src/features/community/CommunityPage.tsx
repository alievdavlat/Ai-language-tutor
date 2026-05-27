import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import {
  IconBook,
  IconBookmark,
  IconChat,
  IconHeart,
  IconPlay,
  IconPlus,
  IconVolume,
  IconYouTube
} from '../../components/icons'

type Filter = 'recent' | 'popular' | 'following'
const FILTERS: TabItem<Filter>[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'popular', label: 'Popular' },
  { id: 'following', label: 'Following' }
]

type Attach = { type: 'video'; title: string; mins: string } | { type: 'book'; title: string } | { type: 'podcast'; title: string; mins: string } | null

interface Post {
  author: string
  role: 'teacher' | 'student'
  time: string
  text: string
  attach: Attach
  likes: number
  comments: number
}

const POSTS: Post[] = [
  { author: 'Emma Carter', role: 'teacher', time: '2h', text: 'New video! 5 mistakes that make you sound less fluent — and how to fix them 👇', attach: { type: 'video', title: 'Fix these 5 mistakes', mins: '8:12' }, likes: 214, comments: 31 },
  { author: 'Bekzod', role: 'student', time: '4h', text: 'Found this graded reader super helpful for B1 — sharing the PDF!', attach: { type: 'book', title: 'The Lazy Tourist (A2–B1)' }, likes: 56, comments: 8 },
  { author: 'Dilnoza', role: 'student', time: '6h', text: 'My favourite podcast for shadowing practice. The slow pace is perfect.', attach: { type: 'podcast', title: 'News in Slow English', mins: '12:30' }, likes: 89, comments: 12 },
  { author: 'James Lee', role: 'teacher', time: '1d', text: 'Quick tip: record yourself once a week and compare. Progress you can hear 🎧', attach: null, likes: 320, comments: 44 }
]

const CHALLENGES = [
  { title: '7-day speaking streak', people: '1,240 joined' },
  { title: 'Learn 50 new words', people: '870 joined' }
]
const GROUPS = [
  { title: 'IELTS Warriors', people: '3.2k' },
  { title: 'Daily Speaking Club', people: '5.1k' },
  { title: 'Grammar Nerds', people: '1.8k' }
]

function Attachment({ a }: { a: NonNullable<Attach> }): JSX.Element {
  if (a.type === 'video') {
    return (
      <div className="relative rounded-2xl bg-gradient-to-br from-sky-600 to-blue-800 h-40 flex items-center justify-center ring-1 ring-white/10 mt-3">
        <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center"><IconPlay className="w-5 h-5 text-white ml-0.5" /></span>
        <span className="absolute top-2 left-2"><IconYouTube className="w-5 h-5 text-red-500" /></span>
        <span className="absolute bottom-2 left-3 text-sm font-semibold text-white">{a.title}</span>
        <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">{a.mins}</span>
      </div>
    )
  }
  const isBook = a.type === 'book'
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 mt-3">
      <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', isBook ? 'bg-rose-500/15 text-rose-300' : 'bg-brand-500/15 text-brand-300')}>
        {isBook ? <IconBook className="w-5 h-5" /> : <IconVolume className="w-5 h-5" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{a.title}</p>
        <p className="text-xs text-slate-400">{isBook ? 'PDF · free download' : `Audio · ${(a as { mins: string }).mins}`}</p>
      </div>
    </div>
  )
}

function PostCard({ p }: { p: Post }): JSX.Element {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  return (
    <div className="rounded-card border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2.5">
        <button onClick={() => p.role === 'teacher' && navigate('/channel')}>
          <AvatarCircle name={p.author} size="sm" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{p.author}</span>
            <span className={cn('text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5', p.role === 'teacher' ? 'bg-brand-500/20 text-brand-300' : 'bg-white/10 text-slate-400')}>
              {p.role}
            </span>
          </div>
          <span className="text-xs text-slate-500">{p.time} ago</span>
        </div>
      </div>

      <p className="text-sm text-slate-200 mt-3 leading-relaxed">{p.text}</p>
      {p.attach && <Attachment a={p.attach} />}

      <div className="flex items-center gap-5 mt-3 text-slate-400">
        <button onClick={() => setLiked((v) => !v)} className={cn('inline-flex items-center gap-1.5 text-sm transition', liked ? 'text-rose-300' : 'hover:text-white')}>
          <IconHeart className="w-4 h-4" /> {p.likes + (liked ? 1 : 0)}
        </button>
        <button className="inline-flex items-center gap-1.5 text-sm hover:text-white">
          <IconChat className="w-4 h-4" /> {p.comments}
        </button>
        <button className="inline-flex items-center gap-1.5 text-sm hover:text-white ml-auto">
          <IconBookmark className="w-4 h-4" /> Save
        </button>
      </div>
    </div>
  )
}

function Composer(): JSX.Element {
  return (
    <div className="rounded-card border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <AvatarCircle name="Aziz" size="sm" />
        <input
          placeholder="Share a resource or tip with the community…"
          className="flex-1 rounded-pill bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2 mt-3 pl-11">
        {[['Link a video', IconYouTube], ['Upload PDF', IconBook], ['Upload audio', IconVolume]].map(([label, Ico]) => {
          const I = Ico as (p: { className?: string }) => JSX.Element
          return (
            <button key={label as string} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10">
              <I className="w-3.5 h-3.5" /> {label as string}
            </button>
          )
        })}
        <button className="btn-primary text-xs px-4 py-1.5 ml-auto">Post</button>
      </div>
    </div>
  )
}

export default function CommunityPage(): JSX.Element {
  const [filter, setFilter] = useState<Filter>('recent')

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Community</h1>
          <p className="text-sm text-slate-400 mt-1">Share resources, learn together, join challenges.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          {/* Feed */}
          <div className="flex flex-col gap-4">
            <Composer />
            <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />
            {POSTS.map((p, i) => <PostCard key={i} p={p} />)}
          </div>

          {/* Right rail */}
          <aside className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Active challenges</p>
              </div>
              <div className="flex flex-col gap-2">
                {CHALLENGES.map((c) => (
                  <div key={c.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <p className="text-sm font-semibold text-white">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.people}</p>
                    <button className="text-xs font-semibold text-brand-300 hover:text-brand-200 mt-2">Join →</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Popular groups</p>
                <button className="text-brand-300 hover:text-brand-200"><IconPlus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-2">
                {GROUPS.map((g) => (
                  <div key={g.title} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                    <span className="w-9 h-9 rounded-xl bg-grad-brand flex items-center justify-center text-white text-xs font-bold">{g.title[0]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{g.title}</p>
                      <p className="text-xs text-slate-500">{g.people} members</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
