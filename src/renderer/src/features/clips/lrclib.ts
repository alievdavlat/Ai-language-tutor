// Real synced lyrics via LRCLIB — a free, no-key, open lyrics API (~millions of
// tracks, public domain DB). https://lrclib.net/docs
//
// For movies/TV/talks LRCLIB usually has no match; those fall back to any
// bundled lines, and ultimately to youtube-transcript-api / a Whisper sidecar
// (server-side — not available in the renderer, tracked as a follow-up).

import type { LyricLine } from './data'

/** Strip "ft./feat. …" and parentheticals so the artist matches LRCLIB better. */
function cleanArtist(artist: string): string {
  return artist
    .replace(/\s*(ft\.?|feat\.?|featuring)\s.*$/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[—-]\s*(clip|scene|intro.*|live|official.*|lyrics?).*$/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
}

/** Parse an LRC string ("[mm:ss.xx] text") into time-stamped lines (seconds). */
export function parseLRC(lrc: string): LyricLine[] {
  const out: LyricLine[] = []
  for (const raw of lrc.split('\n')) {
    const stamps = raw.match(/\[(\d+):(\d+(?:\.\d+)?)\]/g)
    if (!stamps) continue
    const text = raw.replace(/\[(\d+):(\d+(?:\.\d+)?)\]/g, '').trim()
    if (!text) continue // skip metadata / empty timing lines
    for (const st of stamps) {
      const m = st.match(/\[(\d+):(\d+(?:\.\d+)?)\]/)
      if (!m) continue
      const t = parseInt(m[1], 10) * 60 + parseFloat(m[2])
      out.push({ t, text })
    }
  }
  return out.sort((a, b) => a.t - b.t)
}

interface LrclibHit {
  syncedLyrics?: string | null
  plainLyrics?: string | null
}

/**
 * Look up synced lyrics for a track. Returns time-stamped lines, or null when
 * LRCLIB has no synced match (caller falls back to bundled lines).
 */
export async function fetchSyncedLyrics(
  track: string,
  artist: string,
  signal?: AbortSignal
): Promise<LyricLine[] | null> {
  const params = new URLSearchParams({
    track_name: cleanTitle(track),
    artist_name: cleanArtist(artist)
  })
  let res: Response
  try {
    res = await fetch(`https://lrclib.net/api/search?${params.toString()}`, { signal })
  } catch {
    return null
  }
  if (!res.ok) return null
  let hits: LrclibHit[]
  try {
    hits = (await res.json()) as LrclibHit[]
  } catch {
    return null
  }
  if (!Array.isArray(hits)) return null
  const hit = hits.find((h) => h.syncedLyrics && h.syncedLyrics.includes('['))
  if (!hit?.syncedLyrics) return null
  const lines = parseLRC(hit.syncedLyrics)
  return lines.length > 0 ? lines : null
}
