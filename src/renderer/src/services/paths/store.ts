/**
 * Learning-path store (#A1 data layer / #A56 admin CMS). localStorage-backed,
 * sync-readable (mirrors services/exams & services/clips), seeded from the
 * built-in tracks so the Paths page shows real, editable specializations and
 * admins/teachers can author new ones. PathsPage reads through this store.
 */
import { useEffect, useState } from 'react'

export interface LearningPath {
  id: string
  title: string
  subtitle: string
  /** Number of member courses (display). */
  courses: number
  hours: number
  /** Level range label, e.g. "B1 → C1". */
  level: string
  enrolled: number
  rating: number
  cover: string
  capstone: string
  builtIn?: boolean
  authorId?: string
  createdAt?: string
}

const LS_KEY = 'speakai.paths.v1'

const SEED: LearningPath[] = [
  { id: 'ielts-7', title: 'IELTS 7.0 Track', subtitle: '4-course specialization', courses: 4, hours: 28, level: 'B1 → C1', enrolled: 0, rating: 0, cover: 'from-rose-500 to-pink-700', capstone: 'Full IELTS mock exam + Band-7 portfolio review', builtIn: true, authorId: 'system' },
  { id: 'business', title: 'Business English Career', subtitle: 'Negotiations, meetings, emails', courses: 5, hours: 36, level: 'B1 → C1', enrolled: 0, rating: 0, cover: 'from-sky-500 to-blue-700', capstone: 'Stakeholder presentation + business email portfolio', builtIn: true, authorId: 'system' },
  { id: 'travel', title: 'Travel & Survival English', subtitle: 'Restaurant, taxi, hotel, emergencies', courses: 3, hours: 14, level: 'A1 → A2', enrolled: 0, rating: 0, cover: 'from-emerald-500 to-teal-700', capstone: 'Real-life roleplay marathon', builtIn: true, authorId: 'system' },
  { id: 'foundations', title: 'English Foundations', subtitle: 'Build your A1→B1 base in 90 days', courses: 6, hours: 48, level: 'A1 → B1', enrolled: 0, rating: 0, cover: 'from-amber-500 to-orange-700', capstone: 'CEFR placement test + skill diploma', builtIn: true, authorId: 'system' }
]

function db(): LearningPath[] {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as LearningPath[]
  } catch {
    /* seed */
  }
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(SEED)) } catch { /* ignore */ }
  return SEED
}

function save(list: LearningPath[]): void {
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export const paths = {
  list(): LearningPath[] {
    return db()
  },
  get(id: string): LearningPath | undefined {
    return db().find((p) => p.id === id)
  },
  upsert(path: LearningPath): LearningPath {
    const list = db()
    const idx = list.findIndex((p) => p.id === path.id)
    if (idx >= 0) { list[idx] = path; save(list); return path }
    const created = { ...path, createdAt: new Date(0).toISOString() }
    save([created, ...list])
    return created
  },
  remove(id: string): void {
    save(db().filter((p) => p.id !== id))
  }
}

/** React hook: full path list, refreshable after edits. */
export function usePaths(): { list: LearningPath[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<LearningPath[]>(() => paths.list())
  useEffect(() => { setList(paths.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
