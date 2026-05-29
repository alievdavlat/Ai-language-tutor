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

/**
 * Phase 9 — what role this companion plays. Drives the category filter in the
 * gallery and a small badge on cards. See `COMPANION_CATEGORIES`.
 */
export type CompanionCategory =
  | 'friend'
  | 'teacher'
  | 'coach'
  | 'examiner'
  | 'storyteller'

/**
 * Phase 8 — a single sample exchange that shows *how* the character talks.
 * Injected into the system prompt as a tiny few-shot block and shown on the
 * character's profile so the learner can preview the voice before picking.
 */
export interface ExampleExchange {
  /** What the learner might say. */
  user: string
  /** How this character would reply. */
  character: string
}

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
  /** Phase 9 — companion role (friend / teacher / coach / examiner / storyteller). */
  category?: CompanionCategory
  /**
   * Phase 12 — per-companion VRM 3D model URL/path. When set, the 3D avatar
   * renders this model (with lip-sync); otherwise it uses the procedural one
   * or the global `settings.vrmModelUrl`.
   */
  vrmUrl?: string
  /**
   * Phase 8 — the opening line the character says when a fresh conversation
   * starts. Shown (and optionally spoken) as the first assistant turn.
   */
  greeting?: string
  /**
   * Phase 8 — 1–3 sample exchanges. Seeded into the system prompt as few-shot
   * guidance (kept short for small local LLMs) and previewable on the profile.
   */
  exampleDialogue?: readonly ExampleExchange[]
  /**
   * DiceBear seed for the generated portrait. When set, UIs render the SVG
   * portrait instead of the emoji. Open licence — DiceBear is MIT and the
   * generated art is CC0. See `@shared/utils/avatar`.
   */
  avatarSeed?: string
  /** Which DiceBear style to use. Defaults to `lorelei`. */
  avatarStyle?: 'lorelei' | 'micah' | 'avataaars' | 'personas' | 'thumbs'
  /** Hex backdrop tinted behind the portrait on cards (no #, lowercase). */
  cardTint?: string
  /** Language the character is best for tutoring (en-US, es-MX, fr-FR, …). */
  language?: string
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
