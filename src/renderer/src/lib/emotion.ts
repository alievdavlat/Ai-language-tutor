import type { AvatarEmotion } from '../components/avatar'

/**
 * Phase 13 — infer a facial expression from the companion's reply text.
 *
 * Deliberately a cheap offline heuristic (keywords + punctuation), NOT another
 * LLM call: it runs on every streamed reply and must stay instant on weak
 * machines. Good enough to make the avatar smile at good news, look surprised
 * at "wow!", concerned at "sorry", and thoughtful on a question.
 */

const SURPRISED = /\b(wow|whoa|no way|really|amazing|incredible|unbelievable|seriously|oh my)\b/i
const HAPPY = /\b(great|nice|awesome|love|haha|lol|glad|well done|perfect|exactly|good job|congrats?|congratulations|fantastic|wonderful|brilliant|yay|excited|happy)\b/i
const CONCERNED = /\b(sorry|unfortunately|sad|tough|too bad|don't worry|difficult|hard time|that's a shame|oh no|hang in there)\b/i

export function emotionFromText(text: string | undefined): AvatarEmotion {
  const t = (text ?? '').trim()
  if (!t) return 'neutral'

  // Strong surprise: emphatic punctuation or surprise words.
  if (/!{2,}/.test(t) || (SURPRISED.test(t) && /[!?]/.test(t))) return 'surprised'
  if (CONCERNED.test(t)) return 'concerned'
  if (HAPPY.test(t) || /😊|🙂|😄|😁|🎉/.test(t)) return 'happy'
  // A plain question → thoughtful/curious.
  if (/\?\s*$/.test(t)) return 'thinking'
  // A single exclamation usually reads upbeat.
  if (/!\s*$/.test(t)) return 'happy'
  return 'neutral'
}
