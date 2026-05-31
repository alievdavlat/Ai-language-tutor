/**
 * Exam insights (#A61) — per-question-type accuracy, accumulated from real
 * graded answers so the progress dashboard can surface a learner's *weak
 * question types* (e.g. "inference", "vocabulary in context").
 *
 * The Foundation `exam_attempts` table stores the overall + per-section scores,
 * but not per-question-type tallies. Rather than widen the shared schema +
 * both backends, we keep this derived signal in a dedicated, per-user
 * localStorage store. It is fed by the real answer key at grade time — nothing
 * here is mock; it is a projection of the learner's actual mistakes.
 */
import { useEffect, useState } from 'react'
import { QTYPE_LABEL, type QType } from '../../features/exams/banks'

const LS_KEY = 'speakai.examInsights.v1'

interface Tally { correct: number; total: number }
/** Per user: question-type tallies keyed by QType. */
type Store = Record<string, Partial<Record<QType, Tally>>>

function load(): Store {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    /* fall through */
  }
  return {}
}

function save(s: Store): void {
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(s)) } catch { /* quota */ }
}

/** A single graded MCQ outcome with its question type. */
export interface TypedOutcome { qtype: QType; correct: boolean }

/** Accumulate one attempt's typed outcomes into the learner's profile. */
export function recordTypeResults(userId: string, outcomes: TypedOutcome[]): void {
  if (outcomes.length === 0) return
  const s = load()
  const u = s[userId] ?? {}
  for (const o of outcomes) {
    const t = u[o.qtype] ?? { correct: 0, total: 0 }
    t.total += 1
    if (o.correct) t.correct += 1
    u[o.qtype] = t
  }
  s[userId] = u
  save(s)
}

export interface TypeAccuracy {
  qtype: QType
  label: string
  correct: number
  total: number
  /** 0–100. */
  accuracy: number
}

/** All tracked question types for a user, with accuracy. */
export function typeAccuracies(userId: string): TypeAccuracy[] {
  const u = load()[userId] ?? {}
  return (Object.keys(u) as QType[]).map((qtype) => {
    const t = u[qtype] as Tally
    return {
      qtype,
      label: QTYPE_LABEL[qtype],
      correct: t.correct,
      total: t.total,
      accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0
    }
  })
}

/**
 * Weakest question types first. Only types attempted at least `minSamples`
 * times qualify (so one unlucky question doesn't dominate). Capped at `limit`.
 */
export function weakTypes(userId: string, minSamples = 3, limit = 4): TypeAccuracy[] {
  return typeAccuracies(userId)
    .filter((t) => t.total >= minSamples && t.accuracy < 80)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit)
}

/** React hook over the insights store, refreshable after a graded attempt. */
export function useExamInsights(userId: string): {
  all: TypeAccuracy[]
  weak: TypeAccuracy[]
  refresh: () => void
} {
  const [tick, setTick] = useState(0)
  const [all, setAll] = useState<TypeAccuracy[]>(() => typeAccuracies(userId))
  const [weak, setWeak] = useState<TypeAccuracy[]>(() => weakTypes(userId))
  useEffect(() => {
    setAll(typeAccuracies(userId))
    setWeak(weakTypes(userId))
  }, [userId, tick])
  return { all, weak, refresh: () => setTick((t) => t + 1) }
}
