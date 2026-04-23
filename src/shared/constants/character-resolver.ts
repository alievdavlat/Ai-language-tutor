import type { CharacterInfo, UserProfile } from '../types'
import { CHARACTERS } from './characters'

/**
 * Look a character up by id, checking the user's custom catalog first and
 * falling back to the built-in presets. Custom wins on id collision, so a
 * user can replace 'emma' with their own tweaked version.
 */
export function resolveCharacter(
  profile: Pick<UserProfile, 'customCharacters'> | null | undefined,
  id: string | undefined
): CharacterInfo | null {
  if (!id) return null
  const custom = profile?.customCharacters?.find((c) => c.id === id)
  if (custom) return custom
  return CHARACTERS[id] ?? null
}

/** Return presets + the user's custom characters as a flat array (custom first). */
export function listAllCharacters(
  profile: Pick<UserProfile, 'customCharacters'> | null | undefined
): CharacterInfo[] {
  const customs = profile?.customCharacters ?? []
  const presetIds = new Set(customs.map((c) => c.id))
  const presets = Object.values(CHARACTERS).filter((p) => !presetIds.has(p.id))
  return [...customs, ...presets]
}
