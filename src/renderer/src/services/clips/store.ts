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

const CLIPS_KEY = 'speakai.clips.v1'
const PLAYLISTS_KEY = 'speakai.clips.playlists.v1'
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
  const base: Omit<Clip, 'createdAt' | 'playCount' | 'lang' | 'authorId' | 'builtIn' | 'visibility'>[] = [
    { id: 'baby', title: 'Baby', artist: 'Justin Bieber ft. Ludacris', kind: 'song', cover: 'from-sky-500 to-blue-700', youtubeId: 'kffacxfA7G4', plays: '396K', ago: '14 years ago', accent: '🇨🇦', level: 'A2', duration: '3:35', genre: 'Pop', lines: BABY_LINES },
    { id: 'dinner', title: 'Dinner For One', artist: 'Mollie Elizabeth', kind: 'song', cover: 'from-pink-500 to-rose-700', youtubeId: '', plays: '579', ago: '2 days ago', accent: '🇺🇸', level: 'B1', duration: '3:12', genre: 'Pop' },
    { id: 'dance', title: 'Dance All Nite', artist: 'Anja', kind: 'song', cover: 'from-fuchsia-500 to-purple-700', youtubeId: '', plays: '1.7K', ago: '2 days ago', accent: '🇬🇧', level: 'A2', duration: '2:58', genre: 'Pop' },
    { id: 'perfect', title: 'Perfect', artist: 'Ed Sheeran', kind: 'song', cover: 'from-amber-500 to-orange-700', youtubeId: '', plays: '8.2M', ago: '9 years ago', accent: '🇬🇧', level: 'B1', duration: '4:23', genre: 'Pop' },
    { id: 'billie', title: 'Billie Jean', artist: 'Michael Jackson', kind: 'song', cover: 'from-indigo-500 to-violet-700', youtubeId: '', plays: '234K', ago: '14 years ago', accent: '🇺🇸', level: 'B2', duration: '4:54', genre: 'Pop' },
    { id: 'devil', title: 'The Devil Wears Prada — clip', artist: 'Movie scene', kind: 'movie', cover: 'from-slate-500 to-slate-800', youtubeId: '', plays: '92K', ago: '1 month ago', accent: '🇺🇸', level: 'B2', duration: '2:10', genre: 'Drama' },
    { id: 'friends', title: 'Friends — intro scene', artist: 'TV scene', kind: 'tv', cover: 'from-orange-500 to-red-700', youtubeId: '', plays: '120K', ago: '3 weeks ago', accent: '🇺🇸', level: 'B1', duration: '1:45', genre: 'Comedy' },
    { id: 'talk-grit', title: 'The power of grit', artist: 'Inspirational talk', kind: 'talk', cover: 'from-red-500 to-rose-800', youtubeId: '', plays: '3M', ago: '5 years ago', accent: '🇺🇸', level: 'C1', duration: '6:12', genre: 'Talks' }
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
    { id: 'queens', title: 'Queens of Music', cover: 'from-pink-500 to-rose-700', dots: ['#10b981', '#10b981', '#f59e0b', '#fb923c'], clipIds: ['baby', 'dance', 'dinner'], minLevel: 'A1', builtIn: true, authorId: 'system' },
    { id: 'theme', title: 'Theme Songs', cover: 'from-amber-500 to-orange-700', dots: ['#10b981', '#f59e0b', '#fb923c', '#f43f5e'], clipIds: ['friends', 'perfect'], minLevel: 'A2', builtIn: true, authorId: 'system' },
    { id: 'fearless', title: 'Fearless Femme', cover: 'from-fuchsia-500 to-purple-700', dots: ['#10b981', '#10b981', '#f59e0b', '#fb923c'], clipIds: ['billie', 'perfect', 'dance'], minLevel: 'B1', builtIn: true, authorId: 'system' },
    { id: 'essence', title: 'Cinema & Talks', cover: 'from-violet-500 to-indigo-700', dots: ['#10b981', '#f59e0b', '#fb923c', '#f43f5e'], clipIds: ['devil', 'talk-grit'], minLevel: 'B2', builtIn: true, authorId: 'system' }
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

// ─── Genre tiles (derived from the catalog + a gradient map) ──────────────────

const GENRE_GRADIENT: Record<string, string> = {
  Pop: 'from-amber-500 to-orange-600',
  Rock: 'from-sky-500 to-blue-700',
  Drama: 'from-slate-600 to-slate-900',
  Comedy: 'from-orange-500 to-red-700',
  Talks: 'from-red-500 to-rose-800',
  Hip_hop: 'from-fuchsia-500 to-purple-700'
}
const GENRE_FALLBACK = ['from-indigo-500 to-blue-900', 'from-emerald-500 to-teal-700', 'from-cyan-500 to-blue-700']

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

/** Distinct genres present in the catalog, as tiles with a gradient + count. */
export function genreTiles(): GenreTile[] {
  const counts = new Map<string, number>()
  for (const c of clips.list()) {
    if (!c.genre) continue
    counts.set(c.genre, (counts.get(c.genre) ?? 0) + 1)
  }
  let fb = 0
  return [...counts.entries()].map(([label, count]) => ({
    id: label.toLowerCase(),
    label,
    count,
    cover: GENRE_GRADIENT[label] ?? GENRE_FALLBACK[fb++ % GENRE_FALLBACK.length]
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
