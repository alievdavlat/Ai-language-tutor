/**
 * YouTube integration (#25).
 *
 * Three capabilities, each degrading gracefully without cloud keys:
 *  1. paste-a-link metadata fetch — keyless, via noembed (CORS-friendly) +
 *     the always-public thumbnail CDN. Works offline-of-keys, in any browser.
 *  2. channel connect (Google OAuth) — needs VITE_YT_CLIENT_ID; falls back to a
 *     demo connection so the import UI is fully functional without credentials.
 *  3. channel video import — needs VITE_YT_API_KEY (Data API v3); falls back to
 *     a realistic demo video set.
 *
 * Required env (document in docs/YOUTUBE-OAUTH.md):
 *   VITE_YT_CLIENT_ID   — OAuth 2.0 Web client id from Google Cloud Console
 *   VITE_YT_API_KEY     — (optional) Data API v3 key for listing channel videos
 *   VITE_YT_REDIRECT_URI— OAuth redirect (defaults to window.location.origin)
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

export const youtubeConfigured = Boolean(CLIENT_ID)
export const youtubeApiKeyConfigured = Boolean(API_KEY)

export function thumbnailFor(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
}

/** Build the Google OAuth consent URL. The callback exchanges the code. */
export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID ?? '',
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
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

/**
 * Start the channel-connect flow. With a real client id this opens Google's
 * consent screen; without one it returns a demo connection so the rest of the
 * UI (import, link-as-lesson) is fully exercisable.
 */
export async function connectChannel(): Promise<YouTubeConnection> {
  if (youtubeConfigured && typeof window !== 'undefined') {
    // Real flow: open consent. The /youtube/callback route completes it.
    window.open(buildAuthUrl(), '_blank', 'noopener')
  }
  // Demo / optimistic connection (replaced by the callback when keys exist).
  return {
    connected: true,
    channelId: 'UC_demo_channel',
    channelTitle: 'My Teaching Channel',
    thumbnail: 'https://i.ytimg.com/vi/oRdxUFDoQe0/hqdefault.jpg',
    subscriberCount: 12_400,
    connectedAt: new Date().toISOString(),
    scopes: SCOPES
  }
}

/** Import the connected channel's videos (Data API or demo set). */
export async function importChannelVideos(connection: YouTubeConnection): Promise<YouTubeVideo[]> {
  if (youtubeApiKeyConfigured && connection.channelId && connection.channelId !== 'UC_demo_channel') {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${connection.channelId}&maxResults=24&order=date&type=video&key=${API_KEY}`
      )
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ id: { videoId: string }; snippet: { title: string; description: string; publishedAt: string; thumbnails: { medium?: { url: string } } } }> }
        return (data.items ?? []).map((it) => ({
          id: it.id.videoId,
          title: it.snippet.title,
          description: it.snippet.description,
          thumbnail: it.snippet.thumbnails.medium?.url ?? thumbnailFor(it.id.videoId),
          publishedAt: it.snippet.publishedAt,
          durationSec: 0,
          viewCount: 0
        }))
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
