// Types + pure game registries for the Clips module (LingoClip / LyricsTraining-
// style fill-in-the-blank video game).
//
// The clip CATALOG (the actual songs/movies/playlists) is no longer hardcoded
// here — it lives in `services/clips/store.ts` (a real, editable, localStorage-
// backed store seeded from a curated set, authorable in Creator Studio / Admin,
// and mirrored to the Supabase `clips` table for cloud sync). This file keeps
// only the pure types + the game-mode / difficulty registries + the
// deterministic blank-picker the play engine imports.

export type ClipKind = 'song' | 'movie' | 'tv' | 'talk'
export type GameMode = 'choice' | 'type' | 'karaoke' | 'scribe'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface LyricLine {
  /** seconds into the video this line starts */
  t: number
  text: string
}

export interface Clip {
  id: string
  title: string
  artist: string
  kind: ClipKind
  /** tailwind gradient classes for the cover (fallback when no image) */
  cover: string
  /** real cover image — uploaded data URL, remote URL, or a YouTube thumbnail */
  thumbnailUrl?: string
  youtubeId: string
  /** display string for legacy seed rows ("396K") */
  plays: string
  /** real play counter — drives "Hot right now" */
  playCount?: number
  /** display string for legacy seed rows ("14 years ago") */
  ago: string
  /** ISO timestamp — drives "Recently added" */
  createdAt?: string
  /** ISO timestamp of the last play — drives "Based on your activity" */
  lastPlayedAt?: string
  /** accent flag emoji */
  accent: string
  /** CEFR-ish level chip */
  level: string
  duration: string
  genre?: string
  /** target-language code this clip belongs to (defaults to English) */
  lang?: string
  /** crop window into the video, in seconds (authoring) */
  startSec?: number
  endSec?: number
  /** synced lyrics (LRC). Authored or fetched from LRCLIB at play time. */
  lines?: LyricLine[]
  /** author id ('system' for the curated seed) */
  authorId?: string
  builtIn?: boolean
  visibility?: 'public' | 'private'
}

export interface Playlist {
  id: string
  title: string
  /** tailwind gradient classes for the cover */
  cover: string
  /** difficulty dot colors, easy→hard */
  dots: string[]
  /** clip ids in this playlist (count is derived) */
  clipIds: string[]
  /** minimum CEFR level to unlock this playlist (level-gating) */
  minLevel?: string
  builtIn?: boolean
  authorId?: string
}

// ─── Game-mode + difficulty registries ──────────────────────────────────────

export interface GameModeDef {
  id: GameMode
  label: string
  desc: string
}

export const GAME_MODES: GameModeDef[] = [
  { id: 'choice', label: 'Choice', desc: 'Pick the missing word from 4 options' },
  { id: 'type', label: 'Type', desc: 'Type the missing words as you hear them' },
  { id: 'karaoke', label: 'Karaoke', desc: 'Sing along — full lyrics, no blanks' },
  { id: 'scribe', label: 'Scribe', desc: 'Dictation — type the whole line you hear' }
]

export interface DifficultyDef {
  id: Difficulty
  label: string
  emoji: string
  /** fraction of words blanked */
  fraction: number
  /** tailwind text/border/bg tone */
  tone: string
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'beginner', label: 'Beginner', emoji: '🙂', fraction: 0.1, tone: 'emerald' },
  { id: 'intermediate', label: 'Intermediate', emoji: '😐', fraction: 0.2, tone: 'amber' },
  { id: 'advanced', label: 'Advanced', emoji: '🙁', fraction: 0.4, tone: 'orange' },
  { id: 'expert', label: 'Expert', emoji: '😵', fraction: 1, tone: 'rose' }
]

export const KIND_LABEL: Record<ClipKind, string> = {
  song: 'Music',
  movie: 'Movies',
  tv: 'TV',
  talk: 'Talks'
}

/** Stable non-negative hash of a string (no Math.random — keeps covers deterministic). */
function seedOf(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * A generated cover image for content that ships no artwork — a real picture,
 * never a flat gradient. Deterministic per seed so the same item always gets
 * the same cover.
 */
export function generatedCover(seed: string): string {
  const prompt = 'abstract dark music cover art, glowing sound waves, deep navy and violet, cinematic, no text, minimal'
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=640&height=360&nologo=true&model=flux&seed=${seedOf(seed)}`
}

/**
 * The image to show for a clip — ALWAYS a real picture, never a gradient:
 * an explicit uploaded/remote cover, else the YouTube thumbnail, else a
 * deterministic generated cover.
 */
export function clipThumb(clip: { thumbnailUrl?: string; youtubeId?: string; id?: string; title?: string }): string {
  if (clip.thumbnailUrl) return clip.thumbnailUrl
  if (clip.youtubeId) return `https://img.youtube.com/vi/${clip.youtubeId}/hqdefault.jpg`
  return generatedCover(clip.id || clip.title || 'clip')
}

/**
 * Count the blankable words in a set of synced lyric lines — the real "words"
 * total a clip offers (skips 1–2 letter words, matching `pickBlanks`). Used for
 * the setup-page word count instead of a hardcoded number.
 */
export function countBlankableWords(lines: LyricLine[] | undefined): number {
  if (!lines || !lines.length) return 0
  return lines.reduce((sum, l) => {
    const words = l.text.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z']/g, '').length > 2)
    return sum + words.length
  }, 0)
}

/**
 * Deterministically choose which word indices to blank for a line, given a
 * difficulty fraction. Skips very short words. Deterministic so the same line
 * always blanks the same words (no flicker on re-render).
 */
export function pickBlanks(words: string[], fraction: number): Set<number> {
  if (fraction >= 1) {
    return new Set(words.map((_, i) => i).filter((i) => words[i].replace(/[^a-zA-Z']/g, '').length > 1))
  }
  const eligible = words
    .map((w, i) => ({ w: w.replace(/[^a-zA-Z']/g, ''), i }))
    .filter((x) => x.w.length > 2)
  const count = Math.max(1, Math.round(eligible.length * fraction))
  const step = Math.max(1, Math.floor(eligible.length / count))
  const out = new Set<number>()
  for (let k = 0; k < eligible.length && out.size < count; k += step) {
    out.add(eligible[k].i)
  }
  return out
}
