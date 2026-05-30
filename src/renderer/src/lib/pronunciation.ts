// Pronunciation / shadowing scoring from a speech-recognition transcript.
//
// This is a transcript-alignment baseline: we recognize what the learner said
// (Web Speech) and align it to the target sentence, scoring each target word by
// how closely a spoken word matched. It rewards saying the right words clearly
// (a mumbled/wrong word won't be recognized → low score) without needing a
// phoneme model. A wav2vec2 sidecar for true per-phoneme scoring is a future
// upgrade — this gives real, useful feedback today.

export interface ScoredWord {
  text: string
  score: number // 0–100
}

export interface AttemptScore {
  words: ScoredWord[]
  overall: number // 0–100
  /** fraction of target words that were clearly matched (0–1) */
  coverage: number
}

const norm = (w: string): string => w.toLowerCase().replace(/[^a-z0-9']/g, '')

/** Levenshtein edit distance between two short strings. */
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

/** Word similarity 0–1 (1 = identical). */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  const d = editDistance(a, b)
  return Math.max(0, 1 - d / Math.max(a.length, b.length))
}

const GAP = -0.5 // penalty for a skipped/inserted word in the alignment

/**
 * Needleman–Wunsch alignment of target vs spoken words, then per-target-word
 * scoring. Short sentences only (the DP is O(n·m) but n,m < ~40).
 */
export function scoreAttempt(target: string, spoken: string): AttemptScore {
  const tWords = target.split(/\s+/).filter(Boolean)
  const t = tWords.map(norm)
  const s = spoken.split(/\s+/).map(norm).filter(Boolean)

  if (t.length === 0) return { words: [], overall: 0, coverage: 0 }
  if (s.length === 0) {
    return { words: tWords.map((w) => ({ text: w, score: 0 })), overall: 0, coverage: 0 }
  }

  const n = t.length
  const m = s.length
  // dp[i][j] = best alignment score of t[0..i) vs s[0..j)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 1; i <= n; i++) dp[i][0] = i * GAP
  for (let j = 1; j <= m; j++) dp[0][j] = j * GAP
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = dp[i - 1][j - 1] + similarity(t[i - 1], s[j - 1])
      dp[i][j] = Math.max(diag, dp[i - 1][j] + GAP, dp[i][j - 1] + GAP)
    }
  }

  // Traceback → similarity assigned to each target word (0 if skipped).
  const wordSim = new Array<number>(n).fill(0)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const diag = dp[i - 1][j - 1] + similarity(t[i - 1], s[j - 1])
    if (dp[i][j] === diag) {
      wordSim[i - 1] = similarity(t[i - 1], s[j - 1])
      i--
      j--
    } else if (dp[i][j] === dp[i - 1][j] + GAP) {
      i-- // target word skipped (not spoken)
    } else {
      j-- // extra spoken word
    }
  }

  const words: ScoredWord[] = tWords.map((w, k) => {
    const sm = wordSim[k]
    // Curve: exact → 100, close → high, weak → low. Keeps colors meaningful.
    let score: number
    if (sm >= 0.99) score = 100
    else if (sm >= 0.8) score = Math.round(80 + (sm - 0.8) * 100) // 80–99
    else if (sm > 0) score = Math.round(40 + sm * 50) // 40–80
    else score = 12 // missed entirely
    return { text: w, score: Math.min(100, score) }
  })

  const overall = Math.round(words.reduce((a, b) => a + b.score, 0) / words.length)
  const coverage = wordSim.filter((x) => x >= 0.6).length / n
  return { words, overall, coverage }
}
