import type { Accent } from './learning.types'

/**
 * Phase 7 adds these three core temperament axes. All values are 0..100:
 *   - `formality` — 0 = super-casual street talk, 100 = academic English
 *   - `playfulness` — 0 = deadpan/strict, 100 = giggly and joke-heavy
 *   - `energy` — 0 = introverted/low-key, 100 = bubbly/extroverted
 *
 * The slider values are translated into adjectives that get glued onto the
 * system prompt in `buildSystemPrompt`.
 */
export interface PersonalityTraits {
  formality: number
  playfulness: number
  energy: number
}

export type SpeakingStyle =
  | 'neutral'
  | 'formal'
  | 'casual'
  | 'slang'
  | 'academic'
  | 'childish'

export interface CharacterInfo {
  id: string
  name: string
  emoji: string
  accent: Accent
  age: number
  origin: string
  headline: string
  /** Short display tags shown on the picker card. */
  traits: readonly string[]
  bio: string
  /** Free-form extra instructions appended verbatim to the system prompt. */
  personaHint: string
  /** Phase 7 — slider temperament. Optional so old presets keep compiling. */
  personality?: PersonalityTraits
  /** Phase 7 — interest/hobby tags injected into the prompt. */
  interests?: readonly string[]
  /** Phase 7 — verbal register. `'neutral'` means "don't push the style". */
  speakingStyle?: SpeakingStyle
  /** `true` when the character was authored by the user (vs shipped preset). */
  isCustom?: boolean
}

export const DEFAULT_PERSONALITY: PersonalityTraits = {
  formality: 50,
  playfulness: 50,
  energy: 50
}

export const SPEAKING_STYLES: ReadonlyArray<{
  id: SpeakingStyle
  label: string
  description: string
}> = [
  { id: 'neutral', label: 'Neutral', description: 'No strong register — let personality lead.' },
  { id: 'formal', label: 'Formal', description: 'Polite, measured, business-appropriate.' },
  { id: 'casual', label: 'Casual', description: 'Everyday friendly English.' },
  { id: 'slang', label: 'Slang-heavy', description: "Street-talk, informal idioms, 'gonna' / 'wanna'." },
  { id: 'academic', label: 'Academic', description: 'Precise vocabulary, complex sentences.' },
  { id: 'childish', label: 'Childish', description: 'Simple words, playful expressions.' }
]
