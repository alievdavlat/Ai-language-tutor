/**
 * Phase 10 (feature 2.12) — day-to-day mood variation.
 *
 * Each companion has a mood that shifts daily but stays stable *within* a day,
 * so the same character feels consistent across a session yet a little
 * different tomorrow. We derive it deterministically from
 * `hash(characterId + YYYY-MM-DD)` — no storage, fully offline, and identical
 * on every device for the same day. The mood adds one line to the system
 * prompt and shows as a small "feeling X today" badge.
 */

export type MoodId =
  | 'cheerful'
  | 'thoughtful'
  | 'energetic'
  | 'calm'
  | 'nostalgic'
  | 'focused'
  | 'playful'

export interface MoodInfo {
  id: MoodId
  label: string
  emoji: string
  /** One line glued into the system prompt. */
  prompt: string
}

export const MOODS: readonly MoodInfo[] = [
  { id: 'cheerful', label: 'cheerful', emoji: '😊', prompt: 'You are in a cheerful mood today — extra upbeat and warm.' },
  { id: 'thoughtful', label: 'thoughtful', emoji: '🤔', prompt: 'You feel thoughtful today — a little more reflective and curious than usual.' },
  { id: 'energetic', label: 'energetic', emoji: '⚡', prompt: 'You are full of energy today — lively and quick to react.' },
  { id: 'calm', label: 'calm', emoji: '🌿', prompt: 'You feel calm and relaxed today — unhurried and gentle.' },
  { id: 'nostalgic', label: 'nostalgic', emoji: '🍂', prompt: 'You feel a bit nostalgic today — you bring up memories and stories.' },
  { id: 'focused', label: 'focused', emoji: '🎯', prompt: 'You feel focused today — keen to make real progress.' },
  { id: 'playful', label: 'playful', emoji: '😄', prompt: 'You are in a playful mood today — quick with a joke or a tease.' }
] as const

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** yyyy-mm-dd in local time. */
function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Deterministic mood for a character on a given day. Defaults to today.
 * Pass an explicit `date` for tests / previews.
 */
export function dailyMood(characterId: string | undefined, date: Date = new Date()): MoodInfo {
  const key = `${characterId ?? 'default'}-${dayKey(date)}`
  return MOODS[hashString(key) % MOODS.length]
}
