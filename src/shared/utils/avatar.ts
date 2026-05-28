/**
 * Open-licensed portrait URLs via DiceBear (MIT lib · CC0 generated art).
 *
 * Why DiceBear:
 *   - No keys, no rate limits worth worrying about, no terms-of-service traps.
 *   - Deterministic — same seed always renders the same face, so the user
 *     building a custom character can rely on a stable preview.
 *   - Five styles cover the range we want without dragging in adult-leaning art.
 *
 * If we ever need fully offline support, swap to `@dicebear/core` and inline
 * the SVG. For now the HTTP API is simplest.
 */
import type { CharacterInfo } from '../types/character.types'

const BASE = 'https://api.dicebear.com/9.x'

export type AvatarStyle = NonNullable<CharacterInfo['avatarStyle']>

const DEFAULT_STYLE: AvatarStyle = 'lorelei'

export function avatarUrl(seed: string, style: AvatarStyle = DEFAULT_STYLE, size = 256): string {
  const params = new URLSearchParams({
    seed,
    size: String(size),
    radius: '50',
    backgroundType: 'gradientLinear'
  })
  return `${BASE}/${style}/svg?${params.toString()}`
}

export function characterAvatarUrl(c: Pick<CharacterInfo, 'id' | 'avatarSeed' | 'avatarStyle'>, size = 256): string {
  return avatarUrl(c.avatarSeed ?? c.id, c.avatarStyle ?? DEFAULT_STYLE, size)
}
