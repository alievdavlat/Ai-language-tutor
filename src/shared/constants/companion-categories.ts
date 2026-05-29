import type { CompanionCategory } from '../types/character.types'

/**
 * Phase 9 (feature 2.2) — companion role taxonomy. Used for the gallery
 * category filter and a small badge on cards.
 */
export interface CompanionCategoryInfo {
  id: CompanionCategory
  label: string
  emoji: string
  description: string
}

export const COMPANION_CATEGORIES: readonly CompanionCategoryInfo[] = [
  { id: 'friend', label: 'Friend', emoji: '🫂', description: 'Relaxed, everyday conversation partner.' },
  { id: 'teacher', label: 'Teacher', emoji: '👩‍🏫', description: 'Structured lessons, grammar, corrections.' },
  { id: 'coach', label: 'Coach', emoji: '🎯', description: 'Goal-focused — business, fluency, pacing.' },
  { id: 'examiner', label: 'Examiner', emoji: '🎓', description: 'Mock exams and formal assessment.' },
  { id: 'storyteller', label: 'Storyteller', emoji: '📖', description: 'Stories, listening, gentle pace.' }
] as const

const BY_ID: Record<CompanionCategory, CompanionCategoryInfo> = COMPANION_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<CompanionCategory, CompanionCategoryInfo>
)

export function companionCategory(id: CompanionCategory | undefined): CompanionCategoryInfo | null {
  if (!id) return null
  return BY_ID[id] ?? null
}
