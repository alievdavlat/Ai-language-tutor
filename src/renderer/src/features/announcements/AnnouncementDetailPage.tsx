import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader } from '../../components/ui'
import { IconBell, IconChat, IconLive, IconUsers } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { dateTime } from '../../lib/time'
import type { LiveAnnouncement, PlatformUser } from '@shared/types'

/**
 * Announcement / event detail (#A48, old #21) — the page Home's hero
 * "View details" leads to. Real announcement row + the announcing teacher,
 * with a live countdown and Join/Channel/Message actions.
 */
function useCountdown(whenISO: string | undefined): string | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!whenISO) return null
  const ms = new Date(whenISO).getTime() - now
  if (ms <= 0) return null
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

export default function AnnouncementDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const me = backend.currentUserId()

  const all = useBackendQuery(() => backend.listAnnouncements(), [], [] as LiveAnnouncement[])
  const a = useMemo(() => all.data.find((x) => x.id === id) ?? null, [all.data, id])

  const teacher = useBackendQuery<PlatformUser | null>(
    async () => (a ? await backend.getUser(a.teacherId) : null),
    [a?.teacherId],
    null
  )
  const [following, setFollowing] = useState(false)
  useEffect(() => {
    if (!me || !a) return
    void backend.isFollowing(me, a.teacherId).then(setFollowing).catch(() => {})
  }, [me, a])

  const countdown = useCountdown(a?.whenISO)
  const started = a ? new Date(a.whenISO).getTime() <= Date.now() : false
  const isLiveAnnouncement = a ? /live/i.test(a.title) : false

  const toggleFollow = async (): Promise<void> => {
    if (!me || !a) return
    const res = await backend.follow(me, a.teacherId)
    setFollowing(res.following)
  }

  if (!all.loading && !a) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-lg font-bold text-white">Announcement not found</p>
        <p className="text-sm text-slate-400">It may have been removed by the teacher.</p>
        <button onClick={() => navigate('/home')} className="btn-primary text-sm px-5 py-2 mt-2">Back to Home</button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-3xl mx-auto flex flex-col gap-6">
        <PageHeader
          eyebrow="Announcement"
          title={a?.title ?? 'Loading…'}
          back="/home"
          crumbs={[{ label: 'Home', to: '/home' }, { label: 'Announcement' }]}
        />

        {/* Hero */}
        <div className={cn('relative overflow-hidden rounded-card border border-white/10 min-h-[200px] bg-gradient-to-br', a?.cover ?? 'from-rose-600 via-red-700 to-slate-950')}>
          {a?.imageUrl && <img src={a.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative p-6 flex flex-col justify-end min-h-[200px]">
            <span className="self-start rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
              From your teachers
            </span>
            <h1 className="text-2xl font-bold text-white mt-3">{a?.title}</h1>
            <p className="text-sm text-white/85 mt-1.5 max-w-xl">{a?.body}</p>
          </div>
        </div>

        {/* When + countdown */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-wrap items-center gap-5">
          <span className="w-11 h-11 rounded-2xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0">
            <IconLive className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-[180px]">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">When</p>
            <p className="text-sm font-bold text-white mt-0.5">{a ? dateTime(a.whenISO) : '…'}</p>
          </div>
          {countdown ? (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Starts in</p>
              <p className="text-xl font-black text-amber-300 tabular-nums mt-0.5">{countdown}</p>
            </div>
          ) : started ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Happening now / passed
            </span>
          ) : null}
        </div>

        {/* Teacher */}
        {teacher.data && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex items-center gap-4">
            <AvatarCircle name={teacher.data.name} src={teacher.data.avatarUrl} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{teacher.data.name}</p>
              <p className="text-xs text-slate-400 truncate">{teacher.data.bio || 'Teacher on SpeakAI'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void toggleFollow()}
                className={cn(
                  'rounded-pill text-xs font-bold px-4 py-2 transition',
                  following ? 'bg-white/[0.08] text-slate-200 ring-1 ring-white/15' : 'btn-primary'
                )}
              >
                {following ? 'Following ✓' : 'Follow'}
              </button>
              <button
                onClick={() => navigate(`/inbox?user=${teacher.data?.id}`)}
                className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-1.5"
              >
                <IconChat className="w-3.5 h-3.5" /> Message
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isLiveAnnouncement && (
            <button
              onClick={() => navigate('/live')}
              disabled={!started}
              className="btn-primary flex-1 text-sm py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <IconUsers className="w-4 h-4" /> {started ? 'Join the live session' : 'Join opens at start time'}
            </button>
          )}
          <button
            onClick={() => navigate(`/channel?id=${a?.teacherId}`)}
            className={cn('text-sm py-3 inline-flex items-center justify-center gap-2', isLiveAnnouncement ? 'btn-ghost px-5' : 'btn-primary flex-1')}
          >
            <IconBell className="w-4 h-4" /> Open teacher's channel
          </button>
        </div>
      </div>
    </div>
  )
}
