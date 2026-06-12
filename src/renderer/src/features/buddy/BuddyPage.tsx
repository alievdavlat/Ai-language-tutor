import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import { IconBolt, IconChat, IconCheck, IconFlame, IconHeart, IconUsers, IconX } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { backend } from '../../services/backend/useBackend'
import { timeAgo } from '../../lib/time'
import {
  findBuddyReal,
  matchBuddiesReal,
  useStats,
  useProgressStore,
  type BuddyCandidate
} from '../../services/progress'
import type { ActivityEvent } from '@shared/types'

// One poke per buddy per day — remembered across sessions.
const POKE_KEY = 'speakai.buddy.poke.v1'

function pokedToday(buddyId: string): boolean {
  try {
    const map = JSON.parse(localStorage.getItem(POKE_KEY) ?? '{}') as Record<string, string>
    return map[buddyId] === new Date().toDateString()
  } catch {
    return false
  }
}

function rememberPoke(buddyId: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(POKE_KEY) ?? '{}') as Record<string, string>
    map[buddyId] = new Date().toDateString()
    localStorage.setItem(POKE_KEY, JSON.stringify(map))
  } catch {
    // best-effort
  }
}

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

const ACTIVITY_LABEL: Record<string, string> = {
  lesson_complete: 'completed a lesson',
  word_learned: 'learned new words',
  practice_session: 'finished a practice session',
  speaking_session: 'completed a speaking session',
  exam_attempt: 'took an exam',
  streak_day: 'kept the streak alive',
  achievement: 'unlocked an achievement',
  course_enroll: 'enrolled in a course'
}

export default function BuddyPage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const stats = useStats()
  const buddyId = useProgressStore((s) => s.buddyId)
  const buddySince = useProgressStore((s) => s.buddySince)
  const pairBuddy = useProgressStore((s) => s.pairBuddy)
  const unpairBuddy = useProgressStore((s) => s.unpairBuddy)

  const [candidates, setCandidates] = useState<BuddyCandidate[]>([])
  const [buddy, setBuddy] = useState<BuddyCandidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [poked, setPoked] = useState(false)
  const [activity, setActivity] = useState<{ who: string; text: string; when: string }[]>([])

  // Load real candidates / the paired buddy from the backend user list.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      if (buddyId) {
        const b = await findBuddyReal(buddyId)
        if (!cancelled) {
          setBuddy(b)
          setPoked(pokedToday(buddyId))
        }
      } else {
        const list = await matchBuddiesReal(profile, 8)
        if (!cancelled) {
          setBuddy(null)
          setCandidates(list)
        }
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [buddyId, profile])

  // Real shared activity — my events + the buddy's, merged by time.
  useEffect(() => {
    let cancelled = false
    if (!buddyId || !buddy) {
      setActivity([])
      return
    }
    const me = backend.currentUserId()
    ;(async () => {
      const mine: ActivityEvent[] = me ? await backend.listActivity(me, { limit: 10 }).catch(() => []) : []
      const theirs: ActivityEvent[] = await backend.listActivity(buddyId, { limit: 10 }).catch(() => [])
      const rows = [
        ...mine.map((e) => ({ who: 'You', e })),
        ...theirs.map((e) => ({ who: buddy.name, e }))
      ]
        .sort((a, b) => new Date(b.e.createdAt).getTime() - new Date(a.e.createdAt).getTime())
        .slice(0, 8)
        .map(({ who, e }) => ({
          who,
          text: `${ACTIVITY_LABEL[e.kind] ?? 'was active'}${e.xp ? ` · +${e.xp} XP` : ''}`,
          when: timeAgo(e.createdAt)
        }))
      if (!cancelled) setActivity(rows)
    })()
    return () => {
      cancelled = true
    }
  }, [buddyId, buddy])

  // Poke = a real DM + a notification for the buddy, not just local state.
  const sendPoke = useCallback(async (): Promise<void> => {
    if (!buddy || poked) return
    setPoked(true)
    rememberPoke(buddy.id)
    const me = backend.currentUserId()
    if (!me) return
    try {
      const thread = await backend.getOrCreateThread(me, buddy.id)
      await backend.sendMessage({ threadId: thread.id, senderId: me, text: '👋 Poke! Keep the streak going — let’s practice today!' })
      await backend.createNotif({
        userId: buddy.id,
        type: 'social',
        title: 'Your study buddy poked you',
        body: `${profile?.name ?? 'Your buddy'} wants to practice together today.`,
        link: '/inbox'
      })
    } catch {
      // backend hiccup — the poke stays recorded locally
    }
  }, [buddy, poked, profile?.name])

  // ── No buddy yet → matcher ────────────────────────────────────────────────
  if (!buddyId || (!buddy && !loading)) {
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

          <SectionHeading
            title="Suggested buddies"
            subtitle={loading ? 'Finding matches…' : `${candidates.length} matches for level ${profile?.level ?? 'B1'}`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidates.map((c) => (
              <CandidateCard key={c.id} c={c} onPair={() => pairBuddy(c.id)} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!buddy) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading your buddy…</div>
    )
  }

  // ── Paired → shared dashboard ─────────────────────────────────────────────
  const combinedWeekly = stats.weekXp + buddy.weeklyXp
  const sharedTarget = 1000
  const sharedPct = Math.min(100, Math.round((combinedWeekly / sharedTarget) * 100))
  const sinceDays = buddySince ? Math.max(1, Math.floor((Date.now() - new Date(buddySince).getTime()) / 86400000)) : 1

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
            onClick={() => void sendPoke()}
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

        {/* Shared activity — real events from both learners */}
        <div>
          <SectionHeading title="Recent activity" subtitle="What you've both been up to" />
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {activity.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">
                No activity yet — complete a lesson or a speaking session and it will show up here.
              </p>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <AvatarCircle name={a.who} size="sm" />
                  <span className="w-7 h-7 rounded-full bg-white/[0.06] text-slate-300 flex items-center justify-center shrink-0">
                    <IconChat className="w-3.5 h-3.5" />
                  </span>
                  <p className="flex-1 text-sm text-slate-200">
                    <span className="font-semibold text-white">{a.who}</span> {a.text}
                  </p>
                  <span className="text-[11px] text-slate-500 shrink-0">{a.when}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
