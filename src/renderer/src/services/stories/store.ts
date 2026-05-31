/**
 * Story store (#A32). localStorage-backed (mirrors services/roleplay & exams),
 * seeded from the built-in STORIES so the curated graded stories stay real +
 * editable, and teachers/admins can author NEW reading/listening stories with
 * comprehension questions.
 */
import { useEffect, useState } from 'react'
import { STORIES, type Story } from '../content/stories'

const LS_KEY = 'speakai.stories.v1'

export interface StoredStory extends Story {
  builtIn?: boolean
  authorId?: string
  createdAt?: string
}

function seed(): StoredStory[] {
  return STORIES.map((s) => ({ ...s, builtIn: true, authorId: 'system' }))
}

function db(): StoredStory[] {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as StoredStory[]
  } catch {
    /* seed */
  }
  const s = seed()
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}

function save(list: StoredStory[]): void {
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export const stories = {
  list(): StoredStory[] {
    return db()
  },
  get(id: string): StoredStory | undefined {
    return db().find((s) => s.id === id) ?? STORIES.find((s) => s.id === id)
  },
  upsert(story: StoredStory): StoredStory {
    const list = db()
    const idx = list.findIndex((s) => s.id === story.id)
    if (idx >= 0) { list[idx] = story; save(list); return story }
    const created = { ...story, createdAt: new Date(0).toISOString() }
    save([created, ...list])
    return created
  },
  remove(id: string): void {
    save(db().filter((s) => s.id !== id))
  }
}

/** Drop-in for the old content/stories getStory — checks the store first. */
export function getStory(id: string): StoredStory | undefined {
  return stories.get(id)
}

/** React hook: full story list, refreshable after edits. */
export function useStories(): { list: StoredStory[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<StoredStory[]>(() => stories.list())
  useEffect(() => { setList(stories.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
