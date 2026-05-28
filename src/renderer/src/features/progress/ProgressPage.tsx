import { useNavigate } from 'react-router-dom'
import {
  ProgressBar,
  ProgressRing,
  SectionHeading,
  StatCard,
  WeekStudyTracker,
  type StudyDay
} from '../../components/ui'
import { cn } from '../../lib/classnames'
import {
  IconBolt,
  IconChat,
  IconFlame,
  IconHeart,
  IconStar,
  IconTarget,
  IconTrophy,
  type IconProps
} from '../../components/icons'

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
  { label: 'Speaking', value: 64, color: 'brand' as const, crown: 2 },
  { label: 'Listening', value: 48, color: 'brand' as const, crown: 1 },
  { label: 'Grammar', value: 71, color: 'green' as const, crown: 3 },
  { label: 'Vocabulary', value: 55, color: 'amber' as const, crown: 2 }
]

// Khan-style mastery crowns: 0=none, 1=bronze, 2=silver, 3=gold, 4=diamond
const CROWN_TIERS: { tint: string; label: string }[] = [
  { tint: 'bg-white/[0.05] text-slate-500', label: 'Locked' },
  { tint: 'bg-amber-700/30 text-amber-300', label: 'Bronze' },
  { tint: 'bg-slate-300/20 text-slate-200', label: 'Silver' },
  { tint: 'bg-amber-400/25 text-amber-200', label: 'Gold' },
  { tint: 'bg-cyan-300/25 text-cyan-200', label: 'Diamond' }
]

const STATS = [
  { value: 128, label: 'Corrections', tone: 'rose' as const, icon: <IconStar /> },
  { value: 342, label: 'Words learned', tone: 'emerald' as const, icon: <IconHeart /> },
  { value: 7, label: 'Day streak', tone: 'amber' as const, icon: <IconFlame /> },
  { value: 2, label: 'Certificates', tone: 'violet' as const, icon: <IconTrophy /> }
]

interface Badge {
  name: string
  Icon: (p: IconProps) => JSX.Element
  unlocked: boolean
  tint: string
}

const BADGES: Badge[] = [
  { name: 'First chat', Icon: IconChat, unlocked: true, tint: 'bg-brand-500/15 text-brand-300' },
  { name: '7-day streak', Icon: IconFlame, unlocked: true, tint: 'bg-amber-500/15 text-amber-300' },
  { name: '100 words', Icon: IconStar, unlocked: true, tint: 'bg-emerald-500/15 text-emerald-300' },
  { name: 'Sharp tongue', Icon: IconTarget, unlocked: false, tint: 'bg-rose-500/15 text-rose-300' },
  { name: '1000 XP', Icon: IconBolt, unlocked: false, tint: 'bg-violet-500/15 text-violet-300' },
  { name: 'Grammar master', Icon: IconTrophy, unlocked: false, tint: 'bg-sky-500/15 text-sky-300' }
]

export default function ProgressPage(): JSX.Element {
  const navigate = useNavigate()
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
            <button
              onClick={() => navigate('/level-test')}
              className="inline-flex items-center gap-2 mt-3 rounded-pill bg-white/[0.06] hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition"
            >
              <IconTarget className="w-4 h-4 text-brand-300" /> Take the level test
            </button>
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

        {/* Skills breakdown — with mastery crowns */}
        <div>
          <SectionHeading title="Skills · mastery" subtitle="Crown tier rises as you score 90%+ over time" />
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
            {SKILLS.map((s) => {
              const tier = CROWN_TIERS[s.crown]
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-200 inline-flex items-center gap-2">
                      {s.label}
                      <span className={cn('inline-flex items-center gap-1 rounded-full text-[10px] font-bold uppercase tracking-wider px-2 py-0.5', tier.tint)} title={`Mastery crown: ${tier.label}`}>
                        <IconTrophy className="w-3 h-3" /> {tier.label}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-slate-400 inline-flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5">{Array.from({ length: 4 }).map((_, i) => (
                        <span key={i} className={cn('text-[10px]', i < s.crown ? 'text-amber-300' : 'text-slate-700')}>♛</span>
                      ))}</span>
                      {s.value}%
                    </span>
                  </div>
                  <ProgressBar value={s.value} color={s.color} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <SectionHeading title="Achievements" subtitle="3 of 6 unlocked" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGES.map((b) => (
              <div
                key={b.name}
                className={cn(
                  'rounded-2xl border p-3 flex flex-col items-center gap-2 text-center',
                  b.unlocked
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-white/[0.05] bg-white/[0.015] opacity-50'
                )}
              >
                <span className={cn('w-11 h-11 rounded-full flex items-center justify-center', b.tint)}>
                  <b.Icon className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-slate-300 leading-tight">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
