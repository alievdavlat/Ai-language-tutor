import type {
  CharacterInfo,
  PersonalityTraits,
  SpeakingStyle,
  UserProfile
} from '@shared/types'
import { resolveCharacter, relationshipScore, relationshipTier } from '@shared/constants'
import { ACCENT_PERSONA, CORRECTION_RULE, LEVEL_GUIDE } from './constants'

interface BuildOptions {
  topic?: string
}

function describeFormality(v: number): string | null {
  if (v >= 75) return 'very formal'
  if (v >= 55) return 'polite'
  if (v <= 25) return 'very casual'
  if (v <= 45) return 'casual'
  return null
}

function describePlayfulness(v: number): string | null {
  if (v >= 75) return 'playful and joke-heavy'
  if (v <= 25) return 'serious'
  return null
}

function describeEnergy(v: number): string | null {
  if (v >= 75) return 'high-energy and enthusiastic'
  if (v <= 25) return 'calm and low-key'
  return null
}

function describePersonality(p?: PersonalityTraits): string | null {
  if (!p) return null
  const parts = [describeFormality(p.formality), describePlayfulness(p.playfulness), describeEnergy(p.energy)].filter(
    (x): x is string => x !== null
  )
  if (parts.length === 0) return null
  return `Tone: ${parts.join(', ')}.`
}

const STYLE_PHRASE: Record<SpeakingStyle, string | null> = {
  neutral: null,
  formal: 'Use formal, business-appropriate English.',
  casual: 'Use everyday casual English.',
  slang: "Lean on informal slang and contractions ('gonna', 'wanna', 'yeah').",
  academic: 'Use precise, academic vocabulary and fuller sentence structures.',
  childish: 'Use simple words, short sentences, and playful expressions.'
}

function describeInterests(interests?: readonly string[]): string | null {
  if (!interests || interests.length === 0) return null
  return `Loves: ${interests.slice(0, 4).join(', ')}.`
}

/**
 * Phase 8 — turn 1–2 example exchanges into a tiny few-shot block so the model
 * mimics the character's voice. Capped at 2 to keep small CPU models fast.
 */
function describeExampleDialogue(character: CharacterInfo | null): string | null {
  const ex = character?.exampleDialogue
  if (!ex || ex.length === 0) return null
  const sample = ex
    .slice(0, 2)
    .map((e) => `Them: "${e.user}" → You: "${e.character}"`)
    .join(' ')
  return `Match this voice — ${sample}`
}

function personaLine(profile: UserProfile, character: CharacterInfo | null): string {
  if (!character) return ACCENT_PERSONA[profile.settings.accent]
  return `You are ${character.name}, a ${character.age}-year-old from ${character.origin}. ${character.personaHint}`
}

/**
 * Pi AI / luvea-style conversational coach. The heavy lifting here is tone:
 *   - "friend, not teacher" framing
 *   - short punchy replies (1 sentence default, never more than 2)
 *   - occasional back-channel fillers ("mm", "right", "I see")
 *   - curious follow-ups, NOT every turn — real friends don't interrogate
 *   - emotional reactions when the learner says something interesting
 *
 * Anything longer than ~8 lines of system prompt slows first-token noticeably
 * on tiny CPU models (Qwen 0.5B/1.5B, Llama 3.2 1B), so we stay lean.
 */
export function buildSystemPrompt(profile: UserProfile, opts: BuildOptions = {}): string {
  const character = resolveCharacter(profile, profile.settings.characterId)
  const interests = profile.interests.slice(0, 3).join(', ') || 'everyday life'
  const topic = opts.topic ? ` Today's topic: ${opts.topic}.` : ''
  const name = profile.name ? ` Learner's name: ${profile.name}.` : ''

  // Character-driven extras only show up when the character actually defines
  // them. Presets pre-Phase-7 left these undefined.
  const extras = [
    describePersonality(character?.personality),
    character?.speakingStyle ? STYLE_PHRASE[character.speakingStyle] : null,
    describeInterests(character?.interests)
  ]
    .filter((x): x is string => !!x)
    .join(' ')

  // Phase 8 — relationship closeness nudges warmth/familiarity over time.
  const relationshipLine = character
    ? relationshipTier(relationshipScore(profile.relationships, character.id)).prompt
    : null

  const lines: string[] = [
    personaLine(profile, character),
    extras || null,
    relationshipLine,
    describeExampleDialogue(character),
    'You are chatting like a warm friend on a voice call — not a formal tutor.',
    `Learner CEFR level: ${profile.level}. ${LEVEL_GUIDE[profile.level]}`,
    `Topics they like: ${interests}.${topic}${name}`,
    // Response shape — the biggest lever for "feels like Pi" vibe.
    'VOICE STYLE:',
    '- Reply in 1 short sentence most of the time. Never more than 2.',
    '- Open with a short reaction when natural ("Oh nice!", "Really?", "Mm, I get that.") — but not every turn.',
    '- Only ask a follow-up question about every 2nd turn. Real friends don\'t interrogate.',
    '- Sound spoken, not written: contractions, casual connectors ("so", "yeah", "honestly").',
    '- Never use lists, bullets, markdown, or emoji — this will be spoken aloud.',
    '- Never say "As an AI" or describe yourself as a model.',
    CORRECTION_RULE[profile.settings.correctionStyle]
  ].filter((x): x is string => !!x)

  return lines.join(' ')
}
