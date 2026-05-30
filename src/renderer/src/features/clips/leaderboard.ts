// Per-clip leaderboard, persisted to localStorage (device-local). When the
// cloud backend lands (Foundation/[1/8]), this can sync to a shared table —
// the shape here mirrors a future `clip_scores` row.

export interface ClipScore {
  name: string
  score: number
  hits: number
  fails: number
  accuracy: number // 0–100
  mode: string
  difficulty: string
  at: number // epoch ms
}

const KEY = 'speakai.clips.leaderboard.v1'

type Store = Record<string, ClipScore[]>

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function getLeaderboard(clipId: string): ClipScore[] {
  const list = read()[clipId] ?? []
  return [...list].sort((a, b) => b.score - a.score).slice(0, 10)
}

export function getBestScore(clipId: string): number {
  return getLeaderboard(clipId)[0]?.score ?? 0
}

/** Record a run and return the refreshed top-10 board for the clip. */
export function saveScore(clipId: string, entry: Omit<ClipScore, 'at'>): ClipScore[] {
  const store = read()
  const list = store[clipId] ?? []
  list.push({ ...entry, at: Date.now() })
  list.sort((a, b) => b.score - a.score)
  store[clipId] = list.slice(0, 25)
  write(store)
  return getLeaderboard(clipId)
}
