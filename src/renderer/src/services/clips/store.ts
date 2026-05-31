/**
 * Clip catalog store (#A63 data layer / #A56 admin CMS). localStorage-backed,
 * sync-readable (mirrors services/exams & services/levels), seeded from the
 * built-in CLIPS so the existing fill-in-the-blank clips stay real + editable,
 * and admins/teachers can author NEW clips. `findClip` / `clipsByIds` in
 * features/clips/data.ts read through this store, so admin edits are reflected
 * everywhere a clip is played.
 */
import { useEffect, useState } from 'react'
import { CLIPS, type Clip } from '../../features/clips/data'

const LS_KEY = 'speakai.clips.v1'

export interface StoredClip extends Clip {
  builtIn?: boolean
  authorId?: string
  createdAt?: string
}

function seed(): StoredClip[] {
  return CLIPS.map((c) => ({ ...c, builtIn: true, authorId: 'system' }))
}

function db(): StoredClip[] {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as StoredClip[]
      // Keep built-in seed fresh (new fields/lyrics) while preserving authored clips.
      const seeded = seed()
      const seedIds = new Set(seeded.map((s) => s.id))
      const authored = stored.filter((c) => !seedIds.has(c.id))
      return [...seeded, ...authored]
    }
  } catch {
    /* seed */
  }
  const s = seed()
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}

function save(list: StoredClip[]): void {
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export const clips = {
  list(): StoredClip[] {
    return db()
  },
  get(id: string): StoredClip | undefined {
    return db().find((c) => c.id === id)
  },
  upsert(clip: StoredClip): StoredClip {
    const list = db()
    const idx = list.findIndex((c) => c.id === clip.id)
    if (idx >= 0) { list[idx] = clip; save(list); return clip }
    const created = { ...clip, createdAt: new Date(0).toISOString() }
    save([created, ...list])
    return created
  },
  remove(id: string): void {
    save(db().filter((c) => c.id !== id))
  }
}

/** React hook: full clip list, refreshable after edits. */
export function useClips(): { list: StoredClip[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<StoredClip[]>(() => clips.list())
  useEffect(() => { setList(clips.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
