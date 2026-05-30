import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, ProgressRing } from '../../components/ui'
import { IconBolt, IconCheck, IconFlame } from '../../components/icons'
import {
  DAILY_GOALS,
  goalDef,
  useMilestones,
  useStats,
  useProgressStore
} from '../../services/progress'

/** The Goals & Streak body — reused as a tab inside the Progress page. */
export function RetentionContent(): JSX.Element {
  const stats = useStats()
  const milestones = useMilestones()

  const dailyGoalId = useProgressStore((s) => s.dailyGoalId)
  const setDailyGoal = useProgressStore((s) => s.setDailyGoal)
  const reminders = useProgressStore((s) => s.reminders)
  const setReminders = useProgressStore((s) => s.setReminders)
  const digests = useProgressStore((s) => s.digests)
  const setDigests = useProgressStore((s) => s.setDigests)
  const streakFreezes = useProgressStore((s) => s.streakFreezes)
  const freezeArmed = useProgressStore((s) => s.freezeArmed)
  const armFreeze = useProgressStore((s) => s.armFreeze)
  const repairStreak = useProgressStore((s) => s.repairStreak)

  const goal = goalDef(dailyGoalId)
  const goalPct = Math.min(100, Math.round((stats.todayXp / goal.xp) * 100))
  // A streak is "broken" when nothing happened today and the run is 0 but the
  // learner has history worth saving.
  const repairable = stats.streak === 0 && stats.longestStreak > 0 && !stats.activeToday

  return (
      <div className="w-full flex flex-col gap-6">
        {/* Today vs goal */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing value={goalPct} size={132} stroke={11} tone="brand">
            <span className="text-2xl font-bold text-white">{stats.todayXp}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">/ {goal.xp} XP</span>
          </ProgressRing>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">Today's goal · {goal.label}</p>
            <h2 className="text-xl font-bold text-white mt-1">
              {stats.goalMetToday ? '✓ Goal reached — nice work!' : `${Math.max(0, goal.xp - stats.todayXp)} XP to go`}
            </h2>
            <p className="text-sm text-slate-400 mt-1">{goal.blurb}</p>
          </div>
        </div>

        {/* Daily goal picker */}
        <div>
          <p className="section-title px-1 mb-2">Daily goal</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DAILY_GOALS.map((g) => {
              const active = g.id === dailyGoalId
              return (
                <button
                  key={g.id}
                  onClick={() => setDailyGoal(g.id)}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition',
                    active
                      ? 'border-brand-400/50 bg-brand-500/10 ring-1 ring-brand-400/30'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{g.label}</span>
                    {active && <IconCheck className="w-4 h-4 text-brand-300" />}
                  </div>
                  <p className="text-[11px] text-amber-200 font-semibold mt-1 inline-flex items-center gap-1">
                    <IconBolt className="w-3 h-3" /> {g.xp} XP · {g.minutes} min
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{g.blurb}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Streak society */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-white inline-flex items-center gap-2">
                <IconFlame className="w-4 h-4 text-amber-300" /> {stats.streak}-day streak
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Longest: {stats.longestStreak} days · {streakFreezes} freeze{streakFreezes === 1 ? '' : 's'} available
              </p>
            </div>
            {repairable && (
              <button
                onClick={() => repairStreak()}
                disabled={streakFreezes < 1}
                className={cn(
                  'rounded-pill text-xs font-bold px-3.5 py-1.5 transition',
                  streakFreezes >= 1
                    ? 'bg-amber-500/90 hover:bg-amber-400 text-black'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                )}
              >
                {streakFreezes >= 1 ? 'Repair streak (1 freeze)' : 'No freezes left'}
              </button>
            )}
          </div>

          {/* Freeze toggle */}
          <label className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 cursor-pointer">
            <span className="text-sm text-slate-200">
              <span className="font-semibold">Streak freeze</span>
              <span className="block text-[11px] text-slate-400">Auto-protect your streak if you miss a single day.</span>
            </span>
            <input
              type="checkbox"
              checked={freezeArmed}
              onChange={(e) => armFreeze(e.target.checked)}
              className="w-5 h-5 accent-brand-500"
            />
          </label>

          {/* Milestones */}
          <p className="section-title px-1 mt-5 mb-2">Streak society</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {milestones.map((m) => (
              <div
                key={m.days}
                className={cn(
                  'rounded-2xl border p-3 flex items-center gap-3 transition',
                  m.reached
                    ? 'border-amber-400/30 bg-amber-500/[0.08]'
                    : m.current
                      ? 'border-brand-400/30 bg-brand-500/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.02] opacity-70'
                )}
              >
                <span className="text-2xl">{m.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{m.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {m.days} days · +{m.reward} XP
                    {m.reached && <span className="text-emerald-300 font-semibold"> · reached</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-bold text-white mb-3">Practice reminder</p>
          <label className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm text-slate-200">Remind me to practice daily</span>
            <input
              type="checkbox"
              checked={reminders.enabled}
              onChange={(e) => setReminders({ enabled: e.target.checked })}
              className="w-5 h-5 accent-brand-500"
            />
          </label>
          <div className={cn('flex items-center gap-3 transition', !reminders.enabled && 'opacity-40 pointer-events-none')}>
            <span className="text-sm text-slate-400">Time</span>
            <select
              value={reminders.hour}
              onChange={(e) => setReminders({ hour: Number(e.target.value) })}
              className="rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white px-3 py-1.5"
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={h} className="bg-canvas">
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Digests */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-bold text-white mb-1">Digests & notifications</p>
          <p className="text-[11px] text-slate-400 mb-3">
            We'll nudge you when your streak is at risk and send a recap of your progress.
          </p>
          {[
            { key: 'push' as const, label: 'Push notifications', desc: 'Streak-at-risk & "AI misses you" nudges' },
            { key: 'dailyEmail' as const, label: 'Daily email', desc: 'A short summary of yesterday' },
            { key: 'weeklyEmail' as const, label: 'Weekly digest', desc: 'Your week in numbers, every Sunday' }
          ].map((row) => (
            <label key={row.key} className="flex items-center justify-between gap-3 py-2.5 border-t border-white/[0.05] first:border-t-0">
              <span className="text-sm text-slate-200">
                <span className="font-medium">{row.label}</span>
                <span className="block text-[11px] text-slate-400">{row.desc}</span>
              </span>
              <input
                type="checkbox"
                checked={digests[row.key]}
                onChange={(e) => setDigests({ [row.key]: e.target.checked })}
                className="w-5 h-5 accent-brand-500"
              />
            </label>
          ))}
        </div>

        {/* This week recap */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-bold text-white mb-3">This week</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{stats.weekXp.toLocaleString()} XP earned</span>
            <span className="text-slate-400">{stats.activeDays} active days total</span>
          </div>
          <ProgressBar value={Math.min(100, Math.round((stats.weekXp / (goal.xp * 7)) * 100))} color="brand" className="mt-3" />
          <p className="text-[11px] text-slate-500 mt-2">Weekly target: {(goal.xp * 7).toLocaleString()} XP</p>
        </div>
      </div>
  )
}

export default function RetentionPage(): JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          title="Goals & Streak"
          subtitle="Set your pace, protect your streak, and choose how we keep you on track."
          back="/progress"
          crumbs={[{ label: 'Progress', to: '/progress' }, { label: 'Goals & Streak' }]}
        />
        <RetentionContent />
      </div>
    </div>
  )
}
