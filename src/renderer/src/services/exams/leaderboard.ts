/**
 * Exam leaderboard (#A61) — ranks learners by their best real exam attempt for
 * a family. Built entirely from persisted `exam_attempts`, so a row only exists
 * once someone has actually sat the test. No fabricated competitors.
 */
import type { ExamKind, PlatformUser } from '@shared/types'
import { backend } from '../backend'

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatarEmoji?: string
  /** Best overall numeric for the family. */
  best: number
  /** Family-formatted score (band / total / level%). */
  display: string
  /** Number of attempts that count toward this family. */
  attempts: number
  /** True for the signed-in learner's own row. */
  isMe: boolean
}

/** Format a stored numeric overall back into the family's display scale. */
export function fmtFamilyScore(kind: ExamKind, numeric: number): string {
  if (kind === 'ielts') return numeric.toFixed(1)
  if (kind === 'cefr') return `${numeric}%`
  return String(Math.round(numeric))
}

/**
 * Build the leaderboard for a family. Aggregates every user's best attempt.
 * For the local backend all attempts live in one store, so a single pass over
 * known users is correct and cheap.
 */
export async function examLeaderboard(kind: ExamKind, limit = 25): Promise<LeaderboardEntry[]> {
  const meId = backend.currentUserId() ?? 'u_local'

  // Gather candidate users: everyone listable + the current user (who may not
  // appear in a role-filtered list).
  const listed: PlatformUser[] = await backend.listUsers({ limit: 200 }).catch(() => [])
  const byId = new Map<string, PlatformUser>()
  listed.forEach((u) => byId.set(u.id, u))
  if (!byId.has(meId)) {
    byId.set(meId, { id: meId, name: 'You', email: '', role: 'student', nativeLanguage: 'en', targetLanguage: 'en', createdAt: '' } as PlatformUser)
  }

  const rows: Omit<LeaderboardEntry, 'rank'>[] = []
  for (const u of byId.values()) {
    const attempts = await backend.listExamAttempts(u.id, kind).catch(() => [])
    if (attempts.length === 0) continue
    const best = Math.max(...attempts.map((a) => a.overall))
    rows.push({
      userId: u.id,
      name: u.id === meId ? (u.name ? `${u.name} (you)` : 'You') : (u.name || 'Learner'),
      avatarEmoji: u.avatarEmoji,
      best,
      display: fmtFamilyScore(kind, best),
      attempts: attempts.length,
      isMe: u.id === meId
    })
  }

  rows.sort((a, b) => b.best - a.best)
  return rows.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }))
}
