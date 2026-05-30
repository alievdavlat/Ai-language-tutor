import type { ChatMessage } from '@shared/types'

export interface SpeakingScore {
  /** Display string for the band/score. */
  score: string
  /** Numeric value on the family scale (band for IELTS, /30 for TOEFL). */
  numeric: number
  /** 0–100 for the progress bar. */
  pct: number
  feedback: string[]
}

type Sender = (messages: ChatMessage[]) => Promise<string>

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function extractJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('no json')
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
}

/**
 * Grade a speaking-section transcript with the active LLM against the IELTS
 * (0–9) or TOEFL (0–30) speaking rubric. Returns null when the transcript is
 * too short or the model misbehaves, so the report screen never breaks.
 */
export async function scoreSpeaking(
  kind: 'ielts' | 'toefl',
  transcript: string,
  send: Sender
): Promise<SpeakingScore | null> {
  if (transcript.trim().split(/\s+/).length < 15) return null

  const isIelts = kind === 'ielts'
  const scale = isIelts ? '0 to 9 in 0.5 steps' : '0 to 30 (integer)'
  const criteria = isIelts
    ? 'Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation'
    : 'Delivery, Language Use, Topic Development'

  const system = [
    `You are a certified ${isIelts ? 'IELTS' : 'TOEFL iBT'} Speaking examiner.`,
    `Grade the candidate's spoken answer (given as a transcript) on the official rubric (${criteria}) and give an overall speaking score on the ${scale} scale.`,
    'The transcript may contain disfluencies from speech-to-text; judge content and language, not transcription noise.',
    'Reply with ONLY a JSON object, no markdown, in this exact shape:',
    isIelts
      ? '{"score":6.5,"feedback":["✓ strength","! improvement","! improvement"]}'
      : '{"score":24,"feedback":["✓ strength","! improvement","! improvement"]}',
    'Give 1 strength (prefix "✓ ") and 2 improvements (prefix "! "), concrete and tied to the answer.'
  ].join(' ')

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: `Grade this spoken answer transcript:\n\n${transcript}` }
  ]

  try {
    const raw = await send(messages)
    const obj = extractJson(raw)
    const rawScore = Number(obj.score)
    if (!Number.isFinite(rawScore)) throw new Error('bad score')
    const numeric = isIelts ? clamp(Math.round(rawScore * 2) / 2, 0, 9) : clamp(Math.round(rawScore), 0, 30)
    const pct = isIelts ? (numeric / 9) * 100 : (numeric / 30) * 100
    const feedback = Array.isArray(obj.feedback)
      ? (obj.feedback as unknown[]).map((s) => String(s)).slice(0, 5)
      : []
    return {
      score: isIelts ? numeric.toFixed(1) : String(numeric),
      numeric,
      pct: Math.round(pct),
      feedback: feedback.length ? feedback : ['✓ Answer graded.']
    }
  } catch {
    return null
  }
}
