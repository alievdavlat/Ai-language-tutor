import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import { IconBolt, IconChat, IconCheck, IconFlame, IconHeart, IconUsers, IconX } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { findBuddy, matchBuddies, useStats, useProgressStore, type BuddyCandidate } from '../../services/progress'

function MatchBar({ pct }: { pct: number }): JSX.Element {
  const tone = pct >= 70 ? 'text-emerald-300' : pct >= 45 ? 'text-amber-300' : 'text-slate-400'
  return (
    <span className={cn('text-[11px] font-bold inline-flex items-center gap-1', tone)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {pct}% match
    </span>
  )
}

function CandidateCard({ c, onPair }: { c: BuddyCandidate; onPair: () => void }): JSX.Element {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-xl">
          {c.avatarEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">
            {c.country && <span className="mr-1">{c.country}</span>}
            {c.name}
          </p>
          <p className="text-[11px] text-slate-400">Level {c.level} · learning {c.targetLanguage.toUpperCase()}</p>
        </div>
        <MatchBar pct={c.match} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.goals.map((g) => (
          <span key={g} className="rounded-full bg-white/[0.05] text-[10px] text-slate-300 px-2 py-0.5 capitalize">
            {g}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 text-amber-300">
          <IconFlame className="w-3 h-3" /> {c.streak}d
        </span>
        <span className="inline-flex items-center gap-1 text-brand-200">
          <IconBolt className="w-3 h-3" /> {c.weeklyXp} XP/wk
        </span>
      </div>
      <button
        onClick={onPair}
        className="rounded-pill bg-grad-brand text-white text-xs font-bold px-4 py-2 inline-flex items-center justify-center gap-1.5 transition hover:brightness-110"
      >
        <IconUsers className="w-3.5 h-3.5" /> Pair up
      </button>
    </div>
  )
}

export default function BuddyPage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const stats = useStats()
  const buddyId = useProgressStore((s) => s.buddyId)
  const buddySince = useProgressStore((s) => s.buddySince)
  const pairBuddy = useProgressStore((s) => s.pairBuddy)
  const unpairBuddy = useProgressStore((s) => s.unpairBuddy)
  const [poked, setPoked] = useState(false)

  const buddy = buddyId ? findBuddy(buddyId) : null

  // ── No buddy yet → matcher ────────────────────────────────────────────────
  if (!buddy) {
    const candidates = matchBuddies(profile, 8)
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-6 w-full flex flex-col gap-6">
          <PageHeader
            title="Find a study buddy"
            subtitle="Matched by your level, goals and language. Keep each other accountable."
            back="/progress"
            crumbs={[{ label: 'Progress', to: '/progress' }, { label: 'Study buddy' }]}
          />

          <div className="rounded-card border border-white/10 bg-gradient-to-br from-brand-500/15 to-violet-500/10 p-5 flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <IconUsers className="w-7 h-7 text-brand-200" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Learners with a buddy practice 2× more</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Pick someone at your level — you'll share a weekly goal and see each other's activity.
              </p>
            </div>
          </div>

          <SectionHeading title="Suggested buddies" subtitle={`${candidates.length} matches for level ${profile?.level ?? 'B1'}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidates.map((c) => (
              <CandidateCard key={c.id} c={c} onPair={() => pairBuddy(c.id)} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Paired → shared dashboard ─────────────────────────────────────────────
  const combinedWeekly = stats.weekXp + buddy.weeklyXp
  const sharedTarget = 1000
  const sharedPct = Math.min(100, Math.round((combinedWeekly / sharedTarget) * 100))
  const sinceDays = buddySince ? Math.max(1, Math.floor((Date.now() - new Date(buddySince).getTime()) / 86400000)) : 1

  const activity = [
    { who: buddy.name, text: `completed a speaking session`, icon: <IconChat className="w-3.5 h-3.5" />, when: '2h ago' },
    { who: 'You', text: `earned ${stats.todayXp} XP today`, icon: <IconBolt className="w-3.5 h-3.5" />, when: 'today' },
    { who: buddy.name, text: `hit a ${buddy.streak}-day streak`, icon: <IconFlame className="w-3.5 h-3.5" />, when: 'yesterday' },
    { who: 'You', text: `reached ${stats.streak}-day streak`, icon: <IconFlame className="w-3.5 h-3.5" />, when: 'today' }
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          title="Your study buddy"
          subtitle={`Partners for ${sinceDays} day${sinceDays === 1 ? '' : 's'} · keep each other going.`}
          back="/progress"
          crumbs={[{ label: 'Progress', to: '/progress' }, { label: 'Study buddy' }]}
          action={
            <button
              onClick={unpairBuddy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-300 transition"
            >
              <IconX className="w-3.5 h-3.5" /> Unpair
            </button>
          }
        />

        {/* Buddy hero */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex items-center gap-5">
          <span className="w-20 h-20 rounded-3xl bg-grad-brand flex items-center justify-center text-4xl shadow-glow">
            {buddy.avatarEmoji}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">
              {buddy.country && <span className="mr-1.5">{buddy.country}</span>}
              {buddy.name}
            </h2>
            <p className="text-sm text-slate-400">Level {buddy.level} · learning {buddy.targetLanguage.toUpperCase()}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                <IconFlame className="w-3.5 h-3.5" /> {buddy.streak}-day streak
              </span>
              <span className="inline-flex items-center gap-1 text-brand-200 font-semibold">
                <IconBolt className="w-3.5 h-3.5" /> {buddy.weeklyXp} XP this week
              </span>
            </div>
          </div>
          <button
            onClick={() => setPoked(true)}
            disabled={poked}
            className={cn(
              'rounded-pill text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 transition shrink-0',
              poked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 hover:bg-white/20 text-white'
            )}
          >
            {poked ? <><IconCheck className="w-3.5 h-3.5" /> Sent</> : <><IconHeart className="w-3.5 h-3.5" /> Send a poke</>}
          </button>
        </div>

        {/* Shared weekly goal */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-white">Shared weekly goal</p>
            <span className="text-xs font-bold text-brand-200">
              {combinedWeekly.toLocaleString()} / {sharedTarget.toLocaleString()} XP
            </span>
          </div>
          <ProgressBar value={sharedPct} color={sharedPct >= 100 ? 'green' : 'brand'} />
          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
            <span>You: {stats.weekXp.toLocaleString()} XP</span>
            <span>{buddy.name}: {buddy.weeklyXp.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Shared activity */}
        <div>
          <SectionHeading title="Recent activity" subtitle="What you've both been up to" />
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <AvatarCircle name={a.who} size="sm" />
                <span className="w-7 h-7 rounded-full bg-white/[0.06] text-slate-300 flex items-center justify-center shrink-0">
                  {a.icon}
                </span>
                <p className="flex-1 text-sm text-slate-200">
                  <span className="font-semibold text-white">{a.who}</span> {a.text}
                </p>
                <span className="text-[11px] text-slate-500 shrink-0">{a.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
