const SENTENCE_END = /[.!?]+(?=\s|$)/g
const SOFT_PAUSE = /[,;:](?=\s|$)/g

export interface SentenceChunks {
  /** Fully-formed sentences ready to feed to TTS. */
  complete: string[]
  /** What's still being typed — not yet terminated. */
  remainder: string
}

/**
 * Pull complete sentences out of a streaming buffer. We accept `.` `!` `?`
 * (followed by whitespace or end-of-buffer) as hard endings. Also flush on
 * commas / semicolons / colons early so the first audio chunk lands in
 * ~500ms — the Pi-AI "starts speaking before you finish reading it" feel.
 *
 * Two soft-flush thresholds:
 *   - `earlyFlushChars` (default 40): fires on the *first* comma once the
 *     remainder passes this length. Gets audio out the door fast for a
 *     reply like "Oh nice, I love that — what made you..." — the first
 *     "Oh nice" chunk flushes immediately.
 *   - `softFlushChars` (default 90): for longer one-shot sentences that
 *     never hit `.!?`, still flush eventually so we don't starve TTS.
 */
export function extractSentences(
  buffer: string,
  opts?: { softFlushChars?: number; earlyFlushChars?: number }
): SentenceChunks {
  const softFlush = opts?.softFlushChars ?? 90
  const earlyFlush = opts?.earlyFlushChars ?? 40

  const complete: string[] = []
  let lastIndex = 0

  // Pass 1 — hard endings
  SENTENCE_END.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = SENTENCE_END.exec(buffer)) !== null) {
    const end = m.index + m[0].length
    const sentence = buffer.slice(lastIndex, end).trim()
    if (sentence) complete.push(sentence)
    lastIndex = end
  }

  let remainder = buffer.slice(lastIndex)

  // Pass 2a — early flush: as soon as the remainder crosses ~40 chars and
  // contains a comma, flush through the first comma. This is what makes
  // "Oh nice," speakable before the rest of the sentence arrives.
  if (remainder.length >= earlyFlush) {
    SOFT_PAUSE.lastIndex = 0
    const first = SOFT_PAUSE.exec(remainder)
    if (first) {
      const end = first.index + first[0].length
      const chunk = remainder.slice(0, end).trim()
      if (chunk) complete.push(chunk)
      remainder = remainder.slice(end)
    }
  }

  // Pass 2b — if remainder is still long without a hard ending, flush at
  // the last soft pause so audio doesn't lag behind generation.
  if (remainder.length > softFlush) {
    SOFT_PAUSE.lastIndex = 0
    let lastSoft = -1
    while ((m = SOFT_PAUSE.exec(remainder)) !== null) {
      lastSoft = m.index + m[0].length
    }
    if (lastSoft > 0) {
      const chunk = remainder.slice(0, lastSoft).trim()
      if (chunk) complete.push(chunk)
      remainder = remainder.slice(lastSoft)
    }
  }

  return { complete, remainder }
}

/** Safe even when the buffer has no terminator — used to flush at stream end. */
export function finalizeBuffer(buffer: string): string {
  return buffer.trim()
}
