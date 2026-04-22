import type {
  CEFRLevel,
  ChatMessage,
  PlacementAnswer,
  PlacementQuestion,
  PlacementResult
} from '@shared/types'
import { CEFR_ORDER } from '@shared/types'
import { chat } from '../ollama/index.js'
import {
  detectWeakAreas,
  estimateLevelFromBreakdown,
  scoreStaticAnswers
} from './scorer.js'

const CEFR_ASSESSOR_SYSTEM_PROMPT =
  'You are a CEFR level assessor. Reply with a single JSON object: ' +
  '{"level":"A1|A2|B1|B2|C1|C2","note":"<one sentence>"}. No prose.'

function extractOpenEndedAnswer(
  questions: PlacementQuestion[],
  answers: PlacementAnswer[]
): string | undefined {
  const open = questions.find((q) => q.type === 'open-ended')
  if (!open) return undefined
  return answers.find((a) => a.questionId === open.id)?.answer
}

function parseAssessorReply(raw: string): { level?: CEFRLevel; note?: string } | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as { level?: CEFRLevel; note?: string }
  } catch {
    return null
  }
}

export async function evaluatePlacement(
  model: string,
  questions: PlacementQuestion[],
  answers: PlacementAnswer[]
): Promise<PlacementResult> {
  const scored = scoreStaticAnswers(questions, answers)
  let level = estimateLevelFromBreakdown(scored)
  const weakAreas = detectWeakAreas(questions, answers)
  const mcTotal = questions.filter((q) => q.correctAnswer).length

  let detail = `MC score: ${scored.correct}/${mcTotal}.`

  const openAnswer = extractOpenEndedAnswer(questions, answers)
  if (openAnswer && openAnswer.trim().length > 0) {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: CEFR_ASSESSOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Multiple-choice bucket scores: ${JSON.stringify(scored.perLevel)}.\n` +
            `Open-ended writing sample:\n"""${openAnswer}"""\n` +
            `Current provisional level: ${level}. Refine and reply JSON only.`
        }
      ]
      const raw = await chat(model, messages)
      const parsed = parseAssessorReply(raw)
      if (parsed?.level && CEFR_ORDER.includes(parsed.level)) level = parsed.level
      if (parsed?.note) detail += ` ${parsed.note}`
    } catch (err) {
      detail += ` (LLM refine skipped: ${(err as Error).message})`
    }
  }

  return { level, score: scored.correct, weakAreas, detail }
}
