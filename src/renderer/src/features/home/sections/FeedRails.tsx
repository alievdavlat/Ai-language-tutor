import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/classnames'
import { AvatarCircle, ProgressBar, Rail } from '../../../components/ui'
import { IconPlay, IconStar, IconVolume, IconYouTube } from '../../../components/icons'

function SeeAll({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="text-xs font-semibold text-brand-300 hover:text-brand-200">
      See all
    </button>
  )
}

// ── Continue learning ────────────────────────────────────────────────────────
const CONTINUE = [
  { title: 'Present continuous', course: 'Intermediate · B1', progress: 34, cover: 'from-blue-500 to-indigo-700' },
  { title: 'Past simple', course: 'Elementary · A2', progress: 72, cover: 'from-emerald-500 to-teal-700' },
  { title: 'Murphy · Unit 3', course: 'English Grammar in Use', progress: 18, cover: 'from-blue-600 to-blue-800' }
]

const POPULAR = [
  { title: 'IELTS Speaking Bootcamp', teacher: 'James Lee', rating: '4.9', cover: 'from-rose-500 to-pink-700' },
  { title: 'Everyday Conversation', teacher: 'Emma Carter', rating: '4.8', cover: 'from-sky-500 to-blue-700' },
  { title: 'Business English Pro', teacher: 'Sara Kim', rating: '4.7', cover: 'from-violet-500 to-purple-700' },
  { title: 'Grammar Foundations', teacher: 'Tom Reed', rating: '4.9', cover: 'from-amber-500 to-orange-700' }
]

function CourseCard({ c, progress, to = '/course' }: { c: { title: string; cover: string; teacher?: string; course?: string; rating?: string }; progress?: number; to?: string }): JSX.Element {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="shrink-0 w-56 text-left snap-start">
      <div className={cn('rounded-2xl bg-gradient-to-br h-28 ring-1 ring-white/10', c.cover)} />
      <p className="text-sm font-semibold text-white mt-2 truncate">{c.title}</p>
      <p className="text-xs text-slate-400 truncate">{c.teacher ?? c.course}</p>
      {typeof progress === 'number' ? (
        <div className="mt-2"><ProgressBar value={progress} /></div>
      ) : c.rating ? (
        <p className="text-xs text-amber-300 mt-1 inline-flex items-center gap-1"><IconStar className="w-3 h-3" /> {c.rating}</p>
      ) : null}
    </button>
  )
}

// ── Trending videos ──────────────────────────────────────────────────────────
const VIDEOS = [
  { title: 'Fix these 5 common mistakes', channel: 'Emma English', mins: '8:12', cover: 'from-sky-500 to-blue-700' },
  { title: 'Sound natural: linking words', channel: 'SpeakUp', mins: '6:40', cover: 'from-emerald-500 to-teal-700' },
  { title: 'Past tenses in 10 minutes', channel: 'GrammarLab', mins: '10:05', cover: 'from-violet-500 to-purple-700' },
  { title: 'Job interview English', channel: 'WorkTalk', mins: '12:18', cover: 'from-rose-500 to-pink-700' }
]

function VideoCard({ v }: { v: (typeof VIDEOS)[number] }): JSX.Element {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/library')} className="shrink-0 w-64 text-left snap-start group">
      <div className={cn('relative rounded-2xl bg-gradient-to-br h-36 flex items-center justify-center ring-1 ring-white/10', v.cover)}>
        <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
          <IconPlay className="w-5 h-5 text-white ml-0.5" />
        </span>
        <span className="absolute top-2 left-2"><IconYouTube className="w-5 h-5 text-red-500" /></span>
        <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">{v.mins}</span>
      </div>
      <p className="text-sm font-semibold text-white mt-2 truncate">{v.title}</p>
      <p className="text-xs text-slate-400 truncate">{v.channel}</p>
    </button>
  )
}

// ── Podcasts ─────────────────────────────────────────────────────────────────
const PODCASTS = [
  { title: '6-Minute English: Habits', show: 'BBC-style', mins: '6:00', tone: 'from-brand-500 to-brand-700' },
  { title: 'Slow news weekly', show: 'News in slow', mins: '12:30', tone: 'from-emerald-500 to-teal-700' },
  { title: 'Travel stories', show: 'Conversations', mins: '18:10', tone: 'from-amber-500 to-orange-700' }
]

function PodcastCard({ p }: { p: (typeof PODCASTS)[number] }): JSX.Element {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/library')} className="shrink-0 w-64 text-left snap-start">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 flex items-center gap-3">
        <span className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', p.tone)}>
          <IconVolume className="w-5 h-5 text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{p.title}</p>
          <p className="text-xs text-slate-400 truncate">{p.show} · {p.mins}</p>
        </div>
      </div>
    </button>
  )
}

// ── Featured teachers ────────────────────────────────────────────────────────
const TEACHERS = [
  { name: 'Emma Carter', followers: '12.4k' },
  { name: 'James Lee', followers: '9.1k' },
  { name: 'Sara Kim', followers: '7.8k' },
  { name: 'Tom Reed', followers: '5.2k' }
]

function TeacherCard({ t }: { t: (typeof TEACHERS)[number] }): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="shrink-0 w-40 snap-start rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col items-center text-center gap-2">
      <button onClick={() => navigate('/channel')} className="flex flex-col items-center gap-2">
        <AvatarCircle name={t.name} size="lg" />
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{t.name}</p>
          <p className="text-xs text-slate-500">{t.followers} followers</p>
        </div>
      </button>
      <button className="text-xs font-semibold text-brand-300 hover:text-white rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 w-full">
        Follow
      </button>
    </div>
  )
}

// ── Books ────────────────────────────────────────────────────────────────────
const BOOKS = [
  { title: 'English Grammar in Use', author: 'Murphy', cover: 'from-blue-600 to-blue-800' },
  { title: 'The Lazy Tourist', author: 'Graded reader', cover: 'from-emerald-600 to-emerald-800' },
  { title: 'Vocabulary in Use', author: 'Cambridge', cover: 'from-amber-500 to-amber-700' },
  { title: 'City of Strangers', author: 'Short novel', cover: 'from-rose-600 to-rose-800' }
]

function BookCard({ b }: { b: (typeof BOOKS)[number] }): JSX.Element {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/library')} className="shrink-0 w-32 text-left snap-start">
      <div className={cn('relative rounded-xl bg-gradient-to-br h-44 p-3 flex flex-col justify-end ring-1 ring-white/10', b.cover)}>
        <div aria-hidden className="absolute left-2.5 top-0 bottom-0 w-px bg-white/20" />
        <p className="text-xs font-bold text-white leading-tight">{b.title}</p>
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 truncate">{b.author}</p>
    </button>
  )
}

export default function FeedRails(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-7">
      <Rail title="Continue learning">
        {CONTINUE.map((c) => <CourseCard key={c.title} c={c} progress={c.progress} to="/learn/lesson" />)}
      </Rail>
      <Rail title="Popular courses" action={<SeeAll onClick={() => navigate('/courses')} />}>
        {POPULAR.map((c) => <CourseCard key={c.title} c={c} />)}
      </Rail>
      <Rail title="Trending videos" action={<SeeAll onClick={() => navigate('/library')} />}>
        {VIDEOS.map((v) => <VideoCard key={v.title} v={v} />)}
      </Rail>
      <Rail title="Podcasts" action={<SeeAll onClick={() => navigate('/library')} />}>
        {PODCASTS.map((p) => <PodcastCard key={p.title} p={p} />)}
      </Rail>
      <Rail title="Featured teachers">
        {TEACHERS.map((t) => <TeacherCard key={t.name} t={t} />)}
      </Rail>
      <Rail title="New books" action={<SeeAll onClick={() => navigate('/library')} />}>
        {BOOKS.map((b) => <BookCard key={b.title} b={b} />)}
      </Rail>
    </div>
  )
}
