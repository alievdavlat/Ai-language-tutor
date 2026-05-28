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
}
