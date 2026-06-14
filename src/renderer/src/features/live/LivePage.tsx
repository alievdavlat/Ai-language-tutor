import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import RealtimeStatus from '../../components/realtime/RealtimeStatus'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { resolveLiveStreams, type ResolvedStream } from '../../services/social/liveFeed'
import { IconLive, IconPlus, IconTrophy, IconUsers } from '../../components/icons'

const roomLink = (r: ResolvedStream): string => `${r.group ? '/live/group' : '/live/room'}?id=${r.stream.id}`

type Filter = 'following' | 'courses' | 'teachers' | 'students'
const FILTERS: TabItem<Filter>[] = [
  { id: 'following', label: 'Following' },
  { id: 'courses', label: 'Courses' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'students', label: 'Students' }
]

function StoryRing({ r, onClick }: { r: ResolvedStream; onClick: () => void }): JSX.Element {
  const avatarUrl = (r.host as { avatarUrl?: string } | null)?.avatarUrl
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
      <span className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-amber-400">
        <span className="block p-0.5 rounded-full bg-canvas">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <AvatarCircle name={r.hostName} size="md" />
          )}
        </span>
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] font-black bg-rose-600 text-white px-1 py-px rounded">LIVE</span>
      </span>
      <span className="text-[11px] text-slate-400 truncate max-w-[60px]">{r.hostName.split(' ')[0]}</span>
    </button>
  )
}

function GoLiveRing({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
      <span className="p-0.5 rounded-full bg-white/15">
        <span className="block p-0.5 rounded-full bg-canvas">
          <span className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-slate-300"><IconPlus className="w-5 h-5" /></span>
        </span>
      </span>
      <span className="text-[11px] text-slate-400 truncate max-w-[60px]">Go live</span>
    </button>
  )
}

function StreamCard({ r }: { r: ResolvedStream }): JSX.Element {
  const navigate = useNavigate()
  const avatarUrl = (r.host as { avatarUrl?: string } | null)?.avatarUrl
  return (
    <button onClick={() => navigate(roomLink(r))} className="text-left group">
      <div className={cn('relative rounded-xl bg-gradient-to-br h-40 ring-1 ring-white/10 overflow-hidden', r.stream.cover)}>
        {r.stream.imageUrl && <img src={r.stream.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white rounded px-1.5 py-0.5 z-10">Live</span>
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[11px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">
          <IconUsers className="w-3 h-3" /> {r.stream.viewerCount.toLocaleString()}
        </span>
        {r.group && (
          <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-black rounded px-1.5 py-0.5">Group</span>
        )}
      </div>
      <div className="flex gap-2.5 mt-2">
        <AvatarCircle name={r.hostName} src={avatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition">{r.stream.title}</p>
          <p className="text-xs text-slate-400 truncate">{r.hostName} · {r.stream.category}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {r.tags.map((t) => (
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
  const me = backend.currentUserId()
  const profile = useAppStore((s) => s.profile)
  const [filter, setFilter] = useState<Filter>('following')

  // Start a real stream: create a backend row (unique id, host = me) then enter
  // the room by that id. No more shared `my-stream` / `?host=1` (fixes #B21).
  const goLive = async (group: boolean): Promise<void> => {
    if (!me) { navigate('/signin'); return }
    const who = profile?.name ?? 'You'
    try {
      const stream = await backend.createLiveStream({
        hostId: me,
        title: group ? `${who}'s group practice` : `${who} is live`,
        category: group ? 'Group practice' : 'Live',
        language: profile?.targetLanguage ?? 'en'
      })
      navigate(`${group ? '/live/group' : '/live/room'}?id=${stream.id}&host=1`)
    } catch {
      // Best-effort: still enter a room so the host isn't blocked.
      navigate(`${group ? '/live/group' : '/live/room'}?id=my-${group ? 'room' : 'stream'}`)
    }
  }

  const { data: streams, loading } = useBackendQuery(() => resolveLiveStreams(), [], [])
  const { data: followingIds } = useBackendQuery(
    async () => (me ? (await backend.following(me)).map((u) => u.id) : []),
    [me],
    []
  )

  const visible = useMemo(() => {
    const followed = streams.filter((s) => followingIds.includes(s.stream.hostId))
    return streams.filter((r) => {
      if (filter === 'teachers') return r.hostRole === 'teacher'
      if (filter === 'students') return r.hostRole === 'student'
      if (filter === 'courses') return /ielts|grammar|speaking|exam|business|pronun/i.test(`${r.stream.category} ${r.stream.title}`)
      // following: hosts you follow; if you follow no live host, show everyone
      // so the tab is never mysteriously empty.
      return followed.length ? followingIds.includes(r.stream.hostId) : true
    })
  }, [streams, filter, followingIds])

  const featured = visible[0] ?? streams[0] ?? null

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live</h1>
            <p className="text-sm text-slate-400 mt-1">Watch live lessons, join group streams, or go live.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/quiz/live')} className="btn-ghost px-4 py-2.5 inline-flex items-center gap-2 text-sm">
              <IconTrophy className="w-4 h-4" /> Live quiz
            </button>
            <button onClick={() => void goLive(true)} className="btn-ghost px-4 py-2.5 inline-flex items-center gap-2 text-sm">
              <IconUsers className="w-4 h-4" /> Group live
            </button>
            <button onClick={() => void goLive(false)} className="btn-primary px-5 py-2.5 inline-flex items-center gap-2">
              <IconLive className="w-4 h-4" /> Go live
            </button>
          </div>
        </div>

        <RealtimeStatus />

        {/* Empty state — nobody is live right now. */}
        {!loading && streams.length === 0 ? (
          <div className="rounded-card border border-white/10 bg-gradient-to-br from-brand-500/12 to-violet-500/8 p-8 text-center flex flex-col items-center gap-4">
            <span className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center"><IconLive className="w-8 h-8 text-brand-200" /></span>
            <div>
              <h2 className="text-lg font-bold text-white">No one is live right now</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-md">Be the first to go live, or pair with a study buddy and practise together.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void goLive(false)} className="btn-primary px-5 py-2.5 inline-flex items-center gap-2">
                <IconLive className="w-4 h-4" /> Go live
              </button>
              <button onClick={() => navigate('/buddy')} className="btn-ghost px-4 py-2.5 inline-flex items-center gap-2 text-sm">
                <IconUsers className="w-4 h-4" /> Find a buddy
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Live-now story rings — the real hosts streaming now. */}
            <div className="flex gap-4 overflow-x-auto pb-1 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <GoLiveRing onClick={() => void goLive(false)} />
              {streams.map((r) => (
                <StoryRing key={r.stream.id} r={r} onClick={() => navigate(roomLink(r))} />
              ))}
            </div>

            {/* Featured */}
            {featured && (
              <button onClick={() => navigate(roomLink(featured))} className="text-left">
                <div className={cn('relative overflow-hidden rounded-card bg-gradient-to-br h-56 sm:h-64 ring-1 ring-white/10 flex flex-col justify-end p-6', featured.stream.cover)}>
                  {featured.stream.imageUrl && <img src={featured.stream.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div aria-hidden className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                  </span>
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs text-white bg-black/40 rounded-full px-3 py-1.5"><IconUsers className="w-3.5 h-3.5" /> {featured.stream.viewerCount.toLocaleString()}</span>
                  <h2 className="relative text-2xl font-bold text-white">{featured.stream.title}</h2>
                  <div className="relative flex items-center gap-2 mt-2">
                    <AvatarCircle name={featured.hostName} src={(featured.host as { avatarUrl?: string } | null)?.avatarUrl} size="sm" />
                    <span className="text-sm text-white/90">{featured.hostName}</span>
                    <span className="text-xs text-white/60">· {featured.stream.category}</span>
                  </div>
                </div>
              </button>
            )}

            {/* Filters */}
            <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />

            {/* Grid */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
                {filter === 'following' ? 'Live from people you follow' : 'Live channels you might like'}
              </p>
              {visible.length === 0 ? (
                <p className="text-sm text-slate-500 py-6">No live streams in this view yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-6">
                  {visible.map((r) => <StreamCard key={r.stream.id} r={r} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
