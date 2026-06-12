/**
 * Study-buddy matching. Pairs the learner with others by target language,
 * level proximity and shared goals. Candidates come from the REAL backend
 * user list (any registered learner), with their real streak/weekly XP; the
 * deterministic roster below is only the empty-install fallback.
 */
import type { UserProfile } from '@shared/types'
import { backend } from '../backend/useBackend'
import { SEED_USERS } from '../backend/seed'
import type { BuddyCandidate } from './types'

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface RawLearner {
  id: string
  name: string
  avatarEmoji: string
  country?: string
  level: string
  targetLanguage: string
  goals: string[]
  streak: number
  weeklyXp: number
}

const extraPool: RawLearner[] = [
  { id: 'b_lucas', name: 'Lucas Almeida', avatarEmoji: '🎧', country: '🇧🇷', level: 'B1', targetLanguage: 'en', goals: ['travel', 'conversation'], streak: 12, weeklyXp: 640 },
  { id: 'b_aiko', name: 'Aiko Mori', avatarEmoji: '🌸', country: '🇯🇵', level: 'B2', targetLanguage: 'en', goals: ['work', 'exams'], streak: 28, weeklyXp: 1180 },
  { id: 'b_omar', name: 'Omar Haddad', avatarEmoji: '⚽', country: '🇪🇬', level: 'A2', targetLanguage: 'en', goals: ['conversation', 'movies'], streak: 5, weeklyXp: 320 },
  { id: 'b_sofia', name: 'Sofía Ramírez', avatarEmoji: '📚', country: '🇪🇸', level: 'B1', targetLanguage: 'en', goals: ['exams', 'work'], streak: 19, weeklyXp: 880 },
  { id: 'b_minji', name: 'Min-ji Park', avatarEmoji: '🎯', country: '🇰🇷', level: 'B2', targetLanguage: 'en', goals: ['work', 'conversation'], streak: 33, weeklyXp: 1420 },
  { id: 'b_ravi', name: 'Ravi Patel', avatarEmoji: '🚀', country: '🇮🇳', level: 'B1', targetLanguage: 'en', goals: ['travel', 'exams'], streak: 8, weeklyXp: 510 },
  { id: 'b_lena', name: 'Lena Novak', avatarEmoji: '🎨', country: '🇨🇿', level: 'A2', targetLanguage: 'en', goals: ['conversation', 'travel'], streak: 14, weeklyXp: 700 },
  { id: 'b_carlos', name: 'Carlos Méndez', avatarEmoji: '🎸', country: '🇲🇽', level: 'B2', targetLanguage: 'en', goals: ['movies', 'conversation'], streak: 22, weeklyXp: 1020 }
]

function levelGoals(profile: UserProfile): string[] {
  return (profile.goals ?? []).map((g) => String(g).toLowerCase())
}

function scoreOf(profile: UserProfile, c: RawLearner): number {
  let score = 0
  // Same target language is the strongest signal.
  if (c.targetLanguage === profile.targetLanguage) score += 50
  // Level proximity (same level = +30, one step = +18, two = +6).
  const a = CEFR.indexOf(profile.level)
  const b = CEFR.indexOf(c.level)
  if (a >= 0 && b >= 0) {
    const gap = Math.abs(a - b)
    score += gap === 0 ? 30 : gap === 1 ? 18 : gap === 2 ? 6 : 0
  }
  // Shared goals.
  const mine = new Set(levelGoals(profile))
  const shared = c.goals.filter((g) => mine.has(g)).length
  score += Math.min(20, shared * 10)
  return Math.min(100, score)
}

function rank(me: UserProfile, pool: RawLearner[], limit: number): BuddyCandidate[] {
  return pool
    .map<BuddyCandidate>((c) => {
      const match = scoreOf(me, c)
      const sharedGoals = c.goals.filter((g) => levelGoals(me).includes(g))
      const blurb =
        match >= 70
          ? 'Great match — same level and goals'
          : match >= 45
            ? 'Good match — close level'
            : 'Practice partner'
      return {
        id: c.id,
        name: c.name,
        avatarEmoji: c.avatarEmoji,
        country: c.country,
        level: c.level,
        targetLanguage: c.targetLanguage,
        goals: sharedGoals.length ? sharedGoals : c.goals.slice(0, 2),
        streak: c.streak,
        weeklyXp: c.weeklyXp,
        match,
        blurb
      }
    })
    .sort((a, b) => b.match - a.match || b.weeklyXp - a.weeklyXp)
    .slice(0, limit)
}

function fallbackProfile(): UserProfile {
  return { level: 'B1', targetLanguage: 'en', goals: [] as never[] } as unknown as UserProfile
}

function seedLearners(): RawLearner[] {
  return SEED_USERS.filter((u) => u.role === 'student').map((u) => ({
    id: u.id,
    name: u.name,
    avatarEmoji: u.avatarEmoji ?? '📖',
    country: u.country ? `🌍` : undefined,
    level: u.level ?? 'B1',
    targetLanguage: u.targetLanguage,
    goals: ['conversation', 'exams'],
    streak: 7 + (u.name.length % 20),
    weeklyXp: 400 + (u.name.length % 9) * 90
  }))
}

/** Sync fallback ranking over the static roster (kept for empty installs). */
export function matchBuddies(profile: UserProfile | null, limit = 6): BuddyCandidate[] {
  const me = profile ?? fallbackProfile()
  return rank(me, [...extraPool, ...seedLearners()], limit)
}

export function findBuddy(id: string): BuddyCandidate | null {
  return matchBuddies(null, 50).find((b) => b.id === id) ?? null
}

/**
 * Real candidate pool: every registered learner from the backend with their
 * REAL streak + XP earned in the last 7 days. Falls back to the static roster
 * when the backend has no other learners (fresh install).
 */
async function realPool(): Promise<RawLearner[]> {
  const meId = backend.currentUserId()
  let users: Awaited<ReturnType<typeof backend.listUsers>> = []
  try {
    users = await backend.listUsers({ role: 'student', limit: 30 })
  } catch {
    return []
  }
  const weekAgo = Date.now() - 7 * 86_400_000
  const out: RawLearner[] = []
  for (const u of users.filter((x) => x.id !== meId).slice(0, 16)) {
    let streak = 0
    let weeklyXp = 0
    try {
      const s = await backend.getStats(u.id)
      streak = s?.streak ?? 0
      const acts = await backend.listActivity(u.id, { limit: 100 })
      weeklyXp = acts
        .filter((a) => new Date(a.createdAt).getTime() >= weekAgo)
        .reduce((sum, e) => sum + (e.xp ?? 0), 0)
    } catch {
      // stats are best-effort — a user with no activity simply shows zeros
    }
    out.push({
      id: u.id,
      name: u.name,
      avatarEmoji: u.avatarEmoji ?? '📖',
      country: u.country,
      level: u.level ?? 'B1',
      targetLanguage: u.targetLanguage,
      goals: ['conversation'],
      streak,
      weeklyXp
    })
  }
  return out
}

export async function matchBuddiesReal(profile: UserProfile | null, limit = 8): Promise<BuddyCandidate[]> {
  const me = profile ?? fallbackProfile()
  const pool = await realPool()
  return rank(me, pool.length > 0 ? pool : [...extraPool, ...seedLearners()], limit)
}

export async function findBuddyReal(id: string): Promise<BuddyCandidate | null> {
  const all = await matchBuddiesReal(null, 100)
  return all.find((b) => b.id === id) ?? findBuddy(id)
}
