import type { UserProfile } from '@shared/types'
import { findCharacter } from '@shared/constants'
import { ACCENT_PERSONA, CORRECTION_RULE, LEVEL_GUIDE } from './constants'

interface BuildOptions {
  topic?: string
}

function personaLine(profile: UserProfile): string {
  const character = findCharacter(profile.settings.characterId)
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
  const interests = profile.interests.slice(0, 3).join(', ') || 'everyday life'
  const topic = opts.topic ? ` Today's topic: ${opts.topic}.` : ''
  const name = profile.name ? ` Learner's name: ${profile.name}.` : ''

  const lines: string[] = [
    personaLine(profile),
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
  ]

  return lines.join(' ')
}
