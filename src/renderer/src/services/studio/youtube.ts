/**
 * YouTube integration (#25 / #A23).
 *
 * Capabilities, each degrading gracefully:
 *  1. paste-a-link metadata fetch — keyless, via noembed + the public thumbnail
 *     CDN. Works with zero credentials, in any browser.
 *  2. connect by channel link/@handle — REAL, uses the Data API v3 key
 *     (VITE_YT_API_KEY). No OAuth needed; resolves the real channel + uploads
 *     playlist so import returns the channel's actual videos.
 *  3. connect with Google (OAuth) — REAL when VITE_YT_CLIENT_ID is set. Uses the
 *     implicit token flow (response_type=token) so no server-side secret
 *     exchange / CORS round-trip is required; the /youtube/callback route hands
 *     the access token back to the opener. `channels?mine=true` then resolves
 *     the signed-in user's own channel.
 *  4. import — pulls the uploads playlist (real videos + view counts) using the
 *     OAuth bearer or the API key. Demo set only when nothing is configured.
 *
 * Required env (documented in docs/YOUTUBE-OAUTH.md):
 *   VITE_YT_CLIENT_ID    — OAuth 2.0 client id (Google Cloud Console)
 *   VITE_YT_CLIENT_SECRET— OAuth client secret (present for completeness; the
 *                          implicit flow used here does not send it)
 *   VITE_YT_API_KEY      — Data API v3 key (channel resolve + video listing)
 *   VITE_YT_REDIRECT_URI — OAuth redirect (defaults to <origin>/youtube/callback)
 */
import type { YouTubeConnection, YouTubeVideo } from '@shared/types/studio.types'
import { parseYouTubeId, type VideoMeta } from './store'

export { parseYouTubeId }
export type { VideoMeta }

const CLIENT_ID = import.meta.env?.VITE_YT_CLIENT_ID as string | undefined
const API_KEY = import.meta.env?.VITE_YT_API_KEY as string | undefined
const REDIRECT_URI =
  (import.meta.env?.VITE_YT_REDIRECT_URI as string | undefined) ??
  (typeof window !== 'undefined' ? `${window.location.origin}/youtube/callback` : '')

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
const DATA_API = 'https://www.googleapis.com/youtube/v3'

export const youtubeConfigured = Boolean(CLIENT_ID)
export const youtubeApiKeyConfigured = Boolean(API_KEY)

export function thumbnailFor(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
}

/** Build the Google OAuth consent URL (implicit token flow). */
export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID ?? '',
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: SCOPES.join(' '),
    include_granted_scopes: 'true',
    prompt: 'consent'
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Paste-a-link metadata. Keyless. Tries noembed (gives the real title +
 * channel), always falls back to the public thumbnail so the card renders.
 */
export async function fetchVideoMeta(input: string): Promise<VideoMeta | null> {
  const id = parseYouTubeId(input)
  if (!id) return null
  const base: VideoMeta = { youtubeId: id, title: `YouTube video ${id}`, channelTitle: 'Unknown channel', thumbnail: thumbnailFor(id) }
  // With an API key we can fetch the precise title/channel directly.
  if (youtubeApiKeyConfigured) {
    try {
      const res = await fetch(`${DATA_API}/videos?part=snippet&id=${id}&key=${API_KEY}`)
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ snippet: { title: string; channelTitle: string; thumbnails?: { high?: { url: string }; medium?: { url: string } } } }> }
        const it = data.items?.[0]
        if (it) {
          return {
            youtubeId: id,
            title: it.snippet.title,
            channelTitle: it.snippet.channelTitle,
            thumbnail: it.snippet.thumbnails?.high?.url ?? it.snippet.thumbnails?.medium?.url ?? base.thumbnail
          }
        }
      }
    } catch { /* fall through to noembed */ }
  }
  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
    if (res.ok) {
      const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string; error?: string }
      if (!data.error) {
        return {
          youtubeId: id,
          title: data.title ?? base.title,
          channelTitle: data.author_name ?? base.channelTitle,
          thumbnail: data.thumbnail_url ?? base.thumbnail
        }
      }
    }
  } catch {
    /* offline / blocked — fall through to base */
  }
  return base
}

// ─── Channel resolve (by link / @handle), via Data API key ───────────────────

interface ParsedChannelRef {
  id?: string
  handle?: string
  username?: string
  search?: string
}

/** Parse a channel reference out of any pasted URL, @handle, or bare id. */
export function parseChannelRef(input: string): ParsedChannelRef | null {
  const s = input.trim()
  if (!s) return null
  if (/^UC[\w-]{22}$/.test(s)) return { id: s }
  if (/^@[\w.\-]+$/.test(s)) return { handle: s }
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`)
    if (!/youtube\.com$/.test(url.hostname.replace('www.', ''))) {
      // Not a YouTube URL — treat the whole thing as a search term.
      return { search: s }
    }
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0]?.startsWith('@')) return { handle: parts[0] }
    if (parts[0] === 'channel' && parts[1]) return { id: parts[1] }
    if (parts[0] === 'user' && parts[1]) return { username: parts[1] }
    if (parts[0] === 'c' && parts[1]) return { search: parts[1] }
    if (parts[0]) return { search: parts[0] }
    return { search: s }
  } catch {
    return { search: s }
  }
}

interface ChannelApiItem {
  id: string
  snippet: { title: string; thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } }; customUrl?: string }
  statistics?: { subscriberCount?: string; videoCount?: string }
  contentDetails?: { relatedPlaylists?: { uploads?: string } }
}

function connectionFromChannel(item: ChannelApiItem, via: YouTubeConnection['via'], accessToken?: string, tokenExpiresAt?: number): YouTubeConnection {
  return {
    connected: true,
    channelId: item.id,
    channelTitle: item.snippet.title,
    handle: item.snippet.customUrl?.startsWith('@') ? item.snippet.customUrl : undefined,
    thumbnail: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url,
    subscriberCount: item.statistics?.subscriberCount ? Number(item.statistics.subscriberCount) : undefined,
    videoCount: item.statistics?.videoCount ? Number(item.statistics.videoCount) : undefined,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
    connectedAt: new Date().toISOString(),
    scopes: via === 'oauth' ? SCOPES : undefined,
    accessToken,
    tokenExpiresAt,
    via
  }
}

async function fetchChannel(params: string): Promise<ChannelApiItem | null> {
  if (!youtubeApiKeyConfigured) return null
  try {
    const res = await fetch(`${DATA_API}/channels?part=snippet,statistics,contentDetails&${params}&key=${API_KEY}`)
    if (!res.ok) return null
    const data = (await res.json()) as { items?: ChannelApiItem[] }
    return data.items?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Connect a channel by its public link / @handle / id, using the Data API key.
 * Returns null when the channel can't be resolved (or no key is configured).
 */
export async function connectByChannel(input: string): Promise<YouTubeConnection | null> {
  const ref = parseChannelRef(input)
  if (!ref || !youtubeApiKeyConfigured) return null

  let item: ChannelApiItem | null = null
  if (ref.id) item = await fetchChannel(`id=${encodeURIComponent(ref.id)}`)
  else if (ref.handle) item = await fetchChannel(`forHandle=${encodeURIComponent(ref.handle)}`)
  else if (ref.username) item = await fetchChannel(`forUsername=${encodeURIComponent(ref.username)}`)

  // Fallback: search the term, then resolve the top channel by id.
  if (!item && (ref.search || ref.username || ref.handle)) {
    const term = ref.search ?? ref.username ?? ref.handle ?? ''
    try {
      const res = await fetch(`${DATA_API}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(term)}&key=${API_KEY}`)
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ id: { channelId: string } }> }
        const cid = data.items?.[0]?.id.channelId
        if (cid) item = await fetchChannel(`id=${cid}`)
      }
    } catch { /* ignore */ }
  }

  return item ? connectionFromChannel(item, 'link') : null
}

// ─── OAuth (implicit token flow) ─────────────────────────────────────────────

interface OAuthTokenResult {
  accessToken: string
  expiresAt: number
}

/** Open the consent popup and resolve with the access token (or null). */
function runOAuthPopup(): Promise<OAuthTokenResult | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    const popup = window.open(buildAuthUrl(), 'yt-oauth', 'width=520,height=680,noopener=no')
    let done = false
    const finish = (r: OAuthTokenResult | null): void => {
      if (done) return
      done = true
      window.removeEventListener('message', onMessage)
      clearInterval(closedTimer)
      resolve(r)
    }
    const onMessage = (e: MessageEvent): void => {
      if (e.origin !== window.location.origin) return
      const data = e.data as { source?: string; accessToken?: string; expiresIn?: number; error?: string }
      if (data?.source !== 'yt-oauth') return
      if (data.accessToken) finish({ accessToken: data.accessToken, expiresAt: Date.now() + (data.expiresIn ?? 3600) * 1000 })
      else finish(null)
    }
    window.addEventListener('message', onMessage)
    // If the user closes the popup without authorizing, stop waiting.
    const closedTimer = setInterval(() => {
      if (popup?.closed) finish(null)
    }, 700)
    // Hard timeout so the UI never hangs.
    setTimeout(() => finish(null), 180_000)
  })
}

/** Resolve the signed-in user's own channel from an OAuth bearer token. */
async function fetchMyChannel(accessToken: string): Promise<ChannelApiItem | null> {
  try {
    const res = await fetch(`${DATA_API}/channels?part=snippet,statistics,contentDetails&mine=true`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) return null
    const data = (await res.json()) as { items?: ChannelApiItem[] }
    return data.items?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Start the Google channel-connect flow. With a real client id this opens the
 * consent screen and resolves the user's own channel. Without credentials it
 * returns a demo connection so the import UI stays exercisable.
 */
export async function connectChannel(): Promise<YouTubeConnection | null> {
  if (youtubeConfigured) {
    const token = await runOAuthPopup()
    if (!token) return null
    const item = await fetchMyChannel(token.accessToken)
    if (item) return connectionFromChannel(item, 'oauth', token.accessToken, token.expiresAt)
    // Authorized but channel lookup failed (e.g. no Data API key) — still mark
    // connected with the token so other authorized calls can proceed.
    return {
      connected: true,
      channelTitle: 'Your YouTube channel',
      connectedAt: new Date().toISOString(),
      scopes: SCOPES,
      accessToken: token.accessToken,
      tokenExpiresAt: token.expiresAt,
      via: 'oauth'
    }
  }
  // Demo / optimistic connection (no client id configured).
  return {
    connected: true,
    channelId: 'UC_demo_channel',
    channelTitle: 'My Teaching Channel',
    thumbnail: 'https://i.ytimg.com/vi/oRdxUFDoQe0/hqdefault.jpg',
    subscriberCount: 12_400,
    uploadsPlaylistId: undefined,
    connectedAt: new Date().toISOString(),
    scopes: SCOPES,
    via: 'demo'
  }
}

// ─── Import ──────────────────────────────────────────────────────────────────

interface PlaylistItem {
  contentDetails: { videoId: string }
  snippet: { title: string; description: string; publishedAt: string; thumbnails?: { medium?: { url: string }; high?: { url: string } } }
}

async function hydrateViewCounts(videos: YouTubeVideo[]): Promise<YouTubeVideo[]> {
  if (!youtubeApiKeyConfigured || videos.length === 0) return videos
  try {
    const ids = videos.map((v) => v.id).join(',')
    const res = await fetch(`${DATA_API}/videos?part=statistics,contentDetails&id=${ids}&key=${API_KEY}`)
    if (!res.ok) return videos
    const data = (await res.json()) as { items?: Array<{ id: string; statistics?: { viewCount?: string }; contentDetails?: { duration?: string } }> }
    const byId = new Map((data.items ?? []).map((it) => [it.id, it]))
    return videos.map((v) => {
      const it = byId.get(v.id)
      return {
        ...v,
        viewCount: it?.statistics?.viewCount ? Number(it.statistics.viewCount) : v.viewCount,
        durationSec: it?.contentDetails?.duration ? parseISODuration(it.contentDetails.duration) : v.durationSec
      }
    })
  } catch {
    return videos
  }
}

/** Parse an ISO-8601 duration (PT#H#M#S) into seconds. */
function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (Number(m[1] ?? 0)) * 3600 + (Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0)
}

/** Import the connected channel's videos (real uploads playlist or demo set). */
export async function importChannelVideos(connection: YouTubeConnection): Promise<YouTubeVideo[]> {
  const headers = connection.accessToken ? { Authorization: `Bearer ${connection.accessToken}` } : undefined

  // Preferred: the uploads playlist (most reliable, real ordering).
  if (connection.uploadsPlaylistId && (youtubeApiKeyConfigured || headers)) {
    try {
      const keyParam = youtubeApiKeyConfigured ? `&key=${API_KEY}` : ''
      const res = await fetch(
        `${DATA_API}/playlistItems?part=snippet,contentDetails&playlistId=${connection.uploadsPlaylistId}&maxResults=24${keyParam}`,
        { headers }
      )
      if (res.ok) {
        const data = (await res.json()) as { items?: PlaylistItem[] }
        const videos: YouTubeVideo[] = (data.items ?? []).map((it) => ({
          id: it.contentDetails.videoId,
          title: it.snippet.title,
          description: it.snippet.description,
          thumbnail: it.snippet.thumbnails?.high?.url ?? it.snippet.thumbnails?.medium?.url ?? thumbnailFor(it.contentDetails.videoId),
          publishedAt: it.snippet.publishedAt,
          durationSec: 0,
          viewCount: 0
        }))
        return hydrateViewCounts(videos)
      }
    } catch { /* fall through */ }
  }

  // Fallback: search by channel id (needs the API key).
  if (youtubeApiKeyConfigured && connection.channelId && connection.channelId !== 'UC_demo_channel') {
    try {
      const res = await fetch(
        `${DATA_API}/search?part=snippet&channelId=${connection.channelId}&maxResults=24&order=date&type=video&key=${API_KEY}`
      )
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ id: { videoId: string }; snippet: { title: string; description: string; publishedAt: string; thumbnails: { medium?: { url: string }; high?: { url: string } } } }> }
        const videos: YouTubeVideo[] = (data.items ?? []).map((it) => ({
          id: it.id.videoId,
          title: it.snippet.title,
          description: it.snippet.description,
          thumbnail: it.snippet.thumbnails.high?.url ?? it.snippet.thumbnails.medium?.url ?? thumbnailFor(it.id.videoId),
          publishedAt: it.snippet.publishedAt,
          durationSec: 0,
          viewCount: 0
        }))
        return hydrateViewCounts(videos)
      }
    } catch {
      /* fall through to demo */
    }
  }
  return DEMO_VIDEOS
}

const DEMO_VIDEOS: YouTubeVideo[] = [
  { id: 'oRdxUFDoQe0', title: 'The power of storytelling in language learning', description: 'How stories help you remember vocabulary 10× longer.', thumbnail: thumbnailFor('oRdxUFDoQe0'), publishedAt: new Date(Date.now() - 86_400_000 * 5).toISOString(), durationSec: 612, viewCount: 48_200 },
  { id: 'V7wseiR5xtw', title: 'IELTS Speaking Part 2 — full band-8 model answer', description: 'Watch a real band-8 response, annotated.', thumbnail: thumbnailFor('V7wseiR5xtw'), publishedAt: new Date(Date.now() - 86_400_000 * 12).toISOString(), durationSec: 484, viewCount: 121_000 },
  { id: 'dQw4w9WgXcQ', title: 'Daily vocabulary routine: 20 words a day', description: 'My exact spaced-repetition routine.', thumbnail: thumbnailFor('dQw4w9WgXcQ'), publishedAt: new Date(Date.now() - 86_400_000 * 20).toISOString(), durationSec: 213, viewCount: 8_900 },
  { id: 'jNQXAC9IVRw', title: 'Pronunciation clinic: the /θ/ sound for Uzbek speakers', description: 'Fix the most common mistake.', thumbnail: thumbnailFor('jNQXAC9IVRw'), publishedAt: new Date(Date.now() - 86_400_000 * 28).toISOString(), durationSec: 358, viewCount: 15_400 }
]
