import type { GrammarMatch } from '@shared/types'

/**
 * Rules that are too pedantic for a casual spoken-style chat. Sentence-initial
 * capitalization, trailing-period and whitespace nags would flag normal chat
 * like "hi emma" — we drop them so corrections feel natural and focus on real
 * grammar/word-choice mistakes.
 */
const IGNORED_RULE_IDS = new Set([
  'UPPERCASE_SENTENCE_START',
  'PUNCTUATION_PARAGRAPH_END',
  'WHITESPACE_RULE',
  'SENTENCE_WHITESPACE',
  'COMMA_PARENTHESIS_WHITESPACE',
  'DOUBLE_PUNCTUATION',
  'MISSING_FINAL_PUNCTUATION'
])
const IGNORED_CATEGORIES = new Set(['TYPOGRAPHY'])

/** Keep only corrections worth surfacing in a casual conversation. */
export function naturalGrammarMatches(matches: GrammarMatch[]): GrammarMatch[] {
  return matches.filter(
    (m) => !IGNORED_RULE_IDS.has(m.ruleId) && !IGNORED_CATEGORIES.has(m.category)
  )
}

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
