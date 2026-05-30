import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { IconBolt, IconFlame, IconHeart, IconX } from '../../components/icons'
import { useStats, useProgressStore } from '../../services/progress'

interface Nudge {
  id: string
  icon: JSX.Element
  title: string
  body: string
  cta: string
  to: string
  tint: string
}

/**
 * Global retention nudges — "streak at risk", "AI misses you", "goal almost
 * there". Mounted once in AppShell. Honours the push-notification preference,
 * applies an armed streak-freeze on app open, and is dismissible per session.
 */
export default function RetentionNudges(): JSX.Element | null {
  const navigate = useNavigate()
  const stats = useStats()
  const pushOn = useProgressStore((s) => s.digests.push)
  const protectStreak = useProgressStore((s) => s.protectStreak)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Apply an armed streak-freeze to a single missed day, once per app open.
  useEffect(() => {
    protectStreak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nudge = useMemo<Nudge | null>(() => {
    if (!pushOn) return null
    const hour = new Date().getHours()

    // 1) Been away a while — "AI misses you".
    if (stats.daysIdle >= 2 && stats.totalXp > 0) {
      return {
        id: 'missed',
        icon: <IconHeart className="w-5 h-5" />,
        title: 'Your companion misses you 💬',
        body: `It's been ${stats.daysIdle} days. A 5-minute chat keeps your skills sharp.`,
        cta: 'Practice now',
        to: '/speaking',
        tint: 'from-rose-500/20 to-pink-500/10 border-rose-400/30 text-rose-200'
      }
    }

    // 2) Streak at risk — has a streak, nothing logged today, evening.
    if (stats.streak > 0 && !stats.activeToday && hour >= 17) {
      return {
        id: 'risk',
        icon: <IconFlame className="w-5 h-5" />,
        title: `Your ${stats.streak}-day streak is at risk! 🔥`,
        body: 'Do one quick session before midnight to keep it alive.',
        cta: 'Save my streak',
        to: '/speaking',
        tint: 'from-amber-500/20 to-orange-500/10 border-amber-400/30 text-amber-200'
      }
    }

    // 3) Close to today's goal.
    if (stats.activeToday && !stats.goalMetToday && stats.todayXp >= stats.goalXp * 0.6) {
      const left = stats.goalXp - stats.todayXp
      return {
        id: 'almost',
        icon: <IconBolt className="w-5 h-5" />,
        title: `Just ${left} XP to today's goal!`,
        body: 'You\'re so close — finish strong.',
        cta: 'Keep going',
        to: '/speaking',
        tint: 'from-brand-500/20 to-violet-500/10 border-brand-400/30 text-brand-200'
      }
    }

    return null
  }, [pushOn, stats])

  if (!nudge || dismissed.has(nudge.id)) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] animate-fade-in">
      <div className={cn('rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-4 shadow-card', nudge.tint)}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            {nudge.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{nudge.title}</p>
            <p className="text-xs text-slate-300 mt-0.5">{nudge.body}</p>
            <button
              onClick={() => {
                setDismissed((s) => new Set(s).add(nudge.id))
                navigate(nudge.to)
              }}
              className="mt-2.5 rounded-pill bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-1.5 transition"
            >
              {nudge.cta}
            </button>
          </div>
          <button
            onClick={() => setDismissed((s) => new Set(s).add(nudge.id))}
            className="text-slate-400 hover:text-white shrink-0"
            title="Dismiss"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
