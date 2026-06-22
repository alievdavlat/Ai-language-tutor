/**
 * Clip store (#A63). localStorage-backed (mirrors services/roleplay, exams,
 * stories), seeded from a curated set so the Clips fill-in-the-blank game has
 * real, editable data instead of a hardcoded `data.ts` catalog. Teachers/admins
 * author NEW clips (YouTube link + synced lyrics + crop) via ClipEditor.
 *
 * The shape mirrors the Supabase `clips` table (migration 0003) so this can sync
 * to the cloud later; for now it stays device-local like the sibling authoring
 * stores. Favorites + per-user "saved" playlist + leaderboard live alongside.
 */
import { useEffect, useState } from 'react'
import { CEFR_ORDER, type CEFRLevel } from '@shared/types'
import { createId } from '../../lib/ids'
import type { Clip, ClipKind, LyricLine, Playlist } from '../../features/clips/data'
import { clipThumb, generatedCover } from '../../features/clips/data'

// v2: seed rebuilt to real, embeddable YouTube videos only (the v1 seed had
// placeholder rows with no youtubeId → empty video player). Bumping the key
// drops the cached mock seed so every install picks up the real catalog.
const CLIPS_KEY = 'speakai.clips.v2'
const PLAYLISTS_KEY = 'speakai.clips.playlists.v2'
const FAV_KEY = 'speakai.clips.fav.v1'

// ─── Seed lyrics (Justin Bieber — Baby) ──────────────────────────────────────

const BABY_LINES: LyricLine[] = [
  { t: 27, text: 'You know you love me, I know you care' },
  { t: 31, text: "Just shout whenever, and I'll be there" },
  { t: 35, text: 'You want my love, you want my heart' },
  { t: 39, text: 'And we will never ever ever be apart' },
  { t: 43, text: 'Are we an item? Girl, quit playing' },
  { t: 47, text: "We're just friends, what are you saying?" },
  { t: 51, text: "Said there's another, and looked right in my eyes" },
  { t: 55, text: 'My first love broke my heart for the first time' }
]

// ─── Seed catalog ─────────────────────────────────────────────────────────────
// Curated starter clips. `builtIn` so the editor flags them as defaults; they
// stay fully editable. Real `playCount`/`createdAt` drive Hot / Recently rails.

function seedClips(): Clip[] {
  // Real, public, embeddable YouTube music videos (each id verified live +
  // embeddable). The card thumbnail is derived from the youtubeId, so no clip
  // ever falls back to a bare gradient. Lyrics are fetched from LRCLIB at play
  // time (baby ships authored lines as a guaranteed fallback).
  const base: Omit<Clip, 'createdAt' | 'playCount' | 'lang' | 'authorId' | 'builtIn' | 'visibility'>[] = [
    { id: 'baby', title: 'Baby', artist: 'Justin Bieber ft. Ludacris', kind: 'song', cover: 'from-sky-500 to-blue-700', youtubeId: 'kffacxfA7G4', plays: '', ago: '', accent: '🇨🇦', level: 'A2', duration: '3:35', genre: 'Pop', lines: BABY_LINES },
    { id: 'shape', title: 'Shape of You', artist: 'Ed Sheeran', kind: 'song', cover: 'from-rose-500 to-pink-700', youtubeId: 'JGwWNGJdvx8', plays: '', ago: '', accent: '🇬🇧', level: 'A2', duration: '3:54', genre: 'Pop' },
    { id: 'perfect', title: 'Perfect', artist: 'Ed Sheeran', kind: 'song', cover: 'from-amber-500 to-orange-700', youtubeId: '2Vv-BfVoq4g', plays: '', ago: '', accent: '🇬🇧', level: 'B1', duration: '4:23', genre: 'Pop' },
    { id: 'uptownfunk', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', kind: 'song', cover: 'from-fuchsia-500 to-purple-700', youtubeId: 'OPf0YbXqDm0', plays: '', ago: '', accent: '🇺🇸', level: 'B1', duration: '4:31', genre: 'Funk' },
    { id: 'hello', title: 'Hello', artist: 'Adele', kind: 'song', cover: 'from-slate-500 to-slate-800', youtubeId: 'YQHsXMglC9A', plays: '', ago: '', accent: '🇬🇧', level: 'B1', duration: '6:07', genre: 'Pop' },
    { id: 'someonelikeyou', title: 'Someone Like You', artist: 'Adele', kind: 'song', cover: 'from-cyan-500 to-blue-700', youtubeId: 'hLQl3WQQoQ0', plays: '', ago: '', accent: '🇬🇧', level: 'B2', duration: '4:45', genre: 'Soul' },
    { id: 'billie', title: 'Billie Jean', artist: 'Michael Jackson', kind: 'song', cover: 'from-indigo-500 to-violet-700', youtubeId: 'Zi_XLOBDo_Y', plays: '', ago: '', accent: '🇺🇸', level: 'B2', duration: '4:54', genre: 'Pop' },
    { id: 'allofme', title: 'All of Me', artist: 'John Legend', kind: 'song', cover: 'from-emerald-500 to-teal-700', youtubeId: '450p7goxZqg', plays: '', ago: '', accent: '🇺🇸', level: 'B1', duration: '4:30', genre: 'Soul' },
    { id: 'countingstars', title: 'Counting Stars', artist: 'OneRepublic', kind: 'song', cover: 'from-orange-500 to-red-700', youtubeId: 'hT_nvWreIhg', plays: '', ago: '', accent: '🇺🇸', level: 'B1', duration: '4:43', genre: 'Rock' },
    { id: 'vivalavida', title: 'Viva la Vida', artist: 'Coldplay', kind: 'song', cover: 'from-blue-500 to-indigo-800', youtubeId: 'dvgZkm1xWPE', plays: '', ago: '', accent: '🇬🇧', level: 'B2', duration: '4:01', genre: 'Rock' }
  ]
  // Deterministic descending createdAt so "Recently added" has a stable order
  // without Date.now() (keeps the seed pure / SSR-safe).
  const epoch = Date.parse('2026-05-01T00:00:00Z')
  return base.map((c, i) => ({
    ...c,
    lang: 'en',
    authorId: 'system',
    builtIn: true,
    visibility: 'public',
    playCount: 0,
    createdAt: new Date(epoch - i * 86_400_000).toISOString()
  }))
}

// ─── Seed playlists (level-gated mini-courses) ───────────────────────────────

function seedPlaylists(): Playlist[] {
  return [
    { id: 'starter', title: 'Easy Singalongs', cover: 'from-pink-500 to-rose-700', dots: ['#10b981', '#10b981', '#f59e0b', '#fb923c'], clipIds: ['shape', 'baby', 'perfect'], minLevel: 'A1', builtIn: true, authorId: 'system' },
    { id: 'soul', title: 'Soul & Heart', cover: 'from-amber-500 to-orange-700', dots: ['#10b981', '#f59e0b', '#fb923c', '#f43f5e'], clipIds: ['allofme', 'someonelikeyou', 'hello'], minLevel: 'A2', builtIn: true, authorId: 'system' },
    { id: 'rock', title: 'Stadium Rock', cover: 'from-blue-500 to-indigo-800', dots: ['#10b981', '#10b981', '#f59e0b', '#fb923c'], clipIds: ['countingstars', 'vivalavida'], minLevel: 'B1', builtIn: true, authorId: 'system' },
    { id: 'legends', title: 'Legends', cover: 'from-violet-500 to-indigo-700', dots: ['#10b981', '#f59e0b', '#fb923c', '#f43f5e'], clipIds: ['billie', 'uptownfunk'], minLevel: 'B2', builtIn: true, authorId: 'system' }
  ]
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function readList<T>(key: string, seedFn: () => T[]): T[] {
  try {
    const raw = window.localStorage?.getItem(key)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    /* fall through to seed */
  }
  const s = seedFn()
  try { window.localStorage?.setItem(key, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}

function writeList<T>(key: string, list: T[]): void {
  try { window.localStorage?.setItem(key, JSON.stringify(list)) } catch { /* quota / unavailable */ }
}

// ─── Genre tiles (derived from the catalog; covers are real clip images) ──────

export interface GenreTile {
  id: string
  label: string
  cover: string
  count: number
}

// ─── Level gating ─────────────────────────────────────────────────────────────

function levelIdx(level: string | undefined): number {
  const i = CEFR_ORDER.indexOf((level as CEFRLevel) ?? 'A1')
  return i < 0 ? 0 : i
}

/** Is a playlist unlocked for a learner at `userLevel`? */
export function playlistUnlocked(playlist: Playlist, userLevel: string | undefined): boolean {
  if (!playlist.minLevel) return true
  return levelIdx(userLevel) >= levelIdx(playlist.minLevel)
}

// ─── Clip store ───────────────────────────────────────────────────────────────

export const clips = {
  list(): Clip[] {
    return readList(CLIPS_KEY, seedClips)
  },
  get(id: string | null): Clip | undefined {
    if (!id) return undefined
    return clips.list().find((c) => c.id === id)
  },
  upsert(input: Omit<Clip, 'id' | 'createdAt'> & { id?: string }): Clip {
    const list = clips.list()
    if (input.id) {
      const idx = list.findIndex((c) => c.id === input.id)
      if (idx >= 0) {
        const updated = { ...list[idx], ...input, id: input.id } as Clip
        list[idx] = updated
        writeList(CLIPS_KEY, list)
        return updated
      }
    }
    const created: Clip = {
      ...input,
      id: input.id ?? createId('clip'),
      playCount: input.playCount ?? 0,
      createdAt: new Date(0).toISOString()
    }
    writeList(CLIPS_KEY, [created, ...list])
    return created
  },
  remove(id: string): void {
    writeList(CLIPS_KEY, clips.list().filter((c) => c.id !== id))
    // also drop it from any playlist
    const pls = playlists.list().map((p) => ({ ...p, clipIds: p.clipIds.filter((cid) => cid !== id) }))
    writeList(PLAYLISTS_KEY, pls)
  },
  /** Record that the learner started this clip — feeds Hot + "your activity". */
  recordPlay(id: string, nowIso: string): void {
    const list = clips.list()
    const idx = list.findIndex((c) => c.id === id)
    if (idx < 0) return
    list[idx] = { ...list[idx], playCount: (list[idx].playCount ?? 0) + 1, lastPlayedAt: nowIso }
    writeList(CLIPS_KEY, list)
  }
}

/** Drop-in for the old data.ts findClip — falls back to the first clip. */
export function findClip(id: string | null): Clip {
  const list = clips.list()
  return list.find((c) => c.id === id) ?? list[0]
}

export function clipsByIds(ids: string[]): Clip[] {
  const list = clips.list()
  return ids.map((id) => list.find((c) => c.id === id)).filter((c): c is Clip => Boolean(c))
}

/** A real cover image for a playlist — its first clip's artwork, never a gradient. */
export function playlistCover(playlist: Playlist): string {
  const first = clipsByIds(playlist.clipIds)[0]
  return first ? clipThumb(first) : generatedCover(playlist.id || playlist.title)
}

/** Newest first (Recently added). */
export function recentClips(limit = 8): Clip[] {
  return [...clips.list()].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, limit)
}

/** Most-played + most-recently-played (Hot right now). */
export function hotClips(limit = 8): Clip[] {
  return [...clips.list()]
    .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0) || (b.lastPlayedAt ?? '').localeCompare(a.lastPlayedAt ?? ''))
    .slice(0, limit)
}

/** Featured = a stable curated slice (builtIn first, then newest). */
export function featuredClips(limit = 8): Clip[] {
  const list = clips.list()
  const ordered = [...list].sort((a, b) => Number(b.builtIn ?? false) - Number(a.builtIn ?? false) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  return ordered.slice(0, limit)
}

export function searchClips(query: string): Clip[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return clips.list().filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.artist.toLowerCase().includes(q) ||
      (c.genre ?? '').toLowerCase().includes(q)
  )
}

export function clipsByGenre(genre: string): Clip[] {
  return clips.list().filter((c) => (c.genre ?? '').toLowerCase() === genre.toLowerCase())
}

export function clipsByKind(kind: ClipKind): Clip[] {
  return clips.list().filter((c) => c.kind === kind)
}

/** Distinct genres present in the catalog, each tile covered by a real clip image. */
export function genreTiles(): GenreTile[] {
  const counts = new Map<string, number>()
  const sample = new Map<string, Clip>()
  for (const c of clips.list()) {
    if (!c.genre) continue
    counts.set(c.genre, (counts.get(c.genre) ?? 0) + 1)
    if (!sample.has(c.genre)) sample.set(c.genre, c)
  }
  return [...counts.entries()].map(([label, count]) => ({
    id: label.toLowerCase(),
    label,
    count,
    // A real picture from a clip in this genre — never a gradient.
    cover: clipThumb(sample.get(label) ?? { id: label, title: label })
  }))
}

// ─── Playlist store ───────────────────────────────────────────────────────────

export const playlists = {
  list(): Playlist[] {
    return readList(PLAYLISTS_KEY, seedPlaylists)
  },
  get(id: string): Playlist | undefined {
    return playlists.list().find((p) => p.id === id)
  },
  upsert(input: Omit<Playlist, 'id'> & { id?: string }): Playlist {
    const list = playlists.list()
    if (input.id) {
      const idx = list.findIndex((p) => p.id === input.id)
      if (idx >= 0) {
        const updated = { ...list[idx], ...input, id: input.id } as Playlist
        list[idx] = updated
        writeList(PLAYLISTS_KEY, list)
        return updated
      }
    }
    const created: Playlist = { ...input, id: input.id ?? createId('pl'), dots: input.dots ?? ['#10b981', '#f59e0b', '#fb923c', '#f43f5e'] }
    writeList(PLAYLISTS_KEY, [created, ...list])
    return created
  },
  remove(id: string): void {
    writeList(PLAYLISTS_KEY, playlists.list().filter((p) => p.id !== id))
  },
  /** Add a clip to a playlist (no dupes). Returns the updated playlist. */
  addClip(playlistId: string, clipId: string): Playlist | undefined {
    const list = playlists.list()
    const idx = list.findIndex((p) => p.id === playlistId)
    if (idx < 0) return undefined
    if (!list[idx].clipIds.includes(clipId)) {
      list[idx] = { ...list[idx], clipIds: [...list[idx].clipIds, clipId] }
      writeList(PLAYLISTS_KEY, list)
    }
    return list[idx]
  },
  removeClip(playlistId: string, clipId: string): void {
    const list = playlists.list()
    const idx = list.findIndex((p) => p.id === playlistId)
    if (idx < 0) return
    list[idx] = { ...list[idx], clipIds: list[idx].clipIds.filter((c) => c !== clipId) }
    writeList(PLAYLISTS_KEY, list)
  },
  /** The learner's personal "Saved clips" playlist, created on first save. */
  ensureSaved(): Playlist {
    const existing = playlists.list().find((p) => p.id === 'saved')
    if (existing) return existing
    return playlists.upsert({ id: 'saved', title: 'Saved clips', cover: 'from-emerald-500 to-teal-700', dots: ['#10b981'], clipIds: [], authorId: 'me' })
  }
}

// ─── Favorites (per-device) ─────────────────────────────────────────────────

function readFav(): string[] {
  try {
    const raw = window.localStorage?.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    /* ignore */
  }
  return []
}

export const favorites = {
  list(): string[] {
    return readFav()
  },
  has(id: string): boolean {
    return readFav().includes(id)
  },
  toggle(id: string): boolean {
    const cur = readFav()
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    try { window.localStorage?.setItem(FAV_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    return next.includes(id)
  }
}

// ─── React hooks ────────────────────────────────────────────────────────────

/** Full clip list, refreshable after edits. */
export function useClips(): { list: Clip[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<Clip[]>(() => clips.list())
  useEffect(() => { setList(clips.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}

/** Full playlist list, refreshable after edits. */
export function usePlaylists(): { list: Playlist[]; refresh: () => void } {
  const [tick, setTick] = useState(0)
  const [list, setList] = useState<Playlist[]>(() => playlists.list())
  useEffect(() => { setList(playlists.list()) }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}

/** Favorite-clip ids + a toggle that re-renders. */
export function useFavorites(): { ids: string[]; toggle: (id: string) => void; has: (id: string) => boolean } {
  const [ids, setIds] = useState<string[]>(() => favorites.list())
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => {
      favorites.toggle(id)
      setIds(favorites.list())
    }
  }
}
