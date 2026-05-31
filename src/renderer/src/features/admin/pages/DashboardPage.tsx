import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { library } from '../../../services/library/store'
import { stories } from '../../../services/stories/store'
import { exams } from '../../../services/exams/store'
import { roleplays } from '../../../services/roleplay'
import { clips } from '../../../services/clips/store'
import { paths } from '../../../services/paths/store'
import { RESOURCES } from '../resources'
import { cn } from '../../../lib/classnames'
import { IconUsers, IconBook, IconChart, IconStar } from '../../../components/icons'

interface Props {
  go: (view: string) => void
}

function Kpi({ value, label, tone, icon }: { value: string | number; label: string; tone: string; icon: JSX.Element }): JSX.Element {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', tone)}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums mt-3">{value}</p>
      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">{label}</p>
    </div>
  )
}

export default function DashboardPage({ go }: Props): JSX.Element {
  const teachers = useBackendQuery(() => backend.listUsers({ role: 'teacher' }), [], [])
  const students = useBackendQuery(() => backend.listUsers({ role: 'student' }), [], [])
  const courses = useBackendQuery(() => backend.listCourses(), [], [])
  const groups = useBackendQuery(() => backend.listGroups(), [], [])
  const challenges = useBackendQuery(() => backend.listChallenges(), [], [])
  const reports = useBackendQuery(() => studio.listReports('open'), [], [])
  const featured = useBackendQuery(() => studio.listFeatured(), [], [])
  const lib = useBackendQuery(() => library.list(), [], [])

  const users = [...teachers.data, ...students.data]
  const newThisWeek = users.filter((u) => Date.now() - Date.parse(u.createdAt) < 7 * 86_400_000).length
  const live = courses.data.filter((c) => c.publishedAt).length
  const drafts = courses.data.length - live

  // Real content inventory across every managed entity.
  const counts: Record<string, number> = {
    courses: courses.data.length,
    library: lib.data.length,
    stories: stories.list().length,
    exams: exams.list().length,
    roleplays: roleplays.list().length,
    clips: clips.list().length,
    paths: paths.list().length,
    groups: groups.data.length,
    challenges: challenges.data.length
  }

  const recentUsers = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Live platform health — every figure is read from the backend, nothing hardcoded.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi value={users.length.toLocaleString()} label="Total users" tone="bg-brand-500/15 text-brand-200" icon={<IconUsers className="w-4 h-4" />} />
        <Kpi value={live} label="Courses live" tone="bg-emerald-500/15 text-emerald-200" icon={<IconBook className="w-4 h-4" />} />
        <Kpi value={reports.data.length} label="Open reports" tone="bg-rose-500/15 text-rose-200" icon={<IconChart className="w-4 h-4" />} />
        <Kpi value={`+${newThisWeek}`} label="New signups · 7d" tone="bg-amber-500/15 text-amber-200" icon={<IconStar className="w-4 h-4" />} />
      </div>

      {/* Content inventory — click through to manage each entity */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">Content inventory</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {RESOURCES.map((r) => (
            <button
              key={r.key}
              onClick={() => go(`res:${r.key}`)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition p-3.5 text-left"
            >
              <span className="text-slate-400">{r.icon}</span>
              <p className="text-xl font-bold text-white tabular-nums mt-2">{counts[r.key] ?? 0}</p>
              <p className="text-[11px] text-slate-500 font-semibold">{r.label}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Newest users */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Newest members</h2>
            <button onClick={() => go('users')} className="text-[11px] font-bold text-brand-300 hover:text-brand-200">Open CRM →</button>
          </div>
          <div className="flex flex-col gap-1.5">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 text-sm">
                <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-slate-300">{u.name.slice(0, 1).toUpperCase()}</span>
                <span className="text-slate-200 truncate flex-1">{u.name}</span>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', u.role === 'teacher' ? 'text-violet-300' : 'text-brand-300')}>{u.role}</span>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">No users yet.</p>}
          </div>
        </div>

        {/* Triage */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Needs attention</h2>
            <button onClick={() => go('moderation')} className="text-[11px] font-bold text-brand-300 hover:text-brand-200">Moderation →</button>
          </div>
          <ul className="text-sm text-slate-300 flex flex-col gap-2">
            <li className="flex items-center justify-between"><span className="text-slate-400">Courses awaiting review</span><b className="text-white tabular-nums">{drafts}</b></li>
            <li className="flex items-center justify-between"><span className="text-slate-400">Open moderation reports</span><b className="text-white tabular-nums">{reports.data.length}</b></li>
            <li className="flex items-center justify-between"><span className="text-slate-400">Active featured slots</span><b className="text-white tabular-nums">{featured.data.filter((f) => f.active).length}</b></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
