import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, StatCard } from '../../components/ui'
import {
  IconArrowRight,
  IconBolt,
  IconChart,
  IconLive,
  IconPlus,
  IconStar,
  IconTrophy,
  IconUsers,
  type IconProps
} from '../../components/icons'

const STATS = [
  { value: '1,240', label: 'Students', tone: 'brand' as const },
  { value: '12.4k', label: 'Followers', tone: 'violet' as const },
  { value: '3.2k h', label: 'Watch time', tone: 'emerald' as const },
  { value: '4.8', label: 'Avg rating', tone: 'amber' as const }
]

const ACTIONS: { label: string; Icon: (p: IconProps) => JSX.Element; to: string; tone: string }[] = [
  { label: 'New course', Icon: IconPlus, to: '/teacher/new', tone: 'bg-grad-brand text-white' },
  { label: 'Go live', Icon: IconLive, to: '/teacher/live', tone: 'bg-rose-500/15 text-rose-300 border border-rose-400/30' },
  { label: 'Analytics', Icon: IconChart, to: '/teacher/analytics', tone: 'bg-white/[0.06] text-slate-200 border border-white/10' },
  { label: 'Earnings', Icon: IconTrophy, to: '/teacher/monetization', tone: 'bg-white/[0.06] text-slate-200 border border-white/10' }
]

const SECONDARY_NAV: { label: string; to: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { label: 'Students', to: '/teacher/students', Icon: IconUsers },
  { label: 'Analytics', to: '/teacher/analytics', Icon: IconChart },
  { label: 'Earnings', to: '/teacher/monetization', Icon: IconTrophy },
  { label: 'Live & clips', to: '/teacher/live', Icon: IconLive }
]

const COURSES = [
  { title: 'Everyday Conversation', students: 420, rating: '4.8', cover: 'from-sky-500 to-blue-700' },
  { title: 'IELTS Speaking Bootcamp', students: 312, rating: '4.9', cover: 'from-rose-500 to-pink-700' },
  { title: 'Grammar Foundations', students: 508, rating: '4.7', cover: 'from-emerald-500 to-teal-700' }
]

const ACTIVITY = [
  { who: 'Dilnoza', what: 'enrolled in Everyday Conversation', when: '5m' },
  { who: 'Bekzod', what: 'left a 5★ review on IELTS Bootcamp', when: '1h' },
  { who: 'Madina', what: 'completed Unit 3', when: '2h' },
  { who: 'Sardor', what: 'started following you', when: '3h' }
]

export default function TeacherDashboardPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <AvatarCircle name="Emma Carter" size="md" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, Emma</h1>
            <p className="text-sm text-slate-400">Here's how your channel is doing today.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Courses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Your courses</h2>
              <button onClick={() => navigate('/teacher/new')} className="text-xs font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1">
                <IconPlus className="w-3.5 h-3.5" /> New
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {COURSES.map((c) => (
                <div key={c.title} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                  <div className={cn('w-14 h-10 rounded-lg bg-gradient-to-br shrink-0', c.cover)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><IconUsers className="w-3 h-3" /> {c.students}</span>
                      <span className="inline-flex items-center gap-1 text-amber-300"><IconStar className="w-3 h-3" /> {c.rating}</span>
                    </p>
                  </div>
                  <button onClick={() => navigate('/course')} className="text-xs font-semibold text-brand-300 shrink-0">Manage →</button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <aside className="lg:border-l lg:border-white/10 lg:pl-6">
            <h2 className="text-base font-bold mb-3">Recent activity</h2>
            <div className="flex flex-col gap-3">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <AvatarCircle name={a.who} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 leading-snug"><b className="text-white">{a.who}</b> {a.what}</p>
                    <p className="text-xs text-slate-500">{a.when} ago</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/channel')} className="mt-4 w-full btn-ghost py-2 text-sm inline-flex items-center justify-center gap-1">
              Manage channel <IconArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
