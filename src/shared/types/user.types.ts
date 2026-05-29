import type { CEFRLevel } from './cefr.types'
import type { CharacterInfo } from './character.types'
import type { Interest, LearningGoal } from './learning.types'
import type { UserSettings } from './settings.types'

/**
 * ISO 639-1 codes for the languages the platform supports as a *learning target*.
 * Onboarding asks the user which one they want to learn; nearly all content
 * (exams, courses, library, vocabulary decks, AI tutor scenarios) is filtered
 * against this value.
 */
export type TargetLanguage =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'ru'
  | 'ar'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'it'
  | 'pt'
  | 'tr'

export interface UserProfile {
  createdAt: string
  updatedAt: string
  name?: string
  nativeLanguage: string
  targetLanguage: TargetLanguage
  goals: LearningGoal[]
  interests: Interest[]
  level: CEFRLevel
  weakAreas: string[]
  settings: UserSettings
  /**
   * User-authored characters layered on top of the built-in preset catalog
   * (`@shared/constants` CHARACTERS). Resolved via `resolveCharacter()` —
   * custom ones win over presets if IDs collide, so the user can "override"
   * Emma with their own tweaked version.
   */
  customCharacters?: CharacterInfo[]
  /**
   * Phase 8 (feature 2.15) — character ids the user starred. Favorites sort
   * to the front of the picker / gallery. Missing = none.
   */
  favoriteCharacterIds?: string[]
  /**
   * Phase 10 (feature 2.10) — per-character memory. Short notes the companion
   * "remembers" about the learner, injected into the system prompt so context
   * persists across sessions. Keyed by character id.
   */
  companionMemory?: Record<string, MemoryNote[]>
  /**
   * Phase 8 (feature 2.11) — per-character closeness score (0–100). Grows a
   * little with each exchange; mapped to a relationship tier that nudges the
   * AI's warmth in `buildSystemPrompt`. Keyed by character id.
   */
  relationships?: Record<string, number>
  /**
   * COPPA-style age verification. Stored as an ISO date (yyyy-mm-dd) and
   * derived into `AgeBand` by `lib/age.ts`. Missing = unconfirmed; the gate
   * UI asks the user before they can browse companions.
   */
  dateOfBirth?: string
  /** Convenience cache so we don't recompute on every render. */
  ageBand?: AgeBand
  /** Phase 12 / #54 — the user's customised 3D avatar (Memoji-style). */
  avatar3d?: Avatar3DConfig
}

export type AgeBand = 'under13' | 'teen' | 'adult'

/**
 * Phase 10 — a single thing a companion remembers about the learner.
 * Pinned notes always make it into the prompt; the rest are most-recent-first.
 */
export interface MemoryNote {
  id: string
  text: string
  createdAt: string
  pinned?: boolean
}

export type HairStyle = 'short' | 'bald' | 'bun' | 'long'

/**
 * Knobs for the procedural three.js avatar in the Avatar Studio (#54). All
 * colours are hex strings (with leading #). Kept deliberately small so the
 * whole config round-trips through `profile.save` with no extra IPC.
 */
export interface Avatar3DConfig {
  skinTone: string
  hairColor: string
  hairStyle: HairStyle
  eyeColor: string
  outfitColor: string
  background: string
  /** Vertical head stretch, 1.0 (round) – 1.3 (long). */
  headRoundness: number
}

export const DEFAULT_AVATAR_3D: Avatar3DConfig = {
  skinTone: '#ffd9b8',
  hairColor: '#3a281c',
  hairStyle: 'short',
  eyeColor: '#1a2b4a',
  outfitColor: '#3b4a66',
  background: '#0b1020',
  headRoundness: 1.15
}
