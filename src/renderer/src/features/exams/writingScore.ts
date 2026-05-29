import type { ChatMessage } from '@shared/types'

export interface WritingScore {
  /** Display string for the band/score (e.g. "6.5" IELTS or "24" TOEFL). */
  score: string
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
 * Grades a writing-section response with the active cloud/local LLM against the
 * IELTS (0–9) or TOEFL (0–30) writing rubric. Returns a neutral fallback if no
 * essay was written or the model misbehaves, so the result screen never breaks.
 */
export async function scoreWriting(
  kind: 'ielts' | 'toefl',
  essay: string,
  send: Sender
): Promise<WritingScore | null> {
  if (essay.trim().split(/\s+/).length < 20) return null // too short to grade fairly

  const isIelts = kind === 'ielts'
  const scale = isIelts ? '0 to 9 in 0.5 steps' : '0 to 30 (integer)'
  const criteria = isIelts
    ? 'Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy'
    : 'Development, Organization, Language Use'

  const system = [
    `You are a certified ${isIelts ? 'IELTS' : 'TOEFL iBT'} Writing examiner.`,
    `Grade the candidate essay on the official rubric (${criteria}) and give an overall writing score on the ${scale} scale.`,
    'Reply with ONLY a JSON object, no markdown, in this exact shape:',
    isIelts
      ? '{"score":6.5,"feedback":["✓ strength","! improvement","! improvement"]}'
      : '{"score":24,"feedback":["✓ strength","! improvement","! improvement"]}',
    'Give 1 strength (prefix "✓ ") and 2 improvements (prefix "! "), concrete and tied to the essay.'
  ].join(' ')

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: `Grade this writing response:\n\n${essay}` }
  ]

  try {
    const raw = await send(messages)
    const obj = extractJson(raw)
    const rawScore = Number(obj.score)
    if (!Number.isFinite(rawScore)) throw new Error('bad score')
    const score = isIelts ? Math.round(rawScore * 2) / 2 : Math.round(rawScore)
    const bounded = isIelts ? clamp(score, 0, 9) : clamp(score, 0, 30)
    const pct = isIelts ? (bounded / 9) * 100 : (bounded / 30) * 100
    const feedback = Array.isArray(obj.feedback)
      ? (obj.feedback as unknown[]).map((s) => String(s)).slice(0, 5)
      : []
    return {
      score: isIelts ? bounded.toFixed(1) : String(bounded),
      pct: Math.round(pct),
      feedback: feedback.length ? feedback : ['✓ Essay graded.']
    }
  } catch {
    return null
  }
}
