/**
 * Phase 8 — relationship / closeness model (feature 2.11).
 *
 * Every (profile, character) pair carries a 0–100 closeness score that grows
 * a little with each exchange. The score maps onto five named tiers; the tier
 * feeds a one-line instruction into the system prompt so the AI's warmth and
 * familiarity ramp up over time — a stranger is polite, a bestie teases.
 *
 * The raw number lives on `UserProfile.relationships[characterId]`. Keeping it
 * on the profile means it round-trips through the existing `profile.save` IPC
 * with no new channel, exactly like custom characters.
 */

export type RelationshipTier =
  | 'new'
  | 'acquaintance'
  | 'friend'
  | 'close'
  | 'bestie'

export interface RelationshipTierInfo {
  id: RelationshipTier
  /** Inclusive lower bound on the 0–100 score. */
  min: number
  label: string
  emoji: string
  /** One line glued into the system prompt at this tier. */
  prompt: string
}

/**
 * Ordered high → low so `relationshipTier` can return the first match.
 */
export const RELATIONSHIP_TIERS: readonly RelationshipTierInfo[] = [
  {
    id: 'bestie',
    min: 85,
    label: 'Best friends',
    emoji: '💛',
    prompt:
      "You two are close friends who talk all the time. Be warm and playful, tease gently, reference that you know them well."
  },
  {
    id: 'close',
    min: 65,
    label: 'Close',
    emoji: '🤝',
    prompt:
      'You know this person well by now. Be relaxed and familiar, like catching up with a good friend.'
  },
  {
    id: 'friend',
    min: 40,
    label: 'Friends',
    emoji: '🙂',
    prompt: 'You are becoming friends. Be friendly and a little more personal than with a stranger.'
  },
  {
    id: 'acquaintance',
    min: 15,
    label: 'Getting to know you',
    emoji: '👋',
    prompt: 'You have chatted a few times. Be warm but still a little getting-to-know-you.'
  },
  {
    id: 'new',
    min: 0,
    label: 'Just met',
    emoji: '✨',
    prompt: 'You have just met this person. Be welcoming and friendly without being overly familiar.'
  }
] as const

/** How many points one completed exchange adds to the relationship score. */
export const RELATIONSHIP_BUMP_PER_TURN = 3
export const RELATIONSHIP_MAX = 100

export function clampRelationship(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(RELATIONSHIP_MAX, Math.round(value)))
}

export function relationshipTier(score: number): RelationshipTierInfo {
  const s = clampRelationship(score)
  return RELATIONSHIP_TIERS.find((t) => s >= t.min) ?? RELATIONSHIP_TIERS[RELATIONSHIP_TIERS.length - 1]
}

/** Pull the stored closeness for a character (0 when never talked). */
export function relationshipScore(
  relationships: Record<string, number> | undefined,
  characterId: string | undefined
): number {
  if (!relationships || !characterId) return 0
  return clampRelationship(relationships[characterId] ?? 0)
}

/** Apply one exchange's worth of growth, returning the new clamped score. */
export function bumpRelationshipScore(current: number, by: number = RELATIONSHIP_BUMP_PER_TURN): number {
  return clampRelationship(current + by)
}
