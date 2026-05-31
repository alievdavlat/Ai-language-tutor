/**
 * Dynamic level registry (user feedback 2026-05-31). Levels were hardcoded as
 * A1–C2 in ~18 places (some even dropping C2), so a teacher could not define a
 * custom level like "Pre-beginner" / "Beginner". This is the single editable
 * source: seeded with CEFR A1–C2 but admins/teachers can add custom levels,
 * used by every authoring level picker via <LevelSelect>.
 */
import { useEffect, useState } from 'react'

export interface LevelDef {
  /** Stable code stored on courses/stories/exams (e.g. 'A1' or 'beginner'). */
  code: string
  name: string
  builtIn?: boolean
  /** Sort order. */
  order: number
}

const LS_KEY = 'speakai.levels.v1'

const DEFAULTS: LevelDef[] = [
  { code: 'A1', name: 'A1 · Beginner', builtIn: true, order: 10 },
  { code: 'A2', name: 'A2 · Elementary', builtIn: true, order: 20 },
  { code: 'B1', name: 'B1 · Intermediate', builtIn: true, order: 30 },
  { code: 'B2', name: 'B2 · Upper-Int.', builtIn: true, order: 40 },
  { code: 'C1', name: 'C1 · Advanced', builtIn: true, order: 50 },
  { code: 'C2', name: 'C2 · Proficiency', builtIn: true, order: 60 }
]

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `lvl-${Math.abs(name.length * 7)}`
}

function db(): LevelDef[] {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) return (JSON.parse(raw) as LevelDef[]).sort((a, b) => a.order - b.order)
  } catch {
    /* seed */
  }
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(DEFAULTS)) } catch { /* ignore */ }
  return DEFAULTS
}

function save(list: LevelDef[]): void {
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export const levels = {
  list(): LevelDef[] {
    return db()
  },
  /** Add a custom level by display name. Returns it (or the existing match). */
  add(name: string): LevelDef {
    const clean = name.trim()
    const list = db()
    const code = slug(clean)
    const existing = list.find((l) => l.code === code)
    if (existing) return existing
    const created: LevelDef = { code, name: clean, order: (Math.max(0, ...list.map((l) => l.order)) + 10) }
    save([...list, created])
    return created
  },
  remove(code: string): void {
    save(db().filter((l) => l.code !== code || l.builtIn))
  },
  /** Display name for a stored code (falls back to the code itself). */
  nameOf(code: string): string {
    return db().find((l) => l.code === code)?.name ?? code
  }
}

/** React hook: the level list + add(), refreshable. */
export function useLevels(): { list: LevelDef[]; add: (name: string) => LevelDef; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<LevelDef[]>(() => levels.list())
  useEffect(() => { setList(levels.list()) }, [tick])
  return {
    list,
    add: (name) => { const l = levels.add(name); setTick((t) => t + 1); return l },
    refresh: () => setTick((t) => t + 1)
  }
}
