import type { GrammarMatch } from '@shared/types'

/**
 * Turn a LanguageTool match into a short spoken sentence the avatar can say back.
 * Returns null when there's nothing meaningful to say.
 */
export function buildCorrectionFeedback(
  original: string,
  matches: GrammarMatch[]
): string | null {
  if (matches.length === 0) return null
  const best = matches[0]
  const mistake = original.slice(best.offset, best.offset + best.length)
  if (best.replacement) {
    return `You said "${mistake}" — a more natural form is "${best.replacement}".`
  }
  return `${best.message} (in "${mistake}")`
}
