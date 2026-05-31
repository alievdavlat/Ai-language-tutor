import { useEffect } from 'react'
import { useProgressStore, useStats } from '../services/progress'
import { backend } from '../services/backend'
import { ensureSystemPermission, notify } from '../services/notifications'

const LAST_KEY = 'speakai.lastReminderDay'

/**
 * Makes the "Practice reminder" (Goals & Streak) actually fire. When reminders
 * are enabled and the user hasn't met today's goal, it raises a real
 * notification once per day at/after the chosen hour — written to the bell and
 * (if enabled) mirrored to the OS via the {@link notify} pipeline, which also
 * honours the per-type toggle and quiet hours. (Email/weekly digests need a
 * backend — tracked separately.)
 */
export function useDailyReminder(): void {
  const reminders = useProgressStore((s) => s.reminders)
  const stats = useStats()

  useEffect(() => {
    if (!reminders.enabled) return
    if (typeof window === 'undefined') return
    ensureSystemPermission()

    const fire = (): void => {
      const me = backend.currentUserId()
      if (!me) return
      const now = new Date()
      if (now.getHours() < reminders.hour) return
      if (stats.goalMetToday) return
      const today = now.toISOString().slice(0, 10)
      try {
        if (localStorage.getItem(LAST_KEY) === today) return
        localStorage.setItem(LAST_KEY, today)
      } catch { /* quota */ }
      // A live streak reads as "at risk"; a cold start is a gentle nudge.
      const atRisk = stats.streak > 0
      void notify({
        userId: me,
        kind: atRisk ? 'streak-at-risk' : 'reminder',
        title: atRisk ? 'Keep your streak alive 🔥' : 'Time to practice 🎯',
        body: atRisk
          ? `Your ${stats.streak}-day streak ends tonight — a few minutes is enough.`
          : 'A few minutes today starts your streak.',
        link: '/progress'
      })
    }

    fire()
    const t = window.setInterval(fire, 5 * 60 * 1000)
    return () => window.clearInterval(t)
  }, [reminders.enabled, reminders.hour, stats.goalMetToday, stats.streak])
}
