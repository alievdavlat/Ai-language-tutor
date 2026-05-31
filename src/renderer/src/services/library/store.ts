/**
 * Library store — user-uploadable books (PDF), videos and audio, plus the
 * save/like sets that span library items, courses and videos.
 *
 * localStorage today; swaps to Supabase Storage + a `library` table later.
 * The seed is default content the owner can delete or replace — no page
 * hardcodes its own list anymore.
 */
import type { ID, LibraryItem, LibraryKind } from '@shared/types'
import { backend } from '../backend/useBackend'
import { checkDuplicate, findClusters, type DupCluster, type DupResult } from '../dedup'

const LS_KEY = 'speakai.library.v1'
const newId = (p: string): ID => `${p}_${Math.random().toString(36).slice(2, 10)}`
const now = (): string => new Date().toISOString()
const me = (): ID => backend.currentUserId() ?? 'u_emma'

interface LibraryDb {
  items: LibraryItem[]
  saves: { userId: ID; refId: ID }[]
  likes: { userId: ID; refId: ID }[]
}

function seed(): LibraryItem[] {
  const t = '2026-05-01T00:00:00.000Z'
  return [
    {
      id: 'lib_book_grammar', ownerId: 'u_emma', kind: 'book', title: 'English Grammar — Quick Reference',
      author: 'SpeakAI', description: 'A multi-page reference you can read page by page, with read-along audio.', level: 'A2', language: 'en',
      thumbnailUrl: 'https://picsum.photos/seed/grammar-book/800/450',
      pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', pageCount: 14,
      fullAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', createdAt: t
    },
    {
      id: 'lib_vid_grit', ownerId: 'u_emma', kind: 'video', title: 'Grit: The Power of Passion and Perseverance',
      author: 'Angela Lee Duckworth', level: 'B2', language: 'en', youtubeId: 'H14bBuluwB8',
      thumbnailUrl: 'https://i.ytimg.com/vi/H14bBuluwB8/hqdefault.jpg', createdAt: t
    },
    {
      id: 'lib_vid_vuln', ownerId: 'u_emma', kind: 'video', title: 'The Power of Vulnerability',
      author: 'Brené Brown', level: 'C1', language: 'en', youtubeId: 'iCvmsMzlF7o',
      thumbnailUrl: 'https://i.ytimg.com/vi/iCvmsMzlF7o/hqdefault.jpg', createdAt: t
    },
    {
      id: 'lib_aud_smalltalk', ownerId: 'u_emma', kind: 'audio', title: 'Everyday English — small talk',
      author: 'SpeakAI Audio', level: 'A2', language: 'en', durationLabel: '3:00',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', createdAt: t
    },
    {
      id: 'lib_aud_travel', ownerId: 'u_emma', kind: 'audio', title: 'Travel phrases you’ll actually use',
      author: 'SpeakAI Audio', level: 'A2', language: 'en', durationLabel: '3:00',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', createdAt: t
    }
  ]
}

function emptyDb(): LibraryDb {
  return { items: seed(), saves: [], likes: [] }
}

let cache: LibraryDb | null = null
function db(): LibraryDb {
  if (cache) return cache
  if (typeof window === 'undefined' || !window.localStorage) { cache = emptyDb(); return cache }
  const raw = window.localStorage.getItem(LS_KEY)
  if (!raw) { cache = emptyDb(); persist(); return cache }
  try {
    const parsed = JSON.parse(raw) as Partial<LibraryDb>
    cache = { ...emptyDb(), ...parsed } as LibraryDb
    // Migration: always refresh seed items to the latest content (new PDF,
    // thumbnails) while preserving anything the user added.
    const seedItems = seed()
    const seedIds = new Set(seedItems.map((s) => s.id))
    const userItems = (cache.items ?? []).filter((i) => !seedIds.has(i.id))
    cache.items = [...seedItems, ...userItems]
  } catch { cache = emptyDb() }
  return cache
}
function persist(): void {
  if (cache && typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(cache)) } catch { /* quota */ }
  }
}

export const library = {
  async list(
    kind?: LibraryKind,
    language?: string,
    page?: { limit?: number; offset?: number }
  ): Promise<LibraryItem[]> {
    let items = [...db().items]
    if (kind) items = items.filter((i) => i.kind === kind)
    if (language) items = items.filter((i) => i.language === language)
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    // Pagination (scaling — #A64). No window ⇒ full list (backward-compatible).
    const offset = page?.offset && page.offset > 0 ? page.offset : 0
    if (offset === 0 && page?.limit == null) return items
    return page?.limit != null ? items.slice(offset, offset + page.limit) : items.slice(offset)
  },
  async get(id: ID): Promise<LibraryItem | null> {
    return db().items.find((i) => i.id === id) ?? null
  },
  async upsert(input: Omit<LibraryItem, 'id' | 'ownerId' | 'createdAt'> & { id?: ID }): Promise<LibraryItem> {
    const existing = input.id ? db().items.find((i) => i.id === input.id) : undefined
    const item: LibraryItem = {
      ...(existing ?? { id: newId('lib'), ownerId: me(), createdAt: now() }),
      ...input,
      id: existing?.id ?? input.id ?? newId('lib'),
      ownerId: existing?.ownerId ?? me(),
      createdAt: existing?.createdAt ?? now()
    }
    const idx = db().items.findIndex((i) => i.id === item.id)
    if (idx < 0) db().items.unshift(item)
    else db().items[idx] = item
    persist()
    return item
  },
  async remove(id: ID): Promise<void> {
    db().items = db().items.filter((i) => i.id !== id)
    persist()
  },

  // ── Duplicate detection (#A65) ──────────────────────────────────────────
  /**
   * Check a candidate upload against the library. `exact` = same content key
   * (block + offer the original); `near` = similar title/author (soft warn).
   */
  async findDuplicate(c: {
    contentHash?: string
    title: string
    author?: string
    kind?: LibraryKind
    excludeId?: ID
  }): Promise<DupResult<LibraryItem>> {
    const pool = db().items.filter((i) => (c.kind ? i.kind === c.kind : true))
    return checkDuplicate(
      { contentHash: c.contentHash, title: c.title, author: c.author, excludeId: c.excludeId },
      pool,
      {
        getId: (i) => i.id,
        getKey: (i) => i.contentHash,
        getTitle: (i) => i.title,
        getAuthor: (i) => i.author
      }
    )
  },
  /** All duplicate clusters across the library (for the admin merge tool). */
  findDuplicateClusters(): DupCluster<LibraryItem>[] {
    return findClusters(db().items, {
      getId: (i) => i.id,
      getKey: (i) => i.contentHash,
      getTitle: (i) => i.title
    })
  },
  /**
   * Merge duplicates: keep `keepId`, delete `dropIds`, and re-point their
   * save/like references onto the survivor so nobody loses a bookmark.
   */
  async mergeInto(keepId: ID, dropIds: ID[]): Promise<void> {
    const drop = new Set(dropIds.filter((id) => id !== keepId))
    if (drop.size === 0) return
    const repoint = <T extends { refId: ID }>(rows: T[]): T[] => {
      const seen = new Set<string>()
      const out: T[] = []
      for (const r of rows) {
        const refId = drop.has(r.refId) ? keepId : r.refId
        const key = `${(r as unknown as { userId: ID }).userId}|${refId}`
        if (seen.has(key)) continue // collapse dup bookmarks after repoint
        seen.add(key)
        out.push({ ...r, refId })
      }
      return out
    }
    db().saves = repoint(db().saves)
    db().likes = repoint(db().likes)
    db().items = db().items.filter((i) => !drop.has(i.id))
    persist()
  },

  // ── Save / like (works for any ref: library item, course, video) ────────
  async toggleSave(refId: ID, userId = me()): Promise<boolean> {
    const i = db().saves.findIndex((s) => s.userId === userId && s.refId === refId)
    if (i >= 0) { db().saves.splice(i, 1); persist(); return false }
    db().saves.push({ userId, refId }); persist(); return true
  },
  async toggleLike(refId: ID, userId = me()): Promise<boolean> {
    const i = db().likes.findIndex((l) => l.userId === userId && l.refId === refId)
    if (i >= 0) { db().likes.splice(i, 1); persist(); return false }
    db().likes.push({ userId, refId }); persist(); return true
  },
  isSaved(refId: ID, userId = me()): boolean {
    return db().saves.some((s) => s.userId === userId && s.refId === refId)
  },
  isLiked(refId: ID, userId = me()): boolean {
    return db().likes.some((l) => l.userId === userId && l.refId === refId)
  },
  async listSaved(userId = me()): Promise<LibraryItem[]> {
    const ids = new Set(db().saves.filter((s) => s.userId === userId).map((s) => s.refId))
    return db().items.filter((i) => ids.has(i.id))
  }
}

export type Library = typeof library
