import type { CEFRLevel } from './cefr.types'
import type { CharacterInfo } from './character.types'
import type { Interest, LearningGoal } from './learning.types'
import type { UserSettings } from './settings.types'

export interface UserProfile {
  createdAt: string
  updatedAt: string
  name?: string
  nativeLanguage: string
  targetLanguage: 'english'
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
