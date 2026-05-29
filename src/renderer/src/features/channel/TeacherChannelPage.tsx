import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, ListRow, Tabs, type TabItem } from '../../components/ui'
import { IconBook, IconDownload, IconPlay, IconStar, IconVolume, IconYouTube } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'

type Tab = 'courses' | 'videos' | 'books' | 'podcasts' | 'about'

const TABS: TabItem<Tab>[] = [
  { id: 'courses', label: 'Courses' },
  { id: 'videos', label: 'Videos' },
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'about', label: 'About' }
]

const TEACHER = {
  name: 'Emma Carter',
  handle: '@emmaspeaks',
  bio: 'British English teacher (CELTA, 8 yrs). I make grammar simple and speaking fun. New video every week + live lessons on weekends.',
  followers: '12.4k',
  courses: 6,
  videos: 84
}

const COURSES = [
  { title: 'Everyday Conversation', level: 'A2–B1', rating: '4.8', cover: 'from-sky-500 to-blue-700' },
  { title: 'Grammar Foundations', level: 'A1–A2', rating: '4.9', cover: 'from-emerald-500 to-teal-700' },
  { title: 'Speaking with Confidence', level: 'B1–B2', rating: '4.7', cover: 'from-violet-500 to-purple-700' }
]

const PLAYLISTS = ['Present tenses', 'Pronunciation tips', 'IELTS speaking', 'Phrasal verbs']

const VIDEOS = [
  { title: 'Fix these 5 mistakes', mins: '8:12', cover: 'from-sky-500 to-blue-700' },
  { title: 'Linking sounds naturally', mins: '6:40', cover: 'from-emerald-500 to-teal-700' },
  { title: 'Past tenses in 10 min', mins: '10:05', cover: 'from-violet-500 to-purple-700' },
  { title: 'Small talk that works', mins: '7:22', cover: 'from-amber-500 to-orange-700' },
  { title: 'Articles: a / an / the', mins: '9:30', cover: 'from-rose-500 to-pink-700' },
  { title: 'Sound more polite', mins: '5:50', cover: 'from-indigo-500 to-blue-800' }
]

export default function TeacherChannelPage(): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('courses')
  const [following, setFollowing] = useState(false)
  // Hardcoded channel page belongs to Emma (u_emma) until we wire a real route param.
  const channelOwnerId = 'u_emma'
  const me = backend.currentUserId()
  const followerCount = useBackendQuery(
    () => backend.followCounts(channelOwnerId).then((c) => c.followers),
    [],
    0
  )
  useEffect(() => {
    if (!me) return
    void backend.isFollowing(me, channelOwnerId).then(setFollowing)
  }, [me])

  const toggleFollow = async (): Promise<void> => {
    if (!me) return
    const res = await backend.follow(me, channelOwnerId)
    setFollowing(res.following)
    followerCount.refresh()
  }

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
            <AvatarCircle name={TEACHER.name} size="lg" className="!w-20 !h-20 !text-2xl" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold tracking-tight">{TEACHER.name}</h1>
            <p className="text-sm text-slate-400">
              {TEACHER.handle} · {followerCount.data.toLocaleString()} followers · {TEACHER.courses} courses · {TEACHER.videos} videos
            </p>
          </div>
          <button
            onClick={() => void toggleFollow()}
            className={cn(
              'rounded-full px-6 py-2.5 text-sm font-semibold transition shrink-0',
              following ? 'bg-white/[0.08] text-slate-200 border border-white/15' : 'bg-grad-brand text-white shadow-glow-sm'
            )}
          >
            {following ? 'Following ✓' : 'Follow'}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 border-b border-white/10">
          <Tabs items={TABS} active={tab} onChange={setTab} className="!bg-transparent !border-0 !p-0 !gap-1" />
        </div>

        <div className="py-6">
          {tab === 'courses' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {COURSES.map((c) => (
                <button key={c.title} onClick={() => navigate('/course')} className="text-left">
                  <div className={cn('rounded-2xl bg-gradient-to-br h-28 ring-1 ring-white/10', c.cover)} />
                  <p className="text-sm font-semibold text-white mt-2 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.level} · <span className="text-amber-300">★ {c.rating}</span></p>
                </button>
              ))}
            </div>
          )}

          {tab === 'videos' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {PLAYLISTS.map((p) => (
                  <span key={p} className="text-xs font-medium rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-slate-300">
                    {p}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {VIDEOS.map((v) => (
                  <button key={v.title} onClick={() => navigate('/library')} className="text-left group">
                    <div className={cn('relative rounded-2xl bg-gradient-to-br h-32 flex items-center justify-center ring-1 ring-white/10', v.cover)}>
                      <span className="w-11 h-11 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
                        <IconPlay className="w-4 h-4 text-white ml-0.5" />
                      </span>
                      <span className="absolute top-2 left-2"><IconYouTube className="w-5 h-5 text-red-500" /></span>
                      <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">{v.mins}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-2 truncate">{v.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'books' && (
            <div className="flex flex-col gap-2">
              {['Grammar cheat-sheet.pdf', 'Speaking phrases pack.pdf', '50 common idioms.pdf'].map((b) => (
                <ListRow
                  key={b}
                  leading={<span className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center"><IconBook className="w-5 h-5" /></span>}
                  title={b}
                  subtitle="PDF · free download"
                  trailing={<button className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-300 hover:text-white flex items-center justify-center"><IconDownload className="w-[18px] h-[18px]" /></button>}
                />
              ))}
            </div>
          )}

          {tab === 'podcasts' && (
            <div className="flex flex-col gap-2">
              {['Weekend chat #12', 'Pronunciation clinic #4', 'Listener questions #8'].map((p) => (
                <ListRow
                  key={p}
                  leading={<span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconVolume className="w-5 h-5" /></span>}
                  title={p}
                  subtitle="Audio · 14:20"
                  trailing={<button className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconPlay className="w-[18px] h-[18px]" /></button>}
                />
              ))}
            </div>
          )}

          {tab === 'about' && (
            <div className="max-w-xl">
              <p className="text-sm text-slate-300 leading-relaxed">{TEACHER.bio}</p>
              <div className="flex items-center gap-2 mt-4 text-xs text-amber-300">
                <IconStar className="w-4 h-4" /> 4.8 average rating across courses
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
