import type { Accent, CharacterInfo, MemoryNote, UserProfile } from '@shared/types'
import CharacterSection from './CharacterSection'

interface CompanionWorkshopProps {
  profile: UserProfile
  onPick: (characterId: string, accent: Accent) => void
  onCustomsChange: (next: CharacterInfo[]) => void
  onFavoritesChange: (next: string[]) => void
  /** Kept for API compat — memory/voice/persona now live in the Avatar Studio. */
  onMemoryChange?: (next: Record<string, MemoryNote[]>) => void
  onPatch?: (patch: Partial<UserProfile['settings']>) => void
}

/**
 * Companion settings = the gallery of companions. Everything else for a
 * companion (persona, memory, voice, preview chat) is configured in one place:
 * the Avatar Studio (open it via ✏️ Edit on a card, or "Create companion").
 */
export default function CompanionWorkshop({
  profile,
  onPick,
  onCustomsChange,
  onFavoritesChange
}: CompanionWorkshopProps): JSX.Element {
  return (
    <CharacterSection
      profile={profile}
      onPick={onPick}
      onCustomsChange={onCustomsChange}
      onFavoritesChange={onFavoritesChange}
    />
  )
}
