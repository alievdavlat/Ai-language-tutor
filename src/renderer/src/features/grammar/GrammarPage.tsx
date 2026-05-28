import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading, StatCard } from '../../components/ui'
import {
  IconBolt,
  IconBook,
  IconChat,
  IconCheck,
  IconLock,
  IconStar,
  IconTrophy,
  type IconProps
} from '../../components/icons'

const STATS = [
  { value: 18, label: 'Skills learned', tone: 'emerald' as const, icon: <IconCheck /> },
  { value: 4, label: 'In progress', tone: 'amber' as const, icon: <IconBolt /> },
  { value: 'Silver', label: 'Crown tier', tone: 'violet' as const, icon: <IconTrophy /> }
]

interface Lesson {
  title: string
  kind: 'rule' | 'practice' | 'quiz'
  duration: string
  done?: boolean
  locked?: boolean
}

interface Unit {
  number: number
  title: string
  about: string
  level: string
  total: number
  done: number
  lessons: Lesson[]
}

const KIND_ICON: Record<Lesson['kind'], (p: IconProps) => JSX.Element> = {
  rule: IconBook,
  practice: IconChat,
  quiz: IconStar
}

const KIND_TINT: Record<Lesson['kind'], string> = {
  rule: 'bg-brand-500/15 text-brand-300',
  practice: 'bg-emerald-500/15 text-emerald-300',
  quiz: 'bg-amber-500/15 text-amber-300'
}

const ACTIVE_UNIT: Unit = {
  number: 4,
  title: 'Past tenses',
  about: 'When and how to use past simple, past continuous, past perfect — with real-life examples and side-by-side comparisons.',
  level: 'B1',
  total: 8,
  done: 3,
  lessons: [
    { title: 'Past simple — regular & irregular', kind: 'rule', duration: '4 min', done: true },
    { title: 'Past continuous vs past simple', kind: 'rule', duration: '6 min', done: true },
    { title: 'Practice: When I was 10…', kind: 'practice', duration: '5 min', done: true },
    { title: 'Past perfect — what is it really?', kind: 'rule', duration: '7 min' },
    { title: 'Practice: storytelling drills', kind: 'practice', duration: '8 min' },
    { title: 'Used to & would for past habits', kind: 'rule', duration: '5 min', locked: true },
    { title: 'Practice: childhood stories', kind: 'practice', duration: '6 min', locked: true },
    { title: 'Unit quiz', kind: 'quiz', duration: '10 min', locked: true }
  ]
}

const OTHER_UNITS = [
  { n: 1, title: 'Articles · a / an / the', level: 'A1', progress: 100 },
  { n: 2, title: 'Present tenses', level: 'A2', progress: 100 },
  { n: 3, title: 'Question formation', level: 'A2', progress: 100 },
  { n: 5, title: 'Conditionals 0–3', level: 'B1', progress: 0 },
  { n: 6, title: 'Modal verbs', level: 'B1', progress: 0 },
  { n: 7, title: 'Passive voice', level: 'B2', progress: 0 },
  { n: 8, title: 'Reported speech', level: 'B2', progress: 0 }
]

export default function GrammarPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Skill tree"
          title="Grammar"
          subtitle="Aziz's Learning Path · 8 units · CEFR A1 → B2"
          back="/courses"
          crumbs={[{ label: 'Courses', to: '/courses' }, { label: 'Grammar' }]}
          action={<button onClick={() => navigate('/courses')} className="btn-ghost text-xs px-3 py-2">All courses</button>}
        />

        <div className="grid grid-cols-3 gap-3">
          {STATS.map((s) => <StatCard key={s.label} value={s.value} label={s.label} tone={s.tone} icon={s.icon} />)}
        </div>

        {/* Current unit hero — Elsa Learn style */}
        <div className="rounded-card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-brand-500/10 p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">UNIT {ACTIVE_UNIT.number}</span>
            <span className="inline-flex items-center rounded-full bg-white/[0.06] text-slate-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">{ACTIVE_UNIT.level}</span>
            <span className="text-[11px] text-slate-400 ml-auto">{ACTIVE_UNIT.done}/{ACTIVE_UNIT.total} done</span>
          </div>
          <h2 className="text-xl font-black text-white mt-3">{ACTIVE_UNIT.title}</h2>
          <p className="text-sm text-slate-300 mt-1">{ACTIVE_UNIT.about}</p>
          <ProgressBar value={(ACTIVE_UNIT.done / ACTIVE_UNIT.total) * 100} color="green" className="mt-3" />
        </div>

        {/* Lessons list */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
          {ACTIVE_UNIT.lessons.map((l, i) => {
            const Icon = KIND_ICON[l.kind]
            return (
              <button
                key={i}
                disabled={l.locked}
                onClick={() => navigate('/learn/exercise')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition',
                  l.locked ? 'opacity-50 cursor-not-allowed' : l.done ? 'hover:bg-emerald-500/[0.05]' : 'hover:bg-white/[0.04]'
                )}
              >
                <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', l.locked ? 'bg-white/[0.05] text-slate-500' : l.done ? 'bg-emerald-500/20 text-emerald-300' : KIND_TINT[l.kind])}>
                  {l.locked ? <IconLock className="w-4 h-4" /> : l.done ? <IconCheck className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Lesson {i + 1} — {l.title}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{l.kind} · {l.duration}</p>
                </div>
                {l.done && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Done</span>}
                {!l.done && !l.locked && <span className="text-slate-400 text-xs">→</span>}
              </button>
            )
          })}
        </div>

        {/* All units */}
        <div>
          <SectionHeading title="All units" subtitle="Tap a unit to open it" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OTHER_UNITS.map((u) => (
              <button key={u.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Unit {u.n} · {u.level}</span>
                  <span className="text-[11px] font-bold text-brand-200">{u.progress}%</span>
                </div>
                <p className="text-sm font-bold text-white mt-1">{u.title}</p>
                <ProgressBar value={u.progress} color={u.progress === 100 ? 'green' : 'brand'} className="mt-2" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA — Elsa Learn pattern */}
      <div className="fixed bottom-0 left-56 right-0 bg-slate-950/90 backdrop-blur border-t border-white/[0.06] px-6 py-3">
        <button
          onClick={() => navigate('/learn/exercise')}
          className="btn-primary w-full max-w-xs mx-auto block py-3 text-base font-bold"
        >
          Continue lesson 4 →
        </button>
      </div>
    </div>
  )
}
