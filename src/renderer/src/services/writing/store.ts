/**
 * Writing-task store (#A33). localStorage-backed (mirrors services/stories &
 * exams), seeded from a small set of built-in prompts so the Writing Coach has
 * real, pickable tasks on day one — and teachers/admins can author NEW writing
 * tasks (essay / letter / report / etc.) with a target level, an optional
 * word-count target and an optional sample answer.
 *
 * Swap target: when Supabase lands, replace the body of each method with a
 * query — the method names are list/get/upsert/remove on purpose.
 */
import { useEffect, useState } from 'react'
import { createId } from '../../lib/ids'

const LS_KEY = 'speakai.writing.v1'

export type WritingTaskType = 'essay' | 'letter' | 'report' | 'review' | 'story' | 'email' | 'other'

export interface WritingTask {
  id: string
  title: string
  /** The task the learner is asked to write to. */
  prompt: string
  type: WritingTaskType
  /** Target CEFR/custom level code (from the level registry). */
  level: string
  /** Optional minimum word target. */
  targetWords?: number
  /** Optional model/sample answer revealed after the learner drafts. */
  sampleAnswer?: string
  builtIn?: boolean
  authorId?: string
  createdAt?: string
}

/** Built-in starter tasks — kept real + editable like the other stores. */
const SEED: Omit<WritingTask, 'builtIn' | 'authorId'>[] = [
  {
    id: 'wt_opinion_remote',
    title: 'Opinion essay — remote work',
    type: 'essay',
    level: 'B1',
    targetWords: 200,
    prompt:
      'Some people believe working from home is better than working in an office. Do you agree or disagree? Give reasons and examples from your own experience.'
  },
  {
    id: 'wt_complaint_letter',
    title: 'Formal letter — a complaint',
    type: 'letter',
    level: 'B2',
    targetWords: 180,
    prompt:
      'You recently bought a product online that arrived damaged. Write a formal letter to the company. Explain what happened, how you feel about it, and what you would like them to do.'
  },
  {
    id: 'wt_event_report',
    title: 'Report — a community event',
    type: 'report',
    level: 'B2',
    targetWords: 220,
    prompt:
      'Write a report for your local council about a recent community event. Describe what happened, how many people attended, what went well, and one thing that could be improved.'
  },
  {
    id: 'wt_story_unexpected',
    title: 'Short story — an unexpected visitor',
    type: 'story',
    level: 'A2',
    targetWords: 150,
    prompt:
      'Write a short story that begins: "There was a knock at the door. I was not expecting anyone…" Use past tenses and describe how you felt.'
  }
]

function seed(): WritingTask[] {
  return SEED.map((t) => ({ ...t, builtIn: true, authorId: 'system' }))
}

function db(): WritingTask[] {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as WritingTask[]
  } catch {
    /* seed below */
  }
  const s = seed()
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}

function save(list: WritingTask[]): void {
  try { window.localStorage?.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export const writing = {
  list(): WritingTask[] {
    return db()
  },
  get(id: string): WritingTask | undefined {
    return db().find((t) => t.id === id)
  },
  upsert(task: WritingTask): WritingTask {
    const list = db()
    const idx = list.findIndex((t) => t.id === task.id)
    if (idx >= 0) { list[idx] = task; save(list); return task }
    const created = { ...task, id: task.id || createId('wt'), createdAt: new Date().toISOString() }
    save([created, ...list])
    return created
  },
  remove(id: string): void {
    save(db().filter((t) => t.id !== id))
  }
}

/** React hook: full writing-task list, refreshable after edits. */
export function useWritingTasks(): { list: WritingTask[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<WritingTask[]>(() => writing.list())
  useEffect(() => { setList(writing.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
