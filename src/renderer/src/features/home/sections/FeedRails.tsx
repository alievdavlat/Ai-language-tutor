import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/classnames'
import { AvatarCircle, ProgressBar, Rail } from '../../../components/ui'
import { IconPlay, IconStar, IconVolume, IconYouTube } from '../../../components/icons'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { useTargetLanguageCode } from '../../../lib/language'

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

// Popular courses now load from the local backend, filtered to the user's
// learning language. The data still has the same `{title, teacher, rating, cover}`
// shape used by CourseCard so the rendering didn't change.

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

interface TeacherCardData { id: string; name: string; followers: number; isFollowing: boolean }

function TeacherCard({ t, onToggleFollow }: { t: TeacherCardData; onToggleFollow: () => void }): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="shrink-0 w-40 snap-start rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col items-center text-center gap-2">
      <button onClick={() => navigate('/channel')} className="flex flex-col items-center gap-2">
        <AvatarCircle name={t.name} size="lg" />
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{t.name}</p>
          <p className="text-xs text-slate-500">{t.followers.toLocaleString()} followers</p>
        </div>
      </button>
      <button
        onClick={onToggleFollow}
        className={cn(
          'text-xs font-semibold rounded-full px-4 py-1.5 w-full transition',
          t.isFollowing
            ? 'text-slate-300 bg-white/[0.06] border border-white/10 hover:bg-white/[0.1]'
            : 'text-brand-300 hover:text-white border border-brand-400/30 bg-brand-500/10 hover:bg-brand-500/30'
        )}
      >
        {t.isFollowing ? 'Following ✓' : 'Follow'}
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
  const lang = useTargetLanguageCode()

  // Popular courses — backend-driven, filtered to current language.
  const courses = useBackendQuery(
    () => backend.listCourses({ language: lang }),
    [lang],
    []
  )

  // Featured teachers + follow state.
  const teachers = useBackendQuery(async () => {
    const allUsers = await Promise.all(
      ['u_emma', 'u_james', 'u_marco'].map((id) => backend.getUser(id))
    )
    const me = backend.currentUserId()
    const rows: TeacherCardData[] = []
    for (const u of allUsers) {
      if (!u) continue
      const counts = await backend.followCounts(u.id)
      const isFollowing = me ? await backend.isFollowing(me, u.id) : false
      rows.push({ id: u.id, name: u.name, followers: counts.followers, isFollowing })
    }
    return rows
  }, [], [])

  const toggleFollow = async (teacherId: string): Promise<void> => {
    const me = backend.currentUserId()
    if (!me) return
    await backend.follow(me, teacherId)
    teachers.refresh()
  }

  return (
    <div className="flex flex-col gap-7">
      <Rail title="Continue learning">
        {CONTINUE.map((c) => <CourseCard key={c.title} c={c} progress={c.progress} to="/learn/lesson" />)}
      </Rail>
      <Rail title="Popular courses" action={<SeeAll onClick={() => navigate('/courses')} />}>
        {courses.data.length === 0 && !courses.loading ? (
          <p className="text-xs text-slate-500 px-4">No courses yet for this language.</p>
        ) : (
          courses.data.slice(0, 8).map((c) => (
            <CourseCard
              key={c.id}
              c={{ title: c.title, cover: c.cover, teacher: c.description, rating: c.rating.toFixed(1) }}
            />
          ))
        )}
      </Rail>
      <Rail title="Trending videos" action={<SeeAll onClick={() => navigate('/library')} />}>
        {VIDEOS.map((v) => <VideoCard key={v.title} v={v} />)}
      </Rail>
      <Rail title="Podcasts" action={<SeeAll onClick={() => navigate('/library')} />}>
        {PODCASTS.map((p) => <PodcastCard key={p.title} p={p} />)}
      </Rail>
      <Rail title="Featured teachers">
        {teachers.data.map((t) => <TeacherCard key={t.id} t={t} onToggleFollow={() => void toggleFollow(t.id)} />)}
      </Rail>
      <Rail title="New books" action={<SeeAll onClick={() => navigate('/library')} />}>
        {BOOKS.map((b) => <BookCard key={b.title} b={b} />)}
      </Rail>
    </div>
  )
}
