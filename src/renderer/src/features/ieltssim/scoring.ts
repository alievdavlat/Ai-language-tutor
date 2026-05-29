import type { ChatMessage } from '@shared/types'

export interface IeltsBands {
  overall: number
  fluency: number
  lexical: number
  grammar: number
  pronunciation: number
}

export interface IeltsScoreResult extends IeltsBands {
  feedback: string[]
}

export interface ScoreTurn {
  who: 'examiner' | 'me'
  text: string
}

type Sender = (messages: ChatMessage[]) => Promise<string>

const SYSTEM = [
  'You are a certified IELTS Speaking examiner. You grade a candidate transcript using the official IELTS Speaking band descriptors.',
  'Grade four criteria 0–9 in 0.5 steps: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.',
  'Note: pronunciation can only be partially judged from text — be lenient and base it on apparent fluency markers.',
  'Compute the overall band as the average of the four, rounded to the nearest 0.5.',
  'Reply with ONLY a JSON object, no prose, no markdown fences, in exactly this shape:',
  '{"fluency":7.0,"lexical":6.5,"grammar":7.0,"pronunciation":7.0,"overall":7.0,"feedback":["point 1","point 2","point 3","point 4"]}',
  'Each feedback string starts with "✓ " for a strength or "! " for an area to improve. Give 2 strengths and 2 improvements, concrete and tied to the candidate\'s actual words.'
].join(' ')

function clampBand(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return 6
  return Math.max(0, Math.min(9, Math.round(v * 2) / 2))
}

/** Pull the first JSON object out of a model reply (handles stray prose/fences). */
function extractJson(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('no json')
  return JSON.parse(raw.slice(start, end + 1))
}

/**
 * Sends the candidate transcript to the active cloud/local LLM and parses an
 * IELTS band breakdown. Falls back to a neutral estimate if the model misbehaves
 * so the result screen always has something to show.
 */
export async function scoreIeltsSpeaking(
  transcript: ScoreTurn[],
  send: Sender
): Promise<IeltsScoreResult> {
  const dialogue = transcript
    .map((t) => `${t.who === 'examiner' ? 'EXAMINER' : 'CANDIDATE'}: ${t.text}`)
    .join('\n')

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Grade this IELTS Speaking transcript:\n\n${dialogue}` }
  ]

  const fallback: IeltsScoreResult = {
    overall: 6.0,
    fluency: 6.0,
    lexical: 6.0,
    grammar: 6.0,
    pronunciation: 6.0,
    feedback: [
      '✓ You completed all three parts of the interview.',
      '! Scoring could not be computed automatically — try again with an AI provider configured.'
    ]
  }

  try {
    const raw = await send(messages)
    const obj = extractJson(raw) as Record<string, unknown>
    const fb = Array.isArray(obj.feedback)
      ? (obj.feedback as unknown[]).map((s) => String(s)).slice(0, 6)
      : fallback.feedback
    return {
      fluency: clampBand(obj.fluency),
      lexical: clampBand(obj.lexical),
      grammar: clampBand(obj.grammar),
      pronunciation: clampBand(obj.pronunciation),
      overall: clampBand(obj.overall),
      feedback: fb.length ? fb : fallback.feedback
    }
  } catch {
    return fallback
  }
}
