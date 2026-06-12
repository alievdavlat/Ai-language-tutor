/**
 * Teacher scheduled-streams store (#A22) — same localStorage authoring-store
 * pattern as roleplay/exams/stories. Persists the teacher's planned and past
 * live streams so the Live host page shows REAL rows, not inline mock arrays.
 */
import { useEffect, useState } from 'react'

export interface ScheduledStream {
  id: string
  hostId: string
  title: string
  /** ISO date-time of the planned start. */
  whenISO: string
  description?: string
  status: 'scheduled' | 'done' | 'cancelled'
  /** Filled in after the stream is marked done. */
  peakViewers?: number
  avgViewers?: number
  durationMin?: number
  createdAt: string
}

const KEY = 'speakai.streams.v1'

function read(): ScheduledStream[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ScheduledStream[]) : []
  } catch {
    return []
  }
}

function write(list: ScheduledStream[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota — ignore */
  }
}

export const streams = {
  list(hostId?: string): ScheduledStream[] {
    const all = read()
    return hostId ? all.filter((s) => s.hostId === hostId) : all
  },
  get(id: string): ScheduledStream | null {
    return read().find((s) => s.id === id) ?? null
  },
  upsert(input: Omit<ScheduledStream, 'id' | 'createdAt'> & { id?: string }): ScheduledStream {
    const all = read()
    const existing = input.id ? all.find((s) => s.id === input.id) : null
    const row: ScheduledStream = existing
      ? { ...existing, ...input, id: existing.id }
      : {
          ...input,
          id: input.id ?? `stream_${Math.random().toString(36).slice(2, 10)}`,
          createdAt: new Date().toISOString()
        }
    const next = existing ? all.map((s) => (s.id === row.id ? row : s)) : [...all, row]
    write(next)
    return row
  },
  remove(id: string): void {
    write(read().filter((s) => s.id !== id))
  }
}

export function useStreams(hostId?: string | null): { list: ScheduledStream[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<ScheduledStream[]>(() => streams.list(hostId ?? undefined))
  useEffect(() => {
    setList(streams.list(hostId ?? undefined))
  }, [hostId, tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
