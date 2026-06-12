import { describe, it, expect, beforeEach } from 'vitest'
import { streams, type ScheduledStream } from './store'

function input(over: Partial<ScheduledStream> = {}): Omit<ScheduledStream, 'id' | 'createdAt'> {
  return {
    hostId: 'h1',
    title: 'Grammar live Q&A',
    whenISO: '2026-06-20T18:00:00.000Z',
    status: 'scheduled',
    ...over
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('streams.upsert', () => {
  it('creates a new stream with a generated id and createdAt', () => {
    const row = streams.upsert(input())
    expect(row.id).toMatch(/^stream_/)
    expect(row.createdAt).toBeTruthy()
    expect(row.title).toBe('Grammar live Q&A')
    expect(streams.list()).toHaveLength(1)
  })

  it('updates an existing stream in place (no duplicate row)', () => {
    const created = streams.upsert(input())
    const updated = streams.upsert({ ...input({ title: 'Renamed', status: 'done', peakViewers: 42 }), id: created.id })
    expect(updated.id).toBe(created.id)
    expect(updated.createdAt).toBe(created.createdAt) // creation time preserved
    expect(updated.title).toBe('Renamed')
    expect(updated.status).toBe('done')
    expect(updated.peakViewers).toBe(42)
    expect(streams.list()).toHaveLength(1)
  })

  it('persists across reads (round-trips through localStorage)', () => {
    const row = streams.upsert(input())
    expect(streams.get(row.id)?.title).toBe('Grammar live Q&A')
  })
})

describe('streams.list', () => {
  it('filters by hostId when given, returns all otherwise', () => {
    streams.upsert(input({ hostId: 'h1' }))
    streams.upsert(input({ hostId: 'h1', title: 'Second' }))
    streams.upsert(input({ hostId: 'h2', title: 'Other host' }))

    expect(streams.list()).toHaveLength(3)
    expect(streams.list('h1')).toHaveLength(2)
    expect(streams.list('h2').map((s) => s.title)).toEqual(['Other host'])
    expect(streams.list('nobody')).toEqual([])
  })
})

describe('streams.get / streams.remove', () => {
  it('get returns null for an unknown id', () => {
    expect(streams.get('missing')).toBeNull()
  })

  it('remove deletes only the targeted stream', () => {
    const a = streams.upsert(input({ title: 'A' }))
    const b = streams.upsert(input({ title: 'B' }))
    streams.remove(a.id)
    expect(streams.get(a.id)).toBeNull()
    expect(streams.get(b.id)?.title).toBe('B')
    expect(streams.list()).toHaveLength(1)
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('speakai.streams.v1', '{broken')
    expect(streams.list()).toEqual([])
  })
})
