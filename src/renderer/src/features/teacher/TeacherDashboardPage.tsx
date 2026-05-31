import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { isImageCover } from '../../lib/cover'
import { uploadUrl } from '../../services/backend'
import { useAppStore } from '../../store/useAppStore'
import { AvatarCircle, StatCard } from '../../components/ui'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { timeAgo } from '../../lib/time'
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconChart,
  IconLive,
  IconPlus,
  IconStar,
  IconTrophy,
  IconUsers,
  IconYouTube,
  type IconProps
} from '../../components/icons'

const ACTIONS: { label: string; Icon: (p: IconProps) => JSX.Element; to: string; tone: string }[] = [
  { label: 'New lesson', Icon: IconPlus, to: '/teacher/new', tone: 'bg-grad-brand text-white' },
  { label: 'New course', Icon: IconBook, to: '/teacher/course/new', tone: 'bg-white/[0.06] text-slate-200 border border-white/10' },
  { label: 'Go live', Icon: IconLive, to: '/teacher/live', tone: 'bg-rose-500/15 text-rose-300 border border-rose-400/30' },
  { label: 'YouTube', Icon: IconYouTube, to: '/teacher/youtube', tone: 'bg-red-500/15 text-red-300 border border-red-400/30' }
]

const SECONDARY_NAV: { label: string; to: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { label: 'Students', to: '/teacher/students', Icon: IconUsers },
  { label: 'Analytics', to: '/teacher/analytics', Icon: IconChart },
  { label: 'Earnings', to: '/teacher/monetization', Icon: IconTrophy },
  { label: 'Live & clips', to: '/teacher/live', Icon: IconLive },
  { label: 'Clips composer', to: '/teacher/clips', Icon: IconYouTube }
]

export default function TeacherDashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const me = backend.currentUserId()
  const myName = profile?.name?.trim() || 'Teacher'
  // Real course list for the signed-in teacher. The dashboard cards still keep
  // their gradient covers because the underlying Course has a `cover` field.
  const myCourses = useBackendQuery(
    () => me ? backend.myCourses(me) : Promise.resolve([]),
    [me],
    []
  )
  const students = useBackendQuery(
    () => me ? backend.studentsOf(me) : Promise.resolve([]),
    [me],
    []
  )
  const announcements = useBackendQuery(
    async () => (me ? (await backend.listAnnouncements()).filter((a) => a.teacherId === me) : []),
    [me],
    []
  )
  const followers = useBackendQuery(
    () => (me ? backend.followCounts(me).then((c) => c.followers) : Promise.resolve(0)),
    [me],
    0
  )
  // Real recent-activity feed: student enrolments + reviews on this teacher's
  // courses, newest first. Replaces the old hardcoded Dilnoza/Bekzod mock.
  const activity = useBackendQuery<{ who: string; what: string; at: string }[]>(
    async () => {
      if (!me) return []
      const items: { who: string; what: string; at: string }[] = []
      const studs = await backend.studentsOf(me)
      for (const s of studs) {
        items.push({ who: s.user.name, what: `enrolled in ${s.course.title}`, at: s.enrollment.enrolledAt })
      }
      const courses = await backend.myCourses(me)
      const reviewLists = await Promise.all(
        courses.map((c) => backend.listReviews(c.id).then((rs) => rs.map((r) => ({ r, c }))))
      )
      for (const { r, c } of reviewLists.flat()) {
        const u = await backend.getUser(r.userId)
        items.push({ who: u?.name ?? 'A student', what: `left a ${r.rating}★ review on ${c.title}`, at: r.createdAt })
      }
      return items.sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 6)
    },
    [me],
    []
  )

  // Real headline stats derived from this teacher's actual data.
  const ratedCourses = myCourses.data.filter((c) => c.rating > 0)
  const avgRating = ratedCourses.length
    ? (ratedCourses.reduce((a, c) => a + c.rating, 0) / ratedCourses.length).toFixed(1)
    : '—'
  const STATS = [
    { value: students.data.length.toLocaleString(), label: 'Students', tone: 'brand' as const },
    { value: followers.data.toLocaleString(), label: 'Followers', tone: 'violet' as const },
    { value: String(myCourses.data.length), label: 'Courses', tone: 'emerald' as const },
    { value: avgRating, label: 'Avg rating', tone: 'amber' as const }
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <AvatarCircle name={myName} size="md" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {myName.split(' ')[0]}</h1>
            <p className="text-sm text-slate-400">
              {myCourses.data.length} course{myCourses.data.length === 1 ? '' : 's'} · {students.data.length} student{students.data.length === 1 ? '' : 's'} enrolled
            </p>
          </div>
          <button onClick={() => navigate('/channel')} className="btn-ghost px-4 py-2 text-sm shrink-0">View channel</button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACTIONS.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className={cn('rounded-2xl px-4 py-4 flex flex-col items-center gap-2 text-sm font-semibold transition hover:brightness-110', a.tone)}>
              <a.Icon className="w-6 h-6" />
              {a.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s) => <StatCard key={s.label} value={s.value} label={s.label} tone={s.tone} />)}
        </div>

        {/* Section nav */}
        <div className="flex flex-wrap gap-2">
          {SECONDARY_NAV.map((s) => (
            <button
              key={s.to}
              onClick={() => navigate(s.to)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
            >
              <s.Icon className="w-3.5 h-3.5 text-brand-300" /> {s.label}
            </button>
          ))}
        </div>

        {/* Announcement composer → students see these in their Home hero (#28) */}
        {me && (
          <AnnouncementComposer
            teacherId={me}
            recent={announcements.data}
            onPosted={announcements.refresh}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Courses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Your courses</h2>
              <button onClick={() => navigate('/teacher/new')} className="text-xs font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1">
                <IconPlus className="w-3.5 h-3.5" /> New
              </button>
            </div>
            {myCourses.data.length === 0 && !myCourses.loading ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                <p className="text-sm text-slate-300">No courses yet.</p>
                <button onClick={() => navigate('/teacher/new')} className="btn-primary text-xs px-4 py-2 mt-3">Create your first course</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {myCourses.data.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                    <div className={cn('w-14 h-10 rounded-lg bg-gradient-to-br shrink-0', c.cover)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1"><IconUsers className="w-3 h-3" /> {c.enrollmentCount.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1 text-amber-300"><IconStar className="w-3 h-3" /> {c.rating.toFixed(1)}</span>
                        {!c.publishedAt && <span className="text-amber-300/80">· Draft</span>}
                      </p>
                    </div>
                    <button onClick={() => navigate('/course')} className="text-xs font-semibold text-brand-300 shrink-0">Manage →</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <aside className="lg:border-l lg:border-white/10 lg:pl-6">
            <h2 className="text-base font-bold mb-3">Recent activity</h2>
            {activity.data.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity yet. As students enrol and review your courses, it appears here.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activity.data.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <AvatarCircle name={a.who} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 leading-snug"><b className="text-white">{a.who}</b> {a.what}</p>
                      <p className="text-xs text-slate-500">{a.at ? `${timeAgo(a.at)}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/channel')} className="mt-4 w-full btn-ghost py-2 text-sm inline-flex items-center justify-center gap-1">
              Manage channel <IconArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}

const HERO_COVERS = [
  'from-rose-600 via-red-700 to-slate-950',
  'from-blue-600 via-indigo-700 to-slate-950',
  'from-violet-600 via-purple-700 to-slate-950',
  'from-amber-500 via-orange-700 to-slate-950'
]

function AnnouncementComposer({
  teacherId,
  recent,
  onPosted
}: {
  teacherId: string
  recent: { id: string; title: string; body: string; whenISO: string }[]
  onPosted: () => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [whenISO, setWhenISO] = useState('')
  const [coverIdx, setCoverIdx] = useState(0)
  const [image, setImage] = useState('')
  const imgRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  const pickImage = async (file?: File): Promise<void> => {
    if (!file || file.size > 4 * 1024 * 1024) return
    setImage(await uploadUrl(file, 'covers'))
  }

  const post = async (): Promise<void> => {
    if (title.trim().length < 3 || saving) return
    setSaving(true)
    try {
      await backend.createAnnouncement({
        teacherId,
        title: title.trim(),
        body: body.trim() || 'Join my next session!',
        whenISO: whenISO ? new Date(whenISO).toISOString() : new Date().toISOString(),
        cover: HERO_COVERS[coverIdx],
        imageUrl: image || undefined
      })
      setTitle('')
      setBody('')
      setWhenISO('')
      setImage('')
      setOpen(false)
      onPosted()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center">📣</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Announce to your students</p>
          <p className="text-xs text-slate-400">Posts appear in every learner's Home hero carousel.</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-primary text-xs px-4 py-2 shrink-0">
          {open ? 'Close' : 'New announcement'}
        </button>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input text-sm" placeholder="Title (e.g. Live IELTS Q&A tonight)" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="input text-sm min-h-[70px] resize-none" placeholder="Details students will see…" />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">When</label>
              <input type="datetime-local" value={whenISO} onChange={(e) => setWhenISO(e.target.value)} className="input text-sm mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Cover gradient (fallback)</label>
              <div className="flex gap-2 mt-1.5">
                {HERO_COVERS.map((c, i) => (
                  <button key={c} onClick={() => setCoverIdx(i)} className={cn('h-9 flex-1 rounded-lg bg-gradient-to-br transition', c, coverIdx === i ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100')} />
                ))}
              </div>
            </div>
          </div>
          {/* Banner image (shown on the Home hero instead of the gradient) */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Banner image</label>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickImage(e.target.files?.[0])} />
            {isImageCover(image) ? (
              <div className="relative mt-1.5 rounded-xl overflow-hidden aspect-[3/1] ring-1 ring-white/10">
                <img src={image} alt="banner" className="w-full h-full object-cover" />
                <button onClick={() => setImage('')} className="absolute top-2 right-2 text-[11px] font-semibold bg-black/60 text-white rounded-full px-2.5 py-1">Remove</button>
              </div>
            ) : (
              <button onClick={() => imgRef.current?.click()} className="mt-1.5 w-full rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-4 text-sm text-slate-400 hover:bg-white/[0.04]">🖼️ Upload a banner image (optional)</button>
            )}
          </div>
          <button onClick={() => void post()} disabled={title.trim().length < 3 || saving} className="btn-primary text-sm px-5 py-2 self-end">
            {saving ? 'Posting…' : 'Post announcement'}
          </button>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-4 border-t border-white/[0.06] pt-3 flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Your recent announcements</p>
          {recent.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span className="text-slate-200 font-medium truncate flex-1">{a.title}</span>
              <span className="text-slate-500 shrink-0">{timeAgo(a.whenISO)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
