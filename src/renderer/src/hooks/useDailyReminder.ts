import { useEffect } from 'react'
import { useProgressStore, useStats } from '../services/progress'

const LAST_KEY = 'speakai.lastReminderDay'

/**
 * Makes the "Practice reminder" (Goals & Streak) actually fire. When reminders
 * are enabled and the user hasn't met today's goal, it shows a real desktop
 * notification once per day at/after the chosen hour. (Email/weekly digests
 * need a backend — tracked separately.)
 */
export function useDailyReminder(): void {
  const reminders = useProgressStore((s) => s.reminders)
  const stats = useStats()

  useEffect(() => {
    if (!reminders.enabled) return
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return
    if (Notification.permission === 'default') void Notification.requestPermission()

    const fire = (): void => {
      if (Notification.permission !== 'granted') return
      const now = new Date()
      if (now.getHours() < reminders.hour) return
      if (stats.goalMetToday) return
      const today = now.toISOString().slice(0, 10)
      try {
        if (localStorage.getItem(LAST_KEY) === today) return
        localStorage.setItem(LAST_KEY, today)
      } catch { /* quota */ }
      // eslint-disable-next-line no-new
      new Notification('Time to practice 🎯', {
        body: stats.streak > 0
          ? `Keep your ${stats.streak}-day streak alive — a few minutes is enough.`
          : `A few minutes today starts your streak.`
      })
    }

    fire()
    const t = window.setInterval(fire, 5 * 60 * 1000)
    return () => window.clearInterval(t)
  }, [reminders.enabled, reminders.hour, stats.goalMetToday, stats.streak])
}
