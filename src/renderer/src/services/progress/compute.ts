/**
 * Pure derivation. Everything the UI shows is folded from the append-only
 * event log + the small preference/claim maps. No function here mutates state
 * or touches storage, so they are trivially testable and never drift.
 */
import type { ActivityEvent, DailyGoalId, SkillKey } from './types'
import { ACHIEVEMENTS, COMPETITORS, MILESTONES, QUESTS, goalDef, leagueForXp } from './catalog'

// ─── Date helpers (all local-time, calendar-day based) ───────────────────────

/** Local YYYY-MM-DD for a date. */
export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayKeyOf(iso: string): string {
  return dayKey(new Date(iso))
}

/**
 * Local Monday 00:00 that starts the ISO week containing `d` — the single
 * canonical week boundary for the leaderboard (#B6). Everyone's "weekly XP"
 * and the reset countdown are measured against this, so the three different
 * week definitions that used to disagree are now one.
 */
export function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayNum = (s.getDay() + 6) % 7 // Mon=0 … Sun=6
  s.setDate(s.getDate() - dayNum)
  s.setHours(0, 0, 0, 0)
  return s
}

/** Local Monday 00:00 that starts NEXT week — the leaderboard reset moment. */
export function nextWeekStart(d: Date): Date {
  const s = startOfWeek(d)
  s.setDate(s.getDate() + 7)
  return s
}

/** Monday-anchored ISO-week key, e.g. "2026-W22". */
export function weekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (t.getUTCDay() + 6) % 7 // Mon=0
  t.setUTCDate(t.getUTCDate() - dayNum + 3) // nearest Thursday
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((t.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    )
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Start of the current local day. */
function startOfToday(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface ProgressStats {
  totalXp: number
  todayXp: number
  weekXp: number
  /** Current consecutive-day streak (including freezes). */
  streak: number
  longestStreak: number
  /** Set of local day-keys with at least one event. */
  activeDays: number
  corrections: number
  wordsLearned: number
  speakingExchanges: number
  lessonsCompleted: number
  /** Per-skill mastery percent 0–100. */
  skills: Record<SkillKey, number>
  /** Did the learner already meet today's XP goal? */
  goalMetToday: boolean
  goalXp: number
  /** Whether any activity happened today. */
  activeToday: boolean
  /** Days since the last activity (0 = today). */
  daysIdle: number
}

const SKILLS: SkillKey[] = ['speaking', 'listening', 'grammar', 'vocabulary']

function sum(events: ActivityEvent[], pick: (e: ActivityEvent) => number): number {
  return events.reduce((a, e) => a + pick(e), 0)
}

/**
 * Compute the consecutive-day streak ending today (or yesterday — a streak
 * survives until a full day is missed). Frozen days count as active.
 */
export function computeStreak(activeDayKeys: Set<string>, now: Date): { current: number; longest: number } {
  // longest run anywhere in history
  const sorted = [...activeDayKeys].sort()
  let longest = 0
  let run = 0
  let prev: number | null = null
  for (const k of sorted) {
    const t = new Date(k + 'T00:00:00').getTime()
    if (prev !== null && t - prev === 86400000) run += 1
    else run = 1
    longest = Math.max(longest, run)
    prev = t
  }

  // current run walking back from today (allow today-empty: start at yesterday)
  let cursor = new Date(startOfToday(now))
  let current = 0
  if (!activeDayKeys.has(dayKey(cursor))) {
    cursor = new Date(cursor.getTime() - 86400000) // grace: count up to yesterday
    if (!activeDayKeys.has(dayKey(cursor))) return { current: 0, longest }
  }
  while (activeDayKeys.has(dayKey(cursor))) {
    current += 1
    cursor = new Date(cursor.getTime() - 86400000)
  }
  return { current, longest }
}

/** Mastery percent for a skill from its XP, softly capped (diminishing). */
function masteryFromXp(xp: number): number {
  // 0 → 0%, ~600 XP → ~80%, asymptotic toward 100%.
  return Math.min(100, Math.round(100 * (1 - Math.exp(-xp / 350))))
}

export function deriveStats(
  events: ActivityEvent[],
  goalId: DailyGoalId,
  frozenDates: string[],
  now: Date
): ProgressStats {
  const todayKey = dayKey(now)
  const wk = weekKey(now)

  const totalXp = sum(events, (e) => e.xp)
  const todayXp = sum(
    events.filter((e) => dayKeyOf(e.at) === todayKey),
    (e) => e.xp
  )
  const weekXp = sum(
    events.filter((e) => weekKey(new Date(e.at)) === wk),
    (e) => e.xp
  )

  const activeDayKeys = new Set<string>(events.map((e) => dayKeyOf(e.at)))
  for (const f of frozenDates) activeDayKeys.add(f)

  const { current, longest } = computeStreak(activeDayKeys, now)

  const corrections = sum(events.filter((e) => e.kind === 'correction'), (e) => e.count ?? 1)
  const wordsLearned = sum(
    events.filter((e) => e.kind === 'word_learned' || e.kind === 'flashcard_round'),
    (e) => (e.kind === 'word_learned' ? e.count ?? 1 : (e.meta?.learned as number) ?? 0)
  )
  const speakingExchanges = sum(
    events.filter((e) => e.kind === 'speaking_exchange'),
    (e) => e.count ?? 1
  )
  const lessonsCompleted = events.filter(
    (e) => e.kind === 'lesson_complete' || e.kind === 'flashcard_round'
  ).length

  const skills = {} as Record<SkillKey, number>
  for (const s of SKILLS) {
    const xp = sum(events.filter((e) => e.skill === s), (e) => e.xp)
    skills[s] = masteryFromXp(xp)
  }

  const goalXp = goalDef(goalId).xp
  const lastAt = events.reduce((max, e) => Math.max(max, new Date(e.at).getTime()), 0)
  const daysIdle =
    lastAt === 0 ? Infinity : Math.floor((startOfToday(now) - startOfToday(new Date(lastAt))) / 86400000)

  return {
    totalXp,
    todayXp,
    weekXp,
    streak: current,
    longestStreak: longest,
    activeDays: activeDayKeys.size,
    corrections,
    wordsLearned,
    speakingExchanges,
    lessonsCompleted,
    skills,
    goalMetToday: todayXp >= goalXp,
    goalXp,
    activeToday: activeDayKeys.has(todayKey),
    daysIdle: daysIdle === Infinity ? 999 : daysIdle
  }
}

/** Overall "knowledge" — mean of the four skill masteries. */
export function knowledgePct(stats: ProgressStats): number {
  const vals = SKILLS.map((s) => stats.skills[s])
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

// ─── Mastery crowns ──────────────────────────────────────────────────────────

/** Khan-style crown tier 0–4 from a mastery percent. */
export function crownTier(pct: number): number {
  if (pct >= 90) return 4
  if (pct >= 70) return 3
  if (pct >= 45) return 2
  if (pct >= 20) return 1
  return 0
}

// ─── Quests ──────────────────────────────────────────────────────────────────

export interface QuestView {
  id: string
  scope: 'daily' | 'weekly' | 'monthly'
  title: string
  reward: number
  target: number
  unit: string
  icon: string
  tint: string
  progress: number
  done: boolean
  claimed: boolean
  /** Storage key used to claim the reward in the current period. */
  claimKey: string
}

/** Current period key for a quest scope. */
export function periodKey(scope: 'daily' | 'weekly' | 'monthly', now: Date): string {
  if (scope === 'daily') return dayKey(now)
  if (scope === 'weekly') return weekKey(now)
  return monthKey(now)
}

function questProgress(id: string, events: ActivityEvent[], stats: ProgressStats, now: Date): number {
  const today = dayKey(now)
  const wk = weekKey(now)
  const mo = monthKey(now)
  const inToday = (e: ActivityEvent): boolean => dayKeyOf(e.at) === today
  const inWeek = (e: ActivityEvent): boolean => weekKey(new Date(e.at)) === wk
  const inMonth = (e: ActivityEvent): boolean => monthKey(new Date(e.at)) === mo

  switch (id) {
    case 'd_xp':
      return stats.todayXp
    case 'd_speak':
      return events.filter((e) => inToday(e) && e.kind === 'speaking_exchange').length > 0 ? 1 : 0
    case 'd_words':
      return sum(events.filter((e) => inToday(e) && e.kind === 'word_learned'), (e) => e.count ?? 1)
    case 'w_days':
      return new Set(events.filter(inWeek).map((e) => dayKeyOf(e.at))).size
    case 'w_words':
      return sum(events.filter((e) => inWeek(e) && e.kind === 'word_learned'), (e) => e.count ?? 1)
    case 'w_lessons':
      return events.filter((e) => inWeek(e) && (e.kind === 'lesson_complete' || e.kind === 'flashcard_round')).length
    case 'w_xp':
      return stats.weekXp
    case 'm_lessons':
      return events.filter((e) => inMonth(e) && (e.kind === 'lesson_complete' || e.kind === 'flashcard_round')).length
    case 'm_streak':
      return stats.streak
    default:
      return 0
  }
}

export function deriveQuests(
  events: ActivityEvent[],
  stats: ProgressStats,
  claimed: Record<string, string>,
  now: Date
): QuestView[] {
  return QUESTS.map((q) => {
    const progress = Math.min(q.target, questProgress(q.id, events, stats, now))
    const claimKey = `${q.id}:${periodKey(q.scope, now)}`
    return {
      ...q,
      progress,
      done: progress >= q.target,
      claimed: !!claimed[claimKey],
      claimKey
    }
  })
}

// ─── Achievements ────────────────────────────────────────────────────────────

export interface AchievementView {
  id: string
  name: string
  desc: string
  category: string
  icon: string
  tint: string
  target?: number
  progress: number
  unlocked: boolean
  /** True once the metric is met *right now* (used to fire the unlock). */
  earned: boolean
}

function achievementMetric(id: string, stats: ProgressStats, buddyId: string | null, goalSet: boolean): number {
  const league = leagueForXp(stats.totalXp).id
  const leagueRank = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Diamond'].indexOf(league)
  switch (id) {
    case 'first_chat':
      return stats.speakingExchanges >= 1 ? 1 : 0
    case 'smooth_talker':
      return stats.speakingExchanges
    case 'conversation_pro':
      return stats.speakingExchanges
    case 'on_fire':
    case 'wildfire':
    case 'eternal_flame':
    case 'year_of_fire':
      return Math.max(stats.streak, stats.longestStreak)
    case 'hundred_words':
    case 'lexicon':
      return stats.wordsLearned
    case 'first_lesson':
      return stats.lessonsCompleted >= 1 ? 1 : 0
    case 'xp_1000':
    case 'xp_10000':
      return stats.totalXp
    case 'sharp_tongue':
      return stats.corrections
    case 'buddy_up':
      return buddyId ? 1 : 0
    case 'goal_set':
      return goalSet ? 1 : 0
    case 'league_silver':
      return leagueRank >= 1 ? 1 : 0
    case 'league_gold':
      return leagueRank >= 2 ? 1 : 0
    case 'league_diamond':
      return leagueRank >= 5 ? 1 : 0
    default:
      return 0
  }
}

export function deriveAchievements(
  stats: ProgressStats,
  unlocked: Record<string, string>,
  buddyId: string | null,
  goalSet: boolean
): AchievementView[] {
  return ACHIEVEMENTS.map((a) => {
    const target = a.target ?? 1
    const metric = achievementMetric(a.id, stats, buddyId, goalSet)
    const earned = metric >= target
    return {
      ...a,
      progress: Math.min(target, metric),
      // Sticky: once unlocked it stays unlocked even if the metric later drops
      // (e.g. a streak resets). `earned` reflects the live metric.
      unlocked: !!unlocked[a.id] || earned,
      earned
    }
  })
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderRow {
  rank: number
  name: string
  xp: number
  streak: number
  country?: string
  me?: boolean
}

export function buildLeaderboard(
  meName: string,
  meWeeklyXp: number,
  meStreak: number,
  scope: 'global' | 'friends'
): LeaderRow[] {
  const pool = COMPETITORS.filter((c) => (scope === 'friends' ? c.friend : true)).map((c) => ({
    name: c.name,
    xp: c.weeklyXp,
    streak: c.streak,
    country: c.country,
    me: false
  }))
  pool.push({ name: meName, xp: meWeeklyXp, streak: meStreak, country: '⭐', me: true })
  pool.sort((a, b) => b.xp - a.xp)
  return pool.map((r, i) => ({ ...r, rank: i + 1 }))
}

// ─── Milestones ──────────────────────────────────────────────────────────────

export interface MilestoneView {
  days: number
  title: string
  reward: number
  freezes: number
  emoji: string
  reached: boolean
  current: boolean
}

export function deriveMilestones(stats: ProgressStats): MilestoneView[] {
  const best = Math.max(stats.streak, stats.longestStreak)
  const firstUnreached = MILESTONES.find((m) => best < m.days)
  return MILESTONES.map((m) => ({
    ...m,
    reached: best >= m.days,
    current: firstUnreached?.days === m.days
  }))
}

/** Milestones whose threshold the streak has reached (for reward granting). */
export function reachedMilestones(streak: number): number[] {
  return MILESTONES.filter((m) => streak >= m.days).map((m) => m.days)
}

// ─── Week tracker ────────────────────────────────────────────────────────────

export type WeekDayState = 'done' | 'today' | 'future' | 'missed'

export interface WeekDay {
  label: string
  state: WeekDayState
}

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Build the Mon→Sun tracker for the week containing `now`. */
export function weekDays(events: ActivityEvent[], frozenDates: string[], now: Date): WeekDay[] {
  const active = new Set<string>(events.map((e) => dayKeyOf(e.at)))
  for (const f of frozenDates) active.add(f)
  const todayKey = dayKey(now)
  // Monday of the current week.
  const monOffset = (now.getDay() + 6) % 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - monOffset)
  return DOW.map((label, i) => {
    const d = new Date(monday.getTime() + i * 86400000)
    const k = dayKey(d)
    let state: WeekDayState
    if (k === todayKey) state = 'today'
    else if (active.has(k)) state = 'done'
    else if (k < todayKey) state = 'missed'
    else state = 'future'
    return { label, state }
  })
}
