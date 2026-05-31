import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import {
  ProgressBar,
  ProgressRing,
  SectionHeading,
  StatCard,
  Tabs,
  type TabItem,
  WeekStudyTracker,
  type StudyDay
} from '../../components/ui'
import { RetentionContent } from '../retention/RetentionPage'
import { cn } from '../../lib/classnames'
import { iconByName } from '../../lib/iconByName'
import {
  crownTier,
  knowledgePct,
  useAchievements,
  useStats,
  weekDays,
  type SkillKey
} from '../../services/progress'
import { useProgressStore } from '../../services/progress'
import { CEFR_ORDER } from '../leveltest/questions'
import { IconBolt, IconFlame, IconHeart, IconStar, IconTarget, IconTrophy, IconUsers } from '../../components/icons'

const SKILL_META: { key: SkillKey; label: string; color: 'brand' | 'green' | 'amber' }[] = [
  { key: 'speaking', label: 'Speaking', color: 'brand' },
  { key: 'listening', label: 'Listening', color: 'brand' },
  { key: 'grammar', label: 'Grammar', color: 'green' },
  { key: 'vocabulary', label: 'Vocabulary', color: 'amber' }
]

// Khan-style mastery crowns: 0=none, 1=bronze, 2=silver, 3=gold, 4=diamond
const CROWN_TIERS: { tint: string; label: string }[] = [
  { tint: 'bg-white/[0.05] text-slate-500', label: 'Locked' },
  { tint: 'bg-amber-700/30 text-amber-300', label: 'Bronze' },
  { tint: 'bg-slate-300/20 text-slate-200', label: 'Silver' },
  { tint: 'bg-amber-400/25 text-amber-200', label: 'Gold' },
  { tint: 'bg-cyan-300/25 text-cyan-200', label: 'Diamond' }
]

// The six headline badges shown on the progress hub (full set lives on /achievements).
const HEADLINE_BADGES = ['first_chat', 'on_fire', 'hundred_words', 'sharp_tongue', 'xp_1000', 'league_gold']

/** Estimate the next CEFR level above the user's current level. */
function nextLevel(level: string): string {
  const order = CEFR_ORDER as readonly string[]
  const i = order.indexOf(level)
  if (i < 0 || i >= order.length - 1) return 'C2'
  return order[i + 1]
}

type ProgressTab = 'overview' | 'goals'
const PROGRESS_TABS: TabItem<ProgressTab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'goals', label: 'Goals & Streak' }
]

export default function ProgressPage(): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ProgressTab>('overview')
  const profile = useAppStore((s) => s.profile)
  const stats = useStats()
  const achievements = useAchievements()
  const events = useProgressStore((s) => s.events)
  const frozenDates = useProgressStore((s) => s.frozenDates)

  const level = profile?.level ?? 'A1'
  const knowledge = knowledgePct(stats)
  const week: StudyDay[] = weekDays(events, frozenDates, new Date())

  const certificates = Number(
    new Set(events.filter((e) => e.kind === 'level_test').map((e) => (e.meta?.level as string) ?? '')).size
  )

  const STATS = [
    { value: stats.corrections, label: 'Corrections', tone: 'rose' as const, icon: <IconStar /> },
    { value: stats.wordsLearned, label: 'Words learned', tone: 'emerald' as const, icon: <IconHeart /> },
    { value: stats.streak, label: 'Day streak', tone: 'amber' as const, icon: <IconFlame /> },
    { value: certificates, label: 'Certificates', tone: 'violet' as const, icon: <IconTrophy /> }
  ]

  const headline = HEADLINE_BADGES.map((id) => achievements.find((a) => a.id === id)).filter(
    (b): b is NonNullable<typeof b> => !!b
  )
  const unlockedCount = headline.filter((b) => b.unlocked).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your progress</h1>
          <p className="text-sm text-slate-400 mt-1">
            How your {profile?.targetLanguage === 'en' ? 'English' : 'language'} is growing across every skill.
          </p>
        </div>

        <Tabs items={PROGRESS_TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'goals' && <RetentionContent />}

        {tab === 'overview' && (<>
        {/* Hero — language knowledge ring */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing value={knowledge} size={150} stroke={12} tone="brand">
            <span className="text-3xl font-bold text-white">{knowledge}%</span>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">knowledge</span>
          </ProgressRing>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">
              Level {level}
            </p>
            <h2 className="text-xl font-bold text-white mt-1">
              {knowledge >= 100 ? `You've mastered ${level}` : `You're on your way to ${nextLevel(level)}`}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              {stats.totalXp.toLocaleString()} XP earned · keep practicing speaking daily — it's your fastest path
              to the next level.
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

        {/* Compete & connect — leaderboard, quests, study buddy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/leaderboard', label: 'Leaderboard', sub: 'Weekly XP league', Icon: IconTrophy, tint: 'bg-amber-500/15 text-amber-300' },
            { to: '/quests', label: 'Quests', sub: 'Daily & weekly goals', Icon: IconBolt, tint: 'bg-brand-500/15 text-brand-300' },
            { to: '/buddy', label: 'Study buddy', sub: 'Practice with a partner', Icon: IconUsers, tint: 'bg-emerald-500/15 text-emerald-300' }
          ].map((q) => (
            <button
              key={q.to}
              onClick={() => navigate(q.to)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex items-center gap-3"
            >
              <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', q.tint)}>
                <q.Icon className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{q.label}</span>
                <span className="block text-[11px] text-slate-400 leading-tight">{q.sub}</span>
              </span>
            </button>
          ))}
        </div>

        {/* This week */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">This week</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 rounded-full px-2.5 py-1">
              <IconFlame className="w-3.5 h-3.5" /> {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <WeekStudyTracker days={week} />
        </div>

        {/* Skills breakdown — with mastery crowns */}
        <div>
          <SectionHeading title="Skills · mastery" subtitle="Crown tier rises as you score 90%+ over time" />
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
            {SKILL_META.map((s) => {
              const value = stats.skills[s.key]
              const crown = crownTier(value)
              const tier = CROWN_TIERS[crown]
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-200 inline-flex items-center gap-2">
                      {s.label}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                          tier.tint
                        )}
                        title={`Mastery crown: ${tier.label}`}
                      >
                        ♛ {tier.label}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-slate-400 inline-flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <span key={i} className={cn('text-[10px]', i < crown ? 'text-amber-300' : 'text-slate-700')}>
                            ♛
                          </span>
                        ))}
                      </span>
                      {value}%
                    </span>
                  </div>
                  <ProgressBar value={value} color={s.color} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <SectionHeading
            title="Achievements"
            subtitle={`${unlockedCount} of ${headline.length} unlocked`}
            action={
              <button onClick={() => navigate('/achievements')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">
                See all →
              </button>
            }
          />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {headline.map((b) => {
              const Icon = iconByName(b.icon)
              return (
                <div
                  key={b.id}
                  className={cn(
                    'rounded-2xl border p-3 flex flex-col items-center gap-2 text-center',
                    b.unlocked ? 'border-white/10 bg-white/[0.03]' : 'border-white/[0.05] bg-white/[0.015] opacity-50'
                  )}
                  title={b.desc}
                >
                  <span className={cn('w-11 h-11 rounded-full flex items-center justify-center', b.tint)}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-medium text-slate-300 leading-tight">{b.name}</span>
                </div>
              )
            })}
          </div>
        </div>
        </>)}
      </div>
    </div>
  )
}
