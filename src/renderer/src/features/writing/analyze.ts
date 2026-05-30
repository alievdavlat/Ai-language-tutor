// Heuristic writing analysis — Hemingway-style readability highlighting.
// Pure client-side (no AI, free): flags hard sentences, adverbs, weakeners,
// passive voice and complex words, and computes a readability grade.
// The AI "rewrite / fix" path (Writing Coach) calls the cloud LLM separately.

export type WordIssue = 'adverb' | 'weakener' | 'passive' | 'complex'
export type SentenceLevel = 'ok' | 'hard' | 'veryhard'

export interface Token {
  text: string
  issue?: WordIssue
  /** simpler suggestion for a complex word */
  hint?: string
}

export interface AnalyzedSentence {
  level: SentenceLevel
  tokens: Token[]
}

export interface Analysis {
  sentences: AnalyzedSentence[]
  words: number
  sentenceCount: number
  readingSec: number
  grade: number
  gradeLabel: string
  counts: Record<'veryhard' | 'hard' | 'adverb' | 'weakener' | 'passive' | 'complex', number>
}

// Words with a simpler everyday alternative (purple).
const COMPLEX: Record<string, string> = {
  utilize: 'use',
  utilise: 'use',
  commence: 'start',
  terminate: 'end',
  demonstrate: 'show',
  sufficient: 'enough',
  numerous: 'many',
  additional: 'more',
  assistance: 'help',
  approximately: 'about',
  regarding: 'about',
  obtain: 'get',
  require: 'need',
  purchase: 'buy',
  indicate: 'show',
  attempt: 'try',
  however: 'but',
  therefore: 'so',
  furthermore: 'also',
  nevertheless: 'still',
  subsequently: 'later',
  consequently: 'so',
  facilitate: 'help',
  endeavor: 'try',
  ascertain: 'find out'
}

// Hedge / filler words that weaken writing (blue).
const WEAKENERS = new Set([
  'just', 'really', 'very', 'quite', 'somewhat', 'rather', 'fairly', 'pretty',
  'actually', 'basically', 'virtually', 'generally', 'usually', 'totally',
  'completely', 'literally', 'simply', 'almost', 'maybe', 'perhaps', 'so'
])

// -ly words that aren't adverbs.
const NOT_ADVERB = new Set([
  'only', 'family', 'reply', 'apply', 'supply', 'early', 'italy', 'ally',
  'july', 'holy', 'ugly', 'silly', 'lovely', 'lonely', 'friendly', 'likely',
  'bully', 'rally', 'jelly', 'belly'
])

const BE_VERBS = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am'])
const IRREGULAR_PP = new Set([
  'done', 'made', 'seen', 'known', 'given', 'taken', 'written', 'said', 'found',
  'held', 'kept', 'told', 'brought', 'built', 'bought', 'caught', 'thought',
  'sent', 'spent', 'lost', 'won', 'put', 'set', 'shown', 'broken', 'chosen'
])

const clean = (w: string): string => w.toLowerCase().replace(/[^a-z']/g, '')

function classifyWord(word: string): { issue?: WordIssue; hint?: string } {
  const c = clean(word)
  if (!c) return {}
  if (COMPLEX[c]) return { issue: 'complex', hint: COMPLEX[c] }
  if (WEAKENERS.has(c)) return { issue: 'weakener' }
  if (c.endsWith('ly') && c.length > 4 && !NOT_ADVERB.has(c)) return { issue: 'adverb' }
  return {}
}

function isParticiple(word: string): boolean {
  const c = clean(word)
  return (c.endsWith('ed') && c.length > 3) || IRREGULAR_PP.has(c)
}

export function analyze(text: string): Analysis {
  const trimmed = text.trim()
  const rawSentences = trimmed.length ? trimmed.split(/(?<=[.!?])\s+/) : []

  const counts = { veryhard: 0, hard: 0, adverb: 0, weakener: 0, passive: 0, complex: 0 }
  let totalWords = 0
  let totalChars = 0

  const sentences: AnalyzedSentence[] = rawSentences.map((sentence) => {
    const words = sentence.split(/\s+/).filter(Boolean)
    const wordCount = words.length
    totalWords += wordCount
    words.forEach((w) => (totalChars += clean(w).length))

    const tokens: Token[] = words.map((w, i): Token => {
      const cls = classifyWord(w)
      // passive: a be-verb followed by a participle → flag the participle
      if (!cls.issue && isParticiple(w) && i > 0 && BE_VERBS.has(clean(words[i - 1]))) {
        counts.passive++
        return { text: w, issue: 'passive' }
      }
      if (cls.issue) counts[cls.issue]++
      return { text: w, issue: cls.issue, hint: cls.hint }
    })

    let level: SentenceLevel = 'ok'
    if (wordCount >= 20) {
      level = 'veryhard'
      counts.veryhard++
    } else if (wordCount >= 14) {
      level = 'hard'
      counts.hard++
    }
    return { level, tokens }
  })

  const sentenceCount = sentences.length || 0
  // Automated Readability Index → US grade level (lower = easier).
  const grade =
    totalWords > 0 && sentenceCount > 0
      ? Math.max(1, Math.round(4.71 * (totalChars / totalWords) + 0.5 * (totalWords / sentenceCount) - 21.43))
      : 0
  const gradeLabel =
    grade === 0 ? '—' : grade <= 8 ? 'Good' : grade <= 10 ? 'OK' : grade <= 13 ? 'Hard to read' : 'Very hard to read'

  return {
    sentences,
    words: totalWords,
    sentenceCount,
    readingSec: Math.round((totalWords / 200) * 60),
    grade,
    gradeLabel,
    counts
  }
}

export const SAMPLE_TEXT =
  'I think that the weather today is really very nice and I am quite happy about it. ' +
  'The report was written by the team and it utilizes numerous advanced techniques that demonstrate our progress. ' +
  'We should commence the project soon. ' +
  'Honestly, the results were basically perfect and everyone was extremely satisfied with the outcome of the long and complicated meeting that we had yesterday afternoon.'
