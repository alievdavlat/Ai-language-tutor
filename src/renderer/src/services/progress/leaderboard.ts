/**
 * Real leaderboard (#A16) — ranks actual backend users by XP earned in the
 * last 7 days (from their activity events), with streaks from user_stats.
 * "Friends" scope = the people you follow. Falls back to the static
 * COMPETITORS roster only when the backend has no other users at all.
 */
import { backend } from '../backend/useBackend'
import { COMPETITORS } from './catalog'
import type { LeaderRow } from './compute'

async function weeklyXpOf(userId: string, weekAgoMs: number): Promise<number> {
  try {
    const acts = await backend.listActivity(userId, { limit: 200 })
    return acts
      .filter((a) => new Date(a.createdAt).getTime() >= weekAgoMs)
      .reduce((sum, e) => sum + (e.xp ?? 0), 0)
  } catch {
    return 0
  }
}

export async function buildLeaderboardReal(
  meName: string,
  meWeeklyXp: number,
  meStreak: number,
  scope: 'global' | 'friends'
): Promise<LeaderRow[]> {
  const meId = backend.currentUserId()
  let others: { name: string; xp: number; streak: number; country?: string; me: boolean }[] = []
  try {
    const users =
      scope === 'friends' && meId
        ? await backend.following(meId)
        : await backend.listUsers({ limit: 30 })
    const weekAgo = Date.now() - 7 * 86_400_000
    const pool = users.filter((u) => u.id !== meId).slice(0, 20)
    others = await Promise.all(
      pool.map(async (u) => {
        const [xp, stats] = await Promise.all([
          weeklyXpOf(u.id, weekAgo),
          backend.getStats(u.id).catch(() => null)
        ])
        return { name: u.name, xp, streak: stats?.streak ?? 0, country: u.country, me: false }
      })
    )
  } catch {
    others = []
  }

  // Fresh install with no other users → static roster so the page isn't empty.
  if (others.length === 0 && scope === 'global') {
    others = COMPETITORS.map((c) => ({ name: c.name, xp: c.weeklyXp, streak: c.streak, country: c.country, me: false }))
  }

  const rows = [...others, { name: meName, xp: meWeeklyXp, streak: meStreak, country: '⭐', me: true }]
  rows.sort((a, b) => b.xp - a.xp)
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}
