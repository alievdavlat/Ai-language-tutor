import type {
  CharacterInfo,
  PersonalityTraits,
  SpeakingStyle,
  UserProfile
} from '@shared/types'
import { resolveCharacter } from '@shared/constants'
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

function personaLine(profile: UserProfile, character: CharacterInfo | null): string {
  if (!character) return ACCENT_PERSONA[profile.settings.accent]
  return `You are ${character.name}, a ${character.age}-year-old English coach from ${character.origin}. ${character.personaHint}`
}

/**
 * Short, focused system prompt. Anything more than a few sentences slows the
 * first token noticeably on tiny CPU models (Qwen 0.5B/1.5B, Llama 3.2 1B).
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

  const lines: string[] = [
    personaLine(profile, character),
    extras || null,
    `Learner CEFR level: ${profile.level}. ${LEVEL_GUIDE[profile.level]}`,
    `Topics they like: ${interests}.${topic}${name}`,
    'Reply in 1-2 short sentences. End with a simple question.',
    CORRECTION_RULE[profile.settings.correctionStyle]
  ].filter((x): x is string => !!x)

  return lines.join(' ')
}
