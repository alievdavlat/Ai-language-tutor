import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, ListRow, Tabs, type TabItem } from '../../components/ui'
import { IconBook, IconDownload, IconPlay, IconStar, IconVolume, IconYouTube } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { studio } from '../../services/studio/store'

type Tab = 'courses' | 'videos' | 'books' | 'podcasts' | 'about'

const TABS: TabItem<Tab>[] = [
  { id: 'courses', label: 'Courses' },
  { id: 'videos', label: 'Videos' },
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'about', label: 'About' }
]

const COVERS = ['from-sky-500 to-blue-700', 'from-emerald-500 to-teal-700', 'from-violet-500 to-purple-700', 'from-amber-500 to-orange-700', 'from-rose-500 to-pink-700', 'from-indigo-500 to-blue-800']
const coverFor = (seed: string): string => COVERS[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % COVERS.length]

export default function TeacherChannelPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>('courses')
  const [following, setFollowing] = useState(false)
  // Channel owner comes from ?id= (Explore "View" links pass it), else Emma.
  const channelOwnerId = params.get('id') || 'u_emma'
  const me = backend.currentUserId()

  const owner = useBackendQuery(() => backend.getUser(channelOwnerId), [channelOwnerId], null)
  const courses = useBackendQuery(() => backend.myCourses(channelOwnerId), [channelOwnerId], [])
  const lessons = useBackendQuery(() => studio.listLessons(channelOwnerId), [channelOwnerId], [])
  const books = useBackendQuery(() => backend.listMedia(channelOwnerId, 'pdf'), [channelOwnerId], [])
  const podcasts = useBackendQuery(() => backend.listMedia(channelOwnerId, 'audio'), [channelOwnerId], [])
  const followerCount = useBackendQuery(() => backend.followCounts(channelOwnerId).then((c) => c.followers), [channelOwnerId], 0)

  useEffect(() => {
    if (!me) return
    void backend.isFollowing(me, channelOwnerId).then(setFollowing)
  }, [me, channelOwnerId])

  const toggleFollow = async (): Promise<void> => {
    if (!me) return
    const res = await backend.follow(me, channelOwnerId)
    setFollowing(res.following)
    followerCount.refresh()
  }

  const isTeacher = owner.data?.role === 'teacher'
  const name = owner.data?.name ?? (isTeacher ? 'Teacher' : 'Learner')
  const handle = '@' + name.toLowerCase().replace(/[^a-z]+/g, '')
  const bio = owner.data?.bio ?? (isTeacher ? 'Language teacher on SpeakAI.' : 'Language learner on SpeakAI.')
  const avgRating = courses.data.length
    ? (courses.data.reduce((a, c) => a + c.rating, 0) / courses.data.length).toFixed(1)
    : '—'

  return (
    <div className="h-full overflow-y-auto">
      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-r from-brand-700 via-indigo-700 to-slate-900">
        <div aria-hidden className="absolute -top-10 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="px-6 w-full">
        {/* Header */}
        <div className="flex items-end gap-4 -mt-10">
          <div className="ring-4 ring-canvas rounded-full">
            <AvatarCircle name={name} src={(owner.data as { avatarUrl?: string } | null)?.avatarUrl} size="lg" className="!w-20 !h-20 !text-2xl" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            <p className="text-sm text-slate-400">
              {isTeacher
                ? `${handle} · ${followerCount.data.toLocaleString()} followers · ${courses.data.length} courses · ${lessons.data.length} videos`
                : `Learner${owner.data?.country ? ` · ${owner.data.country}` : ''} · Level ${owner.data?.level ?? 'A2'} · ${followerCount.data.toLocaleString()} followers`}
            </p>
          </div>
          {me !== channelOwnerId && (
            <button
              onClick={() => void toggleFollow()}
              className={cn(
                'rounded-full px-6 py-2.5 text-sm font-semibold transition shrink-0',
                following ? 'bg-white/[0.08] text-slate-200 border border-white/15' : 'bg-grad-brand text-white shadow-glow-sm'
              )}
            >
              {following ? 'Following ✓' : 'Follow'}
            </button>
          )}
        </div>

        {isTeacher ? (<>
        {/* Tabs */}
        <div className="mt-5 border-b border-white/10">
          <Tabs items={TABS} active={tab} onChange={setTab} className="!bg-transparent !border-0 !p-0 !gap-1" />
        </div>

        <div className="py-6">
          {tab === 'courses' && (
            courses.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No published courses yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {courses.data.map((c) => (
                  <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="text-left">
                    <div className={cn('rounded-2xl bg-gradient-to-br h-28 ring-1 ring-white/10', c.cover || coverFor(c.title))} />
                    <p className="text-sm font-semibold text-white mt-2 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.level} · <span className="text-amber-300">★ {c.rating}</span></p>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'videos' && (
            lessons.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No interactive video lessons yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {lessons.data.map((v) => (
                  <button key={v.id} onClick={() => navigate(v.shareId ? `/lesson?id=${v.shareId}` : '/library')} className="text-left group">
                    <div className={cn('relative rounded-2xl bg-gradient-to-br h-32 flex items-center justify-center ring-1 ring-white/10', coverFor(v.title))}>
                      <span className="w-11 h-11 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
                        <IconPlay className="w-4 h-4 text-white ml-0.5" />
                      </span>
                      {v.video && <span className="absolute top-2 left-2"><IconYouTube className="w-5 h-5 text-red-500" /></span>}
                      <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">{v.level}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-2 truncate">{v.title}</p>
                    <p className="text-[11px] text-slate-400">{v.views.toLocaleString()} views</p>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'books' && (
            books.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No downloadable resources yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {books.data.map((b) => (
                  <ListRow
                    key={b.id}
                    leading={<span className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center"><IconBook className="w-5 h-5" /></span>}
                    title={b.name}
                    subtitle={`PDF · ${(b.sizeBytes / 1024 / 1024).toFixed(1)} MB`}
                    trailing={<a href={b.url} download className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-300 hover:text-white flex items-center justify-center"><IconDownload className="w-[18px] h-[18px]" /></a>}
                  />
                ))}
              </div>
            )
          )}

          {tab === 'podcasts' && (
            podcasts.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No audio episodes yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {podcasts.data.map((p) => (
                  <ListRow
                    key={p.id}
                    leading={<span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconVolume className="w-5 h-5" /></span>}
                    title={p.name}
                    subtitle="Audio"
                    trailing={<a href={p.url} className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconPlay className="w-[18px] h-[18px]" /></a>}
                  />
                ))}
              </div>
            )
          )}

          {tab === 'about' && (
            <div className="max-w-xl">
              <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>
              {courses.data.length > 0 && (
                <div className="flex items-center gap-2 mt-4 text-xs text-amber-300">
                  <IconStar className="w-4 h-4" /> {avgRating} average rating across {courses.data.length} courses
                </div>
              )}
            </div>
          )}
        </div>
        </>) : (
          /* Learner profile (non-teacher) */
          <div className="mt-6 max-w-xl">
            <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xl font-black text-white">{owner.data?.level ?? 'A2'}</p>
                <p className="text-[11px] text-slate-400">Level</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xl font-black text-white">{followerCount.data}</p>
                <p className="text-[11px] text-slate-400">Followers</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xl font-black text-white">{owner.data?.country ?? '—'}</p>
                <p className="text-[11px] text-slate-400">Country</p>
              </div>
            </div>
            <button onClick={() => navigate('/meet')} className="btn-ghost px-4 py-2 text-sm mt-4">Practice together →</button>
          </div>
        )}
      </div>
    </div>
  )
}
