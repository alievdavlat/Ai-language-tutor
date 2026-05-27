import {
  ProgressBar,
  ProgressRing,
  SectionHeading,
  StatCard,
  WeekStudyTracker,
  type StudyDay
} from '../../components/ui'
import { IconFlame, IconHeart, IconStar, IconTrophy } from '../../components/icons'

const WEEK: StudyDay[] = [
  { label: 'Mo', state: 'done' },
  { label: 'Tu', state: 'done' },
  { label: 'We', state: 'today' },
  { label: 'Th', state: 'future' },
  { label: 'Fr', state: 'future' },
  { label: 'Sa', state: 'future' },
  { label: 'Su', state: 'future' }
]

const SKILLS = [
  { label: 'Speaking', value: 64, color: 'brand' as const },
  { label: 'Listening', value: 48, color: 'brand' as const },
  { label: 'Grammar', value: 71, color: 'green' as const },
  { label: 'Vocabulary', value: 55, color: 'amber' as const }
]

const STATS = [
  { value: 128, label: 'Corrections', tone: 'rose' as const, icon: <IconStar /> },
  { value: 342, label: 'Words learned', tone: 'emerald' as const, icon: <IconHeart /> },
  { value: 7, label: 'Day streak', tone: 'amber' as const, icon: <IconFlame /> },
  { value: 2, label: 'Certificates', tone: 'violet' as const, icon: <IconTrophy /> }
]

export default function ProgressPage(): JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your progress</h1>
          <p className="text-sm text-slate-400 mt-1">
            How your English is growing across every skill.
          </p>
        </div>

        {/* Hero — language knowledge ring */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing value={50} size={150} stroke={12} tone="brand">
            <span className="text-3xl font-bold text-white">50%</span>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
              knowledge
            </span>
          </ProgressRing>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">
              Level B1 · Intermediate
            </p>
            <h2 className="text-xl font-bold text-white mt-1">You're halfway to B2</h2>
            <p className="text-sm text-slate-400 mt-1.5">
              Keep practicing speaking daily — it's your fastest path to the next level.
            </p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} tone={s.tone} icon={s.icon} />
          ))}
        </div>

        {/* This week */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">This week</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 rounded-full px-2.5 py-1">
              <IconFlame className="w-3.5 h-3.5" /> 7 days
            </span>
          </div>
          <WeekStudyTracker days={WEEK} />
        </div>

        {/* Skills breakdown */}
        <div>
          <SectionHeading title="Skills" subtitle="Estimated from your recent sessions" />
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
            {SKILLS.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-200">{s.label}</span>
                  <span className="text-xs font-semibold text-slate-400">{s.value}%</span>
                </div>
                <ProgressBar value={s.value} color={s.color} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
