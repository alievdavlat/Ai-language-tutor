import { describe, it, expect, beforeEach } from 'vitest'
import { saveScore, getLeaderboard, getBestScore, userClipStats, type ClipScore } from './leaderboard'

const KEY = 'speakai.clips.leaderboard.v1'

function entry(over: Partial<Omit<ClipScore, 'at'>> = {}): Omit<ClipScore, 'at'> {
  return {
    name: 'Al',
    score: 100,
    hits: 10,
    fails: 2,
    accuracy: 83,
    mode: 'type',
    difficulty: 'beginner',
    ...over
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('getLeaderboard / getBestScore', () => {
  it('returns an empty board and 0 best score for an unplayed clip', () => {
    expect(getLeaderboard('nope')).toEqual([])
    expect(getBestScore('nope')).toBe(0)
  })

  it('survives corrupted storage', () => {
    localStorage.setItem(KEY, '{not json')
    expect(getLeaderboard('c1')).toEqual([])
  })
})

describe('saveScore', () => {
  it('records a run and returns the refreshed board', () => {
    const board = saveScore('c1', entry({ score: 42 }))
    expect(board).toHaveLength(1)
    expect(board[0].score).toBe(42)
    expect(board[0].name).toBe('Al')
    expect(typeof board[0].at).toBe('number')
  })

  it('keeps the board sorted by score descending and capped at top 10', () => {
    for (let i = 1; i <= 12; i++) saveScore('c1', entry({ score: i }))
    const board = getLeaderboard('c1')
    expect(board).toHaveLength(10)
    expect(board[0].score).toBe(12)
    expect(board.map((r) => r.score)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3])
    expect(getBestScore('c1')).toBe(12)
  })

  it('caps persisted history at 25 rows per clip', () => {
    for (let i = 1; i <= 30; i++) saveScore('c1', entry({ score: i }))
    const stored = JSON.parse(localStorage.getItem(KEY)!) as Record<string, unknown[]>
    expect(stored.c1).toHaveLength(25)
  })

  it('keeps clips independent of each other', () => {
    saveScore('c1', entry({ score: 10 }))
    saveScore('c2', entry({ score: 99 }))
    expect(getBestScore('c1')).toBe(10)
    expect(getBestScore('c2')).toBe(99)
  })
})

describe('userClipStats', () => {
  it('rolls up distinct clips, total hits and best score for one learner', () => {
    saveScore('c1', entry({ name: 'Al', score: 50, hits: 5 }))
    saveScore('c1', entry({ name: 'Al', score: 80, hits: 8 }))
    saveScore('c2', entry({ name: 'Al', score: 30, hits: 3 }))
    saveScore('c3', entry({ name: 'SomeoneElse', score: 999, hits: 99 }))

    const stats = userClipStats('Al')
    expect(stats.clipsPlayed).toBe(2)
    expect(stats.wordsFilled).toBe(16)
    expect(stats.bestScore).toBe(80)
  })

  it('returns zeros for a learner with no runs', () => {
    expect(userClipStats('Ghost')).toEqual({ clipsPlayed: 0, wordsFilled: 0, bestScore: 0 })
  })
})
