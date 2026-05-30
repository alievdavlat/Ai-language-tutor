// Mock data + types for the Clips module (LingoClip / LyricsTraining-style
// fill-in-the-blank video game). UI-first: all data is hardcoded here.
// Real wiring (LRCLIB lyrics, youtube-transcript-api, difficulty blank-picker)
// comes in the feature/backend pass — see feature_backlog.md section D.

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
  /** tailwind gradient classes for the cover */
  cover: string
  youtubeId: string
  plays: string
  ago: string
  /** accent flag emoji */
  accent: string
  /** CEFR-ish level chip */
  level: string
  duration: string
  genre?: string
  /** sample synced lyrics — only the demo clip carries a full set */
  lines?: LyricLine[]
}

export interface Playlist {
  id: string
  title: string
  count: number
  cover: string
  /** difficulty dot colors, easy→hard */
  dots: string[]
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

// ─── Demo lyrics (Justin Bieber — Baby) ──────────────────────────────────────

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

// ─── Clips library ───────────────────────────────────────────────────────────

export const CLIPS: Clip[] = [
  {
    id: 'baby',
    title: 'Baby',
    artist: 'Justin Bieber ft. Ludacris',
    kind: 'song',
    cover: 'from-sky-500 to-blue-700',
    youtubeId: 'kffacxfA7G4',
    plays: '396K',
    ago: '14 years ago',
    accent: '🇨🇦',
    level: 'A2',
    duration: '3:35',
    genre: 'Pop',
    lines: BABY_LINES
  },
  { id: 'dinner', title: 'Dinner For One', artist: 'Mollie Elizabeth', kind: 'song', cover: 'from-pink-500 to-rose-700', youtubeId: '', plays: '579', ago: '2 days ago', accent: '🇺🇸', level: 'B1', duration: '3:12', genre: 'Pop' },
  { id: 'dance', title: 'Dance All Nite', artist: 'Anja', kind: 'song', cover: 'from-fuchsia-500 to-purple-700', youtubeId: '', plays: '1.7K', ago: '2 days ago', accent: '🇬🇧', level: 'A2', duration: '2:58', genre: 'Pop' },
  { id: 'perfect', title: 'Perfect', artist: 'Ed Sheeran', kind: 'song', cover: 'from-amber-500 to-orange-700', youtubeId: '', plays: '8.2M', ago: '9 years ago', accent: '🇬🇧', level: 'B1', duration: '4:23', genre: 'Pop' },
  { id: 'billie', title: 'Billie Jean', artist: 'Michael Jackson', kind: 'song', cover: 'from-indigo-500 to-violet-700', youtubeId: '', plays: '234K', ago: '14 years ago', accent: '🇺🇸', level: 'B2', duration: '4:54', genre: 'Pop' },
  { id: 'devil', title: 'The Devil Wears Prada — clip', artist: 'Movie scene', kind: 'movie', cover: 'from-slate-500 to-slate-800', youtubeId: '', plays: '92K', ago: '1 month ago', accent: '🇺🇸', level: 'B2', duration: '2:10' },
  { id: 'friends', title: 'Friends — intro scene', artist: 'TV scene', kind: 'tv', cover: 'from-orange-500 to-red-700', youtubeId: '', plays: '120K', ago: '3 weeks ago', accent: '🇺🇸', level: 'B1', duration: '1:45' },
  { id: 'talk-grit', title: 'The power of grit', artist: 'TED Talk', kind: 'talk', cover: 'from-red-500 to-rose-800', youtubeId: '', plays: '3M', ago: '5 years ago', accent: '🇺🇸', level: 'C1', duration: '6:12' }
]

export function findClip(id: string | null): Clip {
  return CLIPS.find((c) => c.id === id) ?? CLIPS[0]
}

// ─── Home sections ─────────────────────────────────────────────────────────

export const FEATURED_IDS = ['dinner', 'dance', 'billie', 'perfect']
export const RECENT_IDS = ['baby', 'dance', 'dinner', 'friends']
export const HOT_IDS = ['perfect', 'billie', 'baby', 'devil']

export const PLAYLISTS: Playlist[] = [
  { id: 'queens', title: 'Queens of Music', count: 30, cover: 'from-pink-500 to-rose-700', dots: ['#10b981', '#10b981', '#f59e0b', '#fb923c'] },
  { id: 'theme', title: 'Theme Songs', count: 24, cover: 'from-amber-500 to-orange-700', dots: ['#10b981', '#f59e0b', '#fb923c', '#f43f5e'] },
  { id: 'fearless', title: 'Fearless Femme', count: 18, cover: 'from-fuchsia-500 to-purple-700', dots: ['#10b981', '#10b981', '#f59e0b', '#fb923c'] },
  { id: 'essence', title: 'Essence of Woman', count: 30, cover: 'from-violet-500 to-indigo-700', dots: ['#10b981', '#f59e0b', '#fb923c', '#f43f5e'] }
]

export const GENRES = [
  { id: 'pop', label: 'Pop', cover: 'from-amber-500 to-orange-600' },
  { id: 'rock', label: 'Rock', cover: 'from-sky-500 to-blue-700' },
  { id: 'hardrock', label: 'Hard Rock', cover: 'from-indigo-500 to-blue-900' },
  { id: 'metal', label: 'Heavy Metal', cover: 'from-slate-600 to-slate-900' }
]

export function clipsByIds(ids: string[]): Clip[] {
  return ids.map((id) => CLIPS.find((c) => c.id === id)).filter((c): c is Clip => Boolean(c))
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
