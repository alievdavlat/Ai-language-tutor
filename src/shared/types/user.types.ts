import type { CEFRLevel } from './cefr.types'
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
}
