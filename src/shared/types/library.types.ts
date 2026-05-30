/**
 * Library domain — real, user-uploadable media. Three kinds:
 *   • book  — a PDF (with optional per-page or full-book audio/video)
 *   • video — a YouTube link or uploaded file
 *   • audio — a podcast / spoken-word track for the Listening player
 *
 * Backed by `services/library/store.ts` (localStorage today; Supabase Storage
 * later). NOTHING here is hardcoded into a page — items come from the store,
 * and the seed is just default content the owner can delete/replace.
 */
import type { ID } from './platform.types'
import type { TargetLanguage } from './user.types'

export type LibraryKind = 'book' | 'video' | 'audio'

/** Optional per-page media for a book. `page` is 1-based. */
export interface BookPageMedia {
  page: number
  audioUrl?: string
  videoUrl?: string
}

export interface LibraryItem {
  id: ID
  ownerId: ID
  kind: LibraryKind
  title: string
  author?: string
  description?: string
  level?: string
  language: TargetLanguage
  /** Square card image (data: or remote URL). Falls back to a default icon. */
  thumbnailUrl?: string
  createdAt: string

  // ── book ──────────────────────────────────────────────────────────────
  /** PDF as a data: URL (offline) or remote URL. */
  pdfUrl?: string
  pageCount?: number
  /** Plays on every page when set (whole-book narration / read-along video). */
  fullAudioUrl?: string
  fullVideoUrl?: string
  /** Per-page overrides (take priority over the full-book media on that page). */
  pageMedia?: BookPageMedia[]

  // ── video ─────────────────────────────────────────────────────────────
  /** YouTube id OR a file data/remote URL. */
  videoUrl?: string
  youtubeId?: string

  // ── audio ─────────────────────────────────────────────────────────────
  audioUrl?: string
  durationLabel?: string
}
