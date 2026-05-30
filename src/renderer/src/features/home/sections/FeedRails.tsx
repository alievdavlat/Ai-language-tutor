import { useNavigate } from 'react-router-dom'
import type { Course, LibraryItem } from '@shared/types'
import { cn } from '../../../lib/classnames'
import { AvatarCircle, ProgressBar, Rail } from '../../../components/ui'
import { IconBook, IconHeadphones, IconPlay, IconStar, IconYouTube } from '../../../components/icons'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { library } from '../../../services/library/store'
import { isImageCover } from '../../../lib/cover'
import { useTargetLanguageCode } from '../../../lib/language'

function SeeAll({ onClick }: { onClick: () => void }): JSX.Element {
  return <button onClick={onClick} className="text-xs font-semibold text-brand-300 hover:text-brand-200">See all</button>
}

function CourseCard({ c, progress, onClick }: { c: Course; progress?: number; onClick: () => void }): JSX.Element {
  const price = c.pricing.kind === 'free' ? 'Free' : c.pricing.kind === 'one-off' ? `$${c.pricing.usd}` : `$${c.pricing.usdPerMo}/mo`
  return (
    <button onClick={onClick} className="shrink-0 w-56 text-left snap-start group">
      <div className="relative rounded-2xl h-28 overflow-hidden ring-1 ring-white/10">
        {isImageCover(c.thumbnailUrl)
          ? <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          : <div className={cn('w-full h-full bg-gradient-to-br', c.cover)} />}
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white rounded px-1.5 py-0.5">{c.level}</span>
      </div>
      <p className="text-sm font-semibold text-white mt-2 truncate">{c.title}</p>
      {typeof progress === 'number'
        ? <div className="mt-2"><ProgressBar value={progress} /></div>
        : <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1">{c.reviewCount > 0 ? <><IconStar className="w-3 h-3 text-amber-300" /> {c.rating.toFixed(1)} · </> : <span className="text-emerald-300 font-semibold">New · </span>}{price}</p>}
    </button>
  )
}

function VideoCard({ v, onClick }: { v: LibraryItem; onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="shrink-0 w-64 text-left snap-start group">
      <div className="relative rounded-2xl h-36 overflow-hidden ring-1 ring-white/10 flex items-center justify-center">
        {isImageCover(v.thumbnailUrl) ? <img src={v.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-700" />}
        <span className="relative w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition"><IconPlay className="w-5 h-5 text-white ml-0.5" /></span>
        {v.youtubeId && <span className="absolute top-2 left-2"><IconYouTube className="w-5 h-5 text-red-500" /></span>}
      </div>
      <p className="text-sm font-semibold text-white mt-2 truncate">{v.title}</p>
      {v.author && <p className="text-xs text-slate-400 truncate">{v.author}</p>}
    </button>
  )
}

function PodcastCard({ p, onClick }: { p: LibraryItem; onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="shrink-0 w-64 text-left snap-start">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 flex items-center gap-3">
        {isImageCover(p.thumbnailUrl)
          ? <img src={p.thumbnailUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
          : <span className="w-12 h-12 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconHeadphones className="w-5 h-5" /></span>}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{p.title}</p>
          <p className="text-xs text-slate-400 truncate">{p.author ?? 'Audio'}{p.durationLabel ? ` · ${p.durationLabel}` : ''}</p>
        </div>
      </div>
    </button>
  )
}

interface TeacherCardData { id: string; name: string; avatarUrl?: string; followers: number; isFollowing: boolean }

function TeacherCard({ t, onToggleFollow }: { t: TeacherCardData; onToggleFollow: () => void }): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="shrink-0 w-40 snap-start rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col items-center text-center gap-2">
      <button onClick={() => navigate(`/channel?id=${t.id}`)} className="flex flex-col items-center gap-2">
        <AvatarCircle name={t.name} src={t.avatarUrl} size="lg" />
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{t.name}</p>
          <p className="text-xs text-slate-500">{t.followers.toLocaleString()} follower{t.followers === 1 ? '' : 's'}</p>
        </div>
      </button>
      <button onClick={onToggleFollow} className={cn('text-xs font-semibold rounded-full px-4 py-1.5 w-full transition', t.isFollowing ? 'text-slate-300 bg-white/[0.06] border border-white/10 hover:bg-white/[0.1]' : 'text-brand-300 hover:text-white border border-brand-400/30 bg-brand-500/10 hover:bg-brand-500/30')}>
        {t.isFollowing ? 'Following ✓' : 'Follow'}
      </button>
    </div>
  )
}

function BookCard({ b, onClick }: { b: LibraryItem; onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="shrink-0 w-32 text-left snap-start">
      <div className="relative rounded-xl h-44 overflow-hidden ring-1 ring-white/10 flex items-end">
        {isImageCover(b.thumbnailUrl) ? <img src={b.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center"><IconBook className="w-8 h-8 text-white/50" /></div>}
        <div aria-hidden className="absolute left-2.5 top-0 bottom-0 w-px bg-white/20" />
        <p className="relative text-xs font-bold text-white leading-tight p-3 bg-gradient-to-t from-black/70 to-transparent w-full">{b.title}</p>
      </div>
      {b.author && <p className="text-[11px] text-slate-400 mt-1.5 truncate">{b.author}</p>}
    </button>
  )
}

export default function FeedRails(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguageCode()
  const userId = backend.currentUserId()

  // Continue learning — real enrollments with progress.
  const continueLearning = useBackendQuery(async () => {
    if (!userId) return [] as { course: Course; progress: number }[]
    const ens = await backend.myEnrollments(userId)
    const rows = await Promise.all(ens.map(async (e) => {
      const c = await backend.getCourse(e.courseId)
      return c ? { course: c, progress: e.progress } : null
    }))
    return rows.filter((r): r is { course: Course; progress: number } => r !== null)
  }, [userId], [])

  const courses = useBackendQuery(() => backend.listCourses({ language: lang }), [lang], [])
  const videos = useBackendQuery(() => library.list('video', lang), [lang], [])
  const audios = useBackendQuery(() => library.list('audio', lang), [lang], [])
  const books = useBackendQuery(() => library.list('book', lang), [lang], [])

  const teachers = useBackendQuery(async () => {
    const allUsers = await Promise.all(['u_emma', 'u_james', 'u_marco'].map((id) => backend.getUser(id)))
    const me = backend.currentUserId()
    const rows: TeacherCardData[] = []
    for (const u of allUsers) {
      if (!u) continue
      const counts = await backend.followCounts(u.id)
      const isFollowing = me ? await backend.isFollowing(me, u.id) : false
      rows.push({ id: u.id, name: u.name, avatarUrl: (u as { avatarUrl?: string }).avatarUrl, followers: counts.followers, isFollowing })
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
      {continueLearning.data.length > 0 && (
        <Rail title="Continue learning">
          {continueLearning.data.map(({ course, progress }) => (
            <CourseCard key={course.id} c={course} progress={progress} onClick={() => navigate(`/course/${course.id}`)} />
          ))}
        </Rail>
      )}

      <Rail title="Popular courses" action={<SeeAll onClick={() => navigate('/courses')} />}>
        {courses.data.length === 0 && !courses.loading
          ? <p className="text-xs text-slate-500 px-4">No courses yet for this language.</p>
          : courses.data.slice(0, 8).map((c) => <CourseCard key={c.id} c={c} onClick={() => navigate(`/course/${c.id}`)} />)}
      </Rail>

      <Rail title="Trending videos" action={<SeeAll onClick={() => navigate('/library')} />}>
        {videos.data.length === 0
          ? <p className="text-xs text-slate-500 px-4">No videos yet — add some in Library.</p>
          : videos.data.map((v) => <VideoCard key={v.id} v={v} onClick={() => navigate('/library')} />)}
      </Rail>

      <Rail title="Listen" action={<SeeAll onClick={() => navigate('/library')} />}>
        {audios.data.length === 0
          ? <p className="text-xs text-slate-500 px-4">No audio yet — add some in Library.</p>
          : audios.data.map((p) => <PodcastCard key={p.id} p={p} onClick={() => navigate('/library')} />)}
      </Rail>

      {teachers.data.length > 0 && (
        <Rail title="Featured teachers">
          {teachers.data.map((t) => <TeacherCard key={t.id} t={t} onToggleFollow={() => void toggleFollow(t.id)} />)}
        </Rail>
      )}

      <Rail title="New books" action={<SeeAll onClick={() => navigate('/library')} />}>
        {books.data.length === 0
          ? <p className="text-xs text-slate-500 px-4">No books yet — add a PDF in Library.</p>
          : books.data.map((b) => <BookCard key={b.id} b={b} onClick={() => navigate(`/library/book/${b.id}`)} />)}
      </Rail>
    </div>
  )
}
