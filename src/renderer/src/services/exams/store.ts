/**
 * Exam/test store (#A30). localStorage-backed (mirrors services/roleplay), seeded
 * from the built-in BANKS so existing IELTS/TOEFL/CEFR/SAT/GMAT mocks are real,
 * editable entries — and admins/teachers can author NEW exams + questions.
 * ExamBank is pure data (scoring lives in banks.ts keyed by `kind`), so it
 * serializes cleanly.
 */
import { useEffect, useState } from 'react'
import { BANKS, type ExamBank } from '../../features/exams/banks'

const LS_KEY = 'speakai.exams.v1'

/** Authoring metadata layered on top of the pure ExamBank shape. */
export interface StoredExam extends ExamBank {
  authorId?: string
  /** Built-in seed (read-only-ish) vs user-authored. */
  builtIn?: boolean
  createdAt?: string
}

function seed(): StoredExam[] {
  return Object.values(BANKS).map((b) => ({ ...b, builtIn: true, authorId: 'system' }))
}

function db(): StoredExam[] {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as StoredExam[]
  } catch {
    /* seed below */
  }
  const s = seed()
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}

function save(list: StoredExam[]): void {
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export const exams = {
  list(): StoredExam[] {
    return db()
  },
  get(id: string): StoredExam | undefined {
    return db().find((e) => e.id === id) ?? (BANKS[id] ? { ...BANKS[id], builtIn: true } : undefined)
  },
  upsert(exam: StoredExam): StoredExam {
    const list = db()
    const idx = list.findIndex((e) => e.id === exam.id)
    if (idx >= 0) { list[idx] = exam; save(list); return exam }
    const created = { ...exam, createdAt: new Date(0).toISOString() }
    save([created, ...list])
    return created
  },
  remove(id: string): void {
    save(db().filter((e) => e.id !== id))
  }
}

/** React hook: full exam list, refreshable after edits. */
export function useExams(): { list: StoredExam[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<StoredExam[]>(() => exams.list())
  useEffect(() => { setList(exams.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
