import type { UserProfile } from '@shared/types'
import { findCharacter } from '@shared/constants'
import { ACCENT_PERSONA, CORRECTION_RULE, LEVEL_GUIDE } from './constants'

interface BuildOptions {
  topic?: string
}

function personaLine(profile: UserProfile): string {
  const character = findCharacter(profile.settings.characterId)
  if (!character) return ACCENT_PERSONA[profile.settings.accent]
  return `You are ${character.name}, a ${character.age}-year-old English coach from ${character.origin}. ${character.personaHint}`
}

/**
 * Short, focused system prompt. Anything more than a few sentences slows the
 * first token noticeably on tiny CPU models (Qwen 0.5B/1.5B, Llama 3.2 1B).
 */
export function buildSystemPrompt(profile: UserProfile, opts: BuildOptions = {}): string {
  const interests = profile.interests.slice(0, 3).join(', ') || 'everyday life'
  const topic = opts.topic ? ` Today's topic: ${opts.topic}.` : ''
  const name = profile.name ? ` Learner's name: ${profile.name}.` : ''

  const lines: string[] = [
    personaLine(profile),
    `Learner CEFR level: ${profile.level}. ${LEVEL_GUIDE[profile.level]}`,
    `Topics they like: ${interests}.${topic}${name}`,
    'Reply in 1-2 short sentences. End with a simple question.',
    CORRECTION_RULE[profile.settings.correctionStyle]
  ]

  return lines.join(' ')
}
