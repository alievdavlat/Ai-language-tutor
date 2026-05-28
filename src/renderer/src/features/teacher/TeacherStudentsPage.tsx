import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, ProgressBar, Tabs, type TabItem } from '../../components/ui'
import { IconChat, IconSearch, IconStar } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'

type Tab = 'all' | 'active' | 'lagging' | 'finished'
const TABS: TabItem<Tab>[] = [
  { id: 'all', label: 'All · 142' },
  { id: 'active', label: 'Active · 96' },
  { id: 'lagging', label: 'Falling behind · 24' },
  { id: 'finished', label: 'Finished · 22' }
]

interface Student {
  name: string
  course: string
  progress: number
  lastActive: string
  state: 'active' | 'lagging' | 'finished'
  rating?: number
}

const STUDENTS: Student[] = [
  { name: 'Aziz K.', course: 'IELTS Speaking Bootcamp', progress: 64, lastActive: 'Today', state: 'active' },
  { name: 'Priya S.', course: 'Past Tenses Deep Dive', progress: 88, lastActive: 'Today', state: 'active', rating: 5 },
  { name: 'Wei Lin', course: 'IELTS Speaking Bootcamp', progress: 100, lastActive: '2d ago', state: 'finished', rating: 5 },
  { name: 'Emma W.', course: 'Business English 101', progress: 12, lastActive: '12d ago', state: 'lagging' },
  { name: 'Marco B.', course: 'IELTS Speaking Bootcamp', progress: 41, lastActive: 'Yesterday', state: 'active' },
  { name: 'Yui T.', course: 'Past Tenses Deep Dive', progress: 100, lastActive: '5d ago', state: 'finished', rating: 4 },
  { name: 'Liam O.', course: 'Business English 101', progress: 9, lastActive: '18d ago', state: 'lagging' },
  { name: 'Nadia R.', course: 'IELTS Speaking Bootcamp', progress: 54, lastActive: 'Today', state: 'active' }
]

const STATE_CHIP: Record<Student['state'], { label: string; tint: string }> = {
  active: { label: 'Active', tint: 'bg-emerald-500/15 text-emerald-300' },
  lagging: { label: 'Behind', tint: 'bg-amber-500/15 text-amber-300' },
  finished: { label: 'Finished', tint: 'bg-violet-500/15 text-violet-300' }
}

function progressState(p: number, lastActiveAt: string): Student['state'] {
  if (p >= 100) return 'finished'
  const daysSince = (Date.now() - new Date(lastActiveAt).getTime()) / 86_400_000
  if (daysSince > 7) return 'lagging'
  return 'active'
}

function relDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function TeacherStudentsPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('all')
  const me = backend.currentUserId()
  const rows = useBackendQuery(
    () => me ? backend.studentsOf(me) : Promise.resolve([]),
    [me],
    []
  )
  const seeded = rows.data.length > 0
  const liveStudents: Student[] = seeded
    ? rows.data.map((r) => ({
        name: r.user.name,
        course: r.course.title,
        progress: r.enrollment.progress,
        lastActive: relDays(r.enrollment.lastActiveAt),
        state: progressState(r.enrollment.progress, r.enrollment.lastActiveAt)
      }))
    : STUDENTS
  const list = tab === 'all'
    ? liveStudents
    : liveStudents.filter((s) => s.state === (tab === 'lagging' ? 'lagging' : tab === 'finished' ? 'finished' : 'active'))

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Teacher · Students"
          title="Your students"
          subtitle="142 enrolled · 96 active this week"
          back="/teacher"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'Students' }]}
          action={<button className="btn-primary text-xs px-4 py-2">Invite student</button>}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search students by name or course" className="input pl-9 text-sm" />
          </div>
          <select className="input text-sm sm:w-48">
            <option>All courses</option>
            <option>IELTS Speaking Bootcamp</option>
            <option>Past Tenses Deep Dive</option>
            <option>Business English 101</option>
          </select>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        <div className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_1.2fr_1fr_0.6fr_0.6fr_auto] gap-3 px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Student</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Course</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Progress</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Last active</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Status</span>
            <span />
          </div>
          {list.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_1.2fr_1fr_0.6fr_0.6fr_auto] gap-3 px-4 py-3 border-b border-white/[0.05] last:border-0 items-center hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2.5">
                <AvatarCircle name={s.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                  {s.rating && (
                    <p className="text-[10px] text-amber-300 flex items-center gap-0.5">
                      {Array.from({ length: s.rating }).map((_, j) => <IconStar key={j} className="w-2.5 h-2.5" />)}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-300 truncate hidden sm:block">{s.course}</p>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={s.progress} color="brand" /></div>
                <span className="text-[11px] font-semibold text-slate-400">{s.progress}%</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">{s.lastActive}</p>
              <span className={cn('hidden sm:inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', STATE_CHIP[s.state].tint)}>
                {STATE_CHIP[s.state].label}
              </span>
              <button className="text-slate-500 hover:text-brand-300 transition" title="Message"><IconChat className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
