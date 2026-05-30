/**
 * Static definitions for the gamification + retention systems. These never
 * change at runtime, so they live outside the (persisted) store. The store
 * only keeps the user's *state* against these catalogs (claims, unlocks,
 * preferences).
 */
import type {
  AchievementDef,
  DailyGoalDef,
  DailyGoalId,
  LeagueDef,
  MilestoneDef,
  QuestDef
} from './types'

// ─── Daily goals ─────────────────────────────────────────────────────────────

export const DAILY_GOALS: DailyGoalDef[] = [
  { id: 'casual', label: 'Casual', xp: 15, minutes: 5, blurb: '5 min a day — easy to keep up.' },
  { id: 'regular', label: 'Regular', xp: 30, minutes: 10, blurb: '10 min a day — steady progress.' },
  { id: 'serious', label: 'Serious', xp: 50, minutes: 15, blurb: '15 min a day — real momentum.' },
  { id: 'intense', label: 'Intense', xp: 100, minutes: 30, blurb: '30 min a day — fluent fast.' }
]

export const DEFAULT_GOAL_ID: DailyGoalId = 'regular'

export function goalDef(id: DailyGoalId): DailyGoalDef {
  return DAILY_GOALS.find((g) => g.id === id) ?? DAILY_GOALS[1]
}

// ─── Leagues (weekly XP race) ────────────────────────────────────────────────

export const LEAGUES: LeagueDef[] = [
  { id: 'Bronze', tint: 'from-amber-700 to-amber-900', rank: 'Top 30%', minXp: 0 },
  { id: 'Silver', tint: 'from-slate-400 to-slate-600', rank: 'Top 20%', minXp: 500 },
  { id: 'Gold', tint: 'from-amber-400 to-amber-600', rank: 'Top 10%', minXp: 1500 },
  { id: 'Sapphire', tint: 'from-blue-400 to-blue-700', rank: 'Top 5%', minXp: 4000 },
  { id: 'Ruby', tint: 'from-rose-400 to-rose-700', rank: 'Top 2%', minXp: 9000 },
  { id: 'Diamond', tint: 'from-sky-300 to-violet-500', rank: 'Top 0.5%', minXp: 20000 }
]

/** Which league a given lifetime-XP total sits in. */
export function leagueForXp(totalXp: number): LeagueDef {
  let current = LEAGUES[0]
  for (const l of LEAGUES) if (totalXp >= l.minXp) current = l
  return current
}

// ─── Quests ──────────────────────────────────────────────────────────────────

export const QUESTS: QuestDef[] = [
  // Daily
  { id: 'd_xp', scope: 'daily', title: 'Earn 30 XP', reward: 20, target: 30, unit: 'XP', icon: 'IconBolt', tint: 'bg-brand-500/15 text-brand-300' },
  { id: 'd_speak', scope: 'daily', title: 'Complete 1 speaking session', reward: 15, target: 1, unit: '', icon: 'IconMic', tint: 'bg-emerald-500/15 text-emerald-300' },
  { id: 'd_words', scope: 'daily', title: 'Learn 5 new words', reward: 25, target: 5, unit: 'words', icon: 'IconStar', tint: 'bg-amber-500/15 text-amber-300' },
  // Weekly
  { id: 'w_days', scope: 'weekly', title: 'Study 5 days this week', reward: 100, target: 5, unit: 'days', icon: 'IconFlame', tint: 'bg-orange-500/15 text-orange-300' },
  { id: 'w_words', scope: 'weekly', title: 'Learn 50 new words', reward: 80, target: 50, unit: 'words', icon: 'IconChat', tint: 'bg-violet-500/15 text-violet-300' },
  { id: 'w_lessons', scope: 'weekly', title: 'Finish 3 lessons', reward: 120, target: 3, unit: 'lessons', icon: 'IconTarget', tint: 'bg-rose-500/15 text-rose-300' },
  { id: 'w_xp', scope: 'weekly', title: 'Earn 300 XP', reward: 150, target: 300, unit: 'XP', icon: 'IconHeart', tint: 'bg-pink-500/15 text-pink-300' },
  // Monthly
  { id: 'm_lessons', scope: 'monthly', title: 'Finish 20 lessons', reward: 500, target: 20, unit: 'lessons', icon: 'IconTrophy', tint: 'bg-amber-400/20 text-amber-200' },
  { id: 'm_streak', scope: 'monthly', title: 'Hold a 14-day streak', reward: 300, target: 14, unit: 'days', icon: 'IconStar', tint: 'bg-yellow-400/20 text-yellow-200' }
]

// ─── Achievements ────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
  // Speaking
  { id: 'first_chat', name: 'First chat', desc: 'Send your first message', category: 'Speaking', icon: 'IconChat', tint: 'bg-brand-500/15 text-brand-300' },
  { id: 'smooth_talker', name: 'Smooth talker', desc: 'Complete 10 exchanges', category: 'Speaking', icon: 'IconMic', tint: 'bg-emerald-500/15 text-emerald-300', target: 10 },
  { id: 'conversation_pro', name: 'Conversation pro', desc: 'Complete 100 exchanges', category: 'Speaking', icon: 'IconStar', tint: 'bg-violet-500/15 text-violet-300', target: 100 },
  // Streak
  { id: 'on_fire', name: 'On fire', desc: '7-day streak', category: 'Streak', icon: 'IconFlame', tint: 'bg-orange-500/15 text-orange-300', target: 7 },
  { id: 'wildfire', name: 'Wildfire', desc: '30-day streak', category: 'Streak', icon: 'IconFlame', tint: 'bg-rose-500/15 text-rose-300', target: 30 },
  { id: 'eternal_flame', name: 'Eternal flame', desc: '100-day streak', category: 'Streak', icon: 'IconFlame', tint: 'bg-red-500/20 text-red-300', target: 100 },
  { id: 'year_of_fire', name: 'Year of fire', desc: '365-day streak', category: 'Streak', icon: 'IconTrophy', tint: 'bg-yellow-500/20 text-yellow-300', target: 365 },
  // Learning
  { id: 'hundred_words', name: '100 words', desc: 'Learn 100 vocabulary items', category: 'Learning', icon: 'IconBookmark', tint: 'bg-emerald-500/15 text-emerald-300', target: 100 },
  { id: 'lexicon', name: 'Lexicon', desc: 'Learn 1000 vocabulary items', category: 'Learning', icon: 'IconBook', tint: 'bg-sky-500/15 text-sky-300', target: 1000 },
  { id: 'first_lesson', name: 'First lesson', desc: 'Complete a lesson', category: 'Learning', icon: 'IconStar', tint: 'bg-amber-500/15 text-amber-300' },
  { id: 'xp_1000', name: '1000 XP', desc: 'Earn 1000 XP total', category: 'Learning', icon: 'IconBolt', tint: 'bg-violet-500/15 text-violet-300', target: 1000 },
  { id: 'xp_10000', name: '10,000 XP', desc: 'Earn 10,000 XP total', category: 'Learning', icon: 'IconBolt', tint: 'bg-fuchsia-500/15 text-fuchsia-300', target: 10000 },
  { id: 'sharp_tongue', name: 'Sharp tongue', desc: 'Get 50 corrections', category: 'Learning', icon: 'IconTarget', tint: 'bg-rose-500/15 text-rose-300', target: 50 },
  // Social
  { id: 'buddy_up', name: 'Buddy up', desc: 'Pair with a study buddy', category: 'Social', icon: 'IconUsers', tint: 'bg-teal-500/15 text-teal-300' },
  { id: 'goal_set', name: 'Committed', desc: 'Set a daily goal', category: 'Social', icon: 'IconTarget', tint: 'bg-sky-500/15 text-sky-300' },
  // Mastery
  { id: 'league_silver', name: 'Silver league', desc: 'Reach Silver', category: 'Mastery', icon: 'IconMedal', tint: 'bg-slate-300/20 text-slate-200' },
  { id: 'league_gold', name: 'Gold league', desc: 'Reach Gold', category: 'Mastery', icon: 'IconMedal', tint: 'bg-amber-400/20 text-amber-200' },
  { id: 'league_diamond', name: 'Diamond league', desc: 'Reach Diamond', category: 'Mastery', icon: 'IconTrophy', tint: 'bg-cyan-300/20 text-cyan-200' }
]

// ─── Streak-society milestones ───────────────────────────────────────────────

export const MILESTONES: MilestoneDef[] = [
  { days: 7, title: 'Week Warrior', reward: 50, freezes: 1, emoji: '🔥' },
  { days: 14, title: 'Fortnight Flame', reward: 100, freezes: 1, emoji: '✨' },
  { days: 30, title: 'Monthly Master', reward: 250, freezes: 2, emoji: '🏅' },
  { days: 50, title: 'Half-Century', reward: 400, freezes: 2, emoji: '💎' },
  { days: 100, title: 'Century Club', reward: 1000, freezes: 3, emoji: '👑' },
  { days: 365, title: 'Year of Fire', reward: 5000, freezes: 5, emoji: '🐉' }
]

// ─── Leaderboard competitors ─────────────────────────────────────────────────

/**
 * Deterministic competitor pool. Their weekly XP is fixed so the leaderboard is
 * stable across renders/sessions; the real learner is woven in by their own
 * live weekly XP. Friends scope shows a subset.
 */
export interface Competitor {
  name: string
  weeklyXp: number
  streak: number
  country: string
  friend: boolean
}

export const COMPETITORS: Competitor[] = [
  { name: 'Sasha K.', weeklyXp: 3420, streak: 42, country: '🇺🇦', friend: true },
  { name: 'Wei Lin', weeklyXp: 3105, streak: 21, country: '🇨🇳', friend: true },
  { name: 'Marco B.', weeklyXp: 2880, streak: 18, country: '🇮🇹', friend: false },
  { name: 'Priya S.', weeklyXp: 2610, streak: 30, country: '🇮🇳', friend: true },
  { name: 'Emma W.', weeklyXp: 2200, streak: 14, country: '🇬🇧', friend: false },
  { name: 'James L.', weeklyXp: 1980, streak: 9, country: '🇨🇦', friend: true },
  { name: 'Yui T.', weeklyXp: 1740, streak: 12, country: '🇯🇵', friend: false },
  { name: 'Liam O.', weeklyXp: 1620, streak: 4, country: '🇮🇪', friend: false },
  { name: 'Nadia R.', weeklyXp: 1455, streak: 11, country: '🇪🇬', friend: true },
  { name: 'Diego M.', weeklyXp: 1280, streak: 6, country: '🇲🇽', friend: false },
  { name: 'Anya P.', weeklyXp: 1110, streak: 8, country: '🇵🇱', friend: false },
  { name: 'Tom H.', weeklyXp: 940, streak: 3, country: '🇩🇪', friend: false }
]
