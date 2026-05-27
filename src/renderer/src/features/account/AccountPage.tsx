import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import {
  IconBook,
  IconBookmark,
  IconHeart,
  IconPlay,
  IconPlus,
  IconVolume,
  IconYouTube
} from '../../components/icons'

type Tab = 'saved' | 'likes' | 'uploads' | 'help'
const TABS: TabItem<Tab>[] = [
  { id: 'saved', label: 'Saved' },
  { id: 'likes', label: 'Likes' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'help', label: 'Help' }
]

const SAVED = [
  { kind: 'course', title: 'IELTS Speaking Bootcamp', sub: 'James Lee', cover: 'from-rose-500 to-pink-700' },
  { kind: 'video', title: 'Fix these 5 mistakes', sub: 'Emma English · 8:12', cover: 'from-sky-500 to-blue-700' },
  { kind: 'book', title: 'English Grammar in Use', sub: 'Murphy', cover: 'from-blue-600 to-blue-800' }
]
const LIKES = [
  { kind: 'video', title: 'Past tenses in 10 min', sub: 'GrammarLab · 10:05', cover: 'from-violet-500 to-purple-700' },
  { kind: 'podcast', title: 'News in Slow English', sub: '12:30', cover: 'from-emerald-500 to-teal-700' }
]
const UPLOADS = [
  { kind: 'book', title: 'My A2 vocabulary notes.pdf', sub: 'PDF · 18 saves' },
  { kind: 'podcast', title: 'My shadowing attempt #3.mp3', sub: 'Audio · 6 likes' }
]
const HELP = [
  'How do I download a book?',
  'How does the level test work?',
  'How do I go live or join a group?',
  'How do I upload a resource?',
  'Contact support'
]

function MediaTile({ item }: { item: { kind: string; title: string; sub: string; cover: string } }): JSX.Element {
  const Icon = item.kind === 'book' ? IconBook : item.kind === 'podcast' ? IconVolume : IconPlay
  return (
    <div className="text-left">
      <div className={cn('relative rounded-2xl bg-gradient-to-br h-28 ring-1 ring-white/10 flex items-center justify-center', item.cover)}>
        <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><Icon className="w-4 h-4 text-white" /></span>
        {item.kind === 'video' && <span className="absolute top-2 left-2"><IconYouTube className="w-4 h-4 text-red-500" /></span>}
      </div>
      <p className="text-sm font-semibold text-white mt-2 truncate">{item.title}</p>
      <p className="text-xs text-slate-400 truncate">{item.sub}</p>
    </div>
  )
}

export default function AccountPage(): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('saved')

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <AvatarCircle name="Aziz" size="lg" className="!w-20 !h-20 !text-2xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Aziz</h1>
            <p className="text-sm text-slate-400">Level B1 · learning English</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span><b className="text-white">12</b> following</span>
              <span><b className="text-white">3</b> followers</span>
              <span><b className="text-white">1,240</b> XP</span>
              <span><b className="text-amber-300">🔥 7</b> day streak</span>
            </div>
          </div>
          <button onClick={() => navigate('/settings')} className="btn-ghost px-4 py-2 text-sm shrink-0">Edit profile</button>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'saved' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SAVED.map((i) => <MediaTile key={i.title} item={i} />)}
          </div>
        )}
        {tab === 'likes' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {LIKES.map((i) => <MediaTile key={i.title} item={i} />)}
          </div>
        )}
        {tab === 'uploads' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 flex flex-col items-center text-center gap-2">
              <span className="w-10 h-10 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconPlus className="w-5 h-5" /></span>
              <p className="text-sm font-semibold text-white">Share a resource</p>
              <p className="text-xs text-slate-400">Upload a PDF or audio, or paste a YouTube link.</p>
              <div className="flex gap-2 mt-1">
                {[['Link a video', IconYouTube], ['Upload PDF', IconBook], ['Upload audio', IconVolume]].map(([l, Ico]) => {
                  const I = Ico as (p: { className?: string }) => JSX.Element
                  return <button key={l as string} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10"><I className="w-3.5 h-3.5" /> {l as string}</button>
                })}
              </div>
            </div>
            {UPLOADS.map((u) => (
              <div key={u.title} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center', u.kind === 'book' ? 'bg-rose-500/15 text-rose-300' : 'bg-brand-500/15 text-brand-300')}>
                  {u.kind === 'book' ? <IconBook className="w-5 h-5" /> : <IconVolume className="w-5 h-5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.title}</p>
                  <p className="text-xs text-slate-400">{u.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'help' && (
          <div className="flex flex-col gap-2">
            {HELP.map((h) => (
              <button key={h} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] transition">
                {h} <span className="text-slate-500">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
