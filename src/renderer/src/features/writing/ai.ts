import type { ChatMessage } from '@shared/types'

type Sender = (messages: ChatMessage[]) => Promise<string>

/**
 * Ask the active cloud LLM to rewrite the user's English in the Hemingway
 * house style: short sentences, simple everyday words, active voice, no
 * adverbs/weakeners, no passive. Returns ONLY the rewritten prose.
 */
export async function rewriteSimpler(text: string, send: Sender): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a writing editor in the style of the Hemingway app. Rewrite the English the user gives you so it is clearer and bolder: prefer short sentences, simple everyday words, and the active voice; cut adverbs and weakeners (just, very, really, quite); remove passive voice; keep the original meaning and roughly the same length. Reply with ONLY the rewritten text — no preamble, no quotes, no commentary, no markdown.'
    },
    { role: 'user', content: text }
  ]
  const raw = await send(messages)
  return raw.trim().replace(/^["'`]+|["'`]+$/g, '')
}

export interface ClarityFeedback {
  bullets: string[]
}

/**
 * Get concrete clarity / tone / grammar feedback as a short bullet list. Used
 * alongside the IELTS-style band from features/exams/writingScore.ts.
 */
export async function getClarityFeedback(text: string, send: Sender): Promise<ClarityFeedback> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are an encouraging English writing coach. Read the passage and give 3-5 short, concrete pieces of feedback on clarity, tone, structure, and grammar. Prefix each strength with "✓ " and each improvement with "! ". Reply with ONLY a JSON array of strings, e.g. ["✓ Clear opening.","! Split the second sentence."]. No markdown, no extra text.'
    },
    { role: 'user', content: text }
  ]
  const raw = await send(messages)
  try {
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    if (start === -1 || end === -1) throw new Error('no array')
    const arr = JSON.parse(raw.slice(start, end + 1)) as unknown[]
    const bullets = arr.map((s) => String(s)).filter(Boolean).slice(0, 6)
    return { bullets: bullets.length ? bullets : ['✓ Looks good — keep writing.'] }
  } catch {
    // Fallback: split the raw reply into lines so we still show something.
    const bullets = raw
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 6)
    return { bullets: bullets.length ? bullets : ['✓ Looks good — keep writing.'] }
  }
}
