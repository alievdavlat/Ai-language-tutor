/**
 * Role-play scenario store (#A26). A standalone localStorage-backed store —
 * mirrors `services/library`'s pattern (not the Foundation Backend), so the
 * Speaking hub has real, editable scenario data with thumbnails instead of a
 * hardcoded array. Seeds a curated default set on first use.
 */
import { useEffect, useState } from 'react'
import { createId } from '../../lib/ids'

export type RoleplayDifficulty = 'easy' | 'medium' | 'hard'

export type RoleplaySection =
  | 'trending'
  | 'daily'
  | 'professional'
  | 'educational'
  | 'travel'
  | 'social'

export const ROLEPLAY_SECTIONS: { id: RoleplaySection; label: string }[] = [
  { id: 'trending', label: 'Trending now' },
  { id: 'daily', label: 'Daily life' },
  { id: 'professional', label: 'Professional settings' },
  { id: 'educational', label: 'Educational settings' },
  { id: 'travel', label: 'Travel' },
  { id: 'social', label: 'Social' }
]

export interface Roleplay {
  id: string
  title: string
  blurb: string
  difficulty: RoleplayDifficulty
  /** Human label, e.g. "3-5 minutes". */
  duration: string
  section: RoleplaySection
  /** Optional real cover image — uploaded data URL or remote URL. */
  thumbnailUrl?: string
  /** Tailwind gradient classes for the default cover (when no image). */
  cover: string
  /** Emoji shown on the default cover. */
  emoji: string
  /** Opening instruction handed to the AI to play the other character. */
  prompt: string
  level?: string
  authorId?: string
  visibility?: 'public' | 'private'
  createdAt?: string
  /** How many times the viewer has started this scenario (drives Trending). */
  playCount?: number
  /** ISO of the last time it was started (drives "Based on your activity"). */
  lastPlayedAt?: string
}

const LS_KEY = 'speakai.roleplays.v2'

/** Reliable, offline gradient covers (no external image dependency). */
export const ROLEPLAY_COVERS = [
  'from-rose-500 to-pink-700',
  'from-sky-500 to-blue-700',
  'from-violet-500 to-purple-700',
  'from-amber-500 to-orange-700',
  'from-emerald-500 to-teal-700',
  'from-fuchsia-500 to-pink-700',
  'from-cyan-500 to-blue-700',
  'from-indigo-500 to-violet-700'
]

/** Deterministic gradient for an arbitrary scenario (used by the editor). */
export function coverFor(seed: string): string {
  const n = Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0))
  return ROLEPLAY_COVERS[n % ROLEPLAY_COVERS.length]
}

let seedSeq = 1
function seed(
  title: string,
  blurb: string,
  difficulty: RoleplayDifficulty,
  duration: string,
  section: RoleplaySection,
  level: string,
  emoji: string,
  cover: string,
  prompt: string
): Roleplay {
  const n = seedSeq++
  return {
    id: `rp_seed_${n}`,
    title,
    blurb,
    difficulty,
    duration,
    section,
    level,
    emoji,
    cover,
    prompt,
    visibility: 'public',
    authorId: 'system'
  }
}

const SEED: Roleplay[] = [
  seed('Interview a candidate', 'Lead the interview, ask sharp questions, and decide.', 'hard', '5-10 minutes', 'professional', 'B2', '💼', 'from-indigo-500 to-violet-700', "Let's role-play a job interview. I am the hiring manager and you are the candidate — introduce yourself and we'll begin."),
  seed('An allergy consultation', 'Describe symptoms to a doctor and understand the advice.', 'easy', '3-5 minutes', 'daily', 'A2', '🩺', 'from-emerald-500 to-teal-700', "Let's role-play a doctor's visit about an allergy. You are the doctor; greet me and ask what's wrong."),
  seed('Spring flower shopping', 'Buy flowers, ask about prices and arrangements.', 'easy', '3-5 minutes', 'daily', 'A2', '💐', 'from-rose-500 to-pink-700', "Let's role-play buying flowers. You are the florist; welcome me to the shop."),
  seed('Small talk in the elevator', 'Keep a short, polite conversation going with a colleague.', 'hard', '3-7 minutes', 'professional', 'B2', '🛗', 'from-sky-500 to-blue-700', "Let's role-play small talk in an elevator with a colleague. You start the conversation."),
  seed('Motion capture studio', 'Talk through a mocap shoot with the studio team.', 'medium', '3-7 minutes', 'professional', 'B1', '🎬', 'from-violet-500 to-purple-700', "Let's role-play a visit to a motion-capture studio. You are the studio lead; show me around."),
  seed('Remembering Children’s Day', 'Share memories and talk about a special holiday.', 'medium', '3-5 minutes', 'educational', 'B1', '🎈', 'from-amber-500 to-orange-700', "Let's role-play a friendly chat about Children's Day memories. You begin by asking about mine."),
  seed('Children’s Days explained', 'Explain a cultural holiday to someone new to it.', 'medium', '3-5 minutes', 'educational', 'B1', '🧒', 'from-cyan-500 to-blue-700', "Let's role-play explaining Children's Day to a curious friend. You are curious and ask me questions."),
  seed('Putting an end to child labor', 'Discuss a serious social topic and share opinions.', 'medium', '3-5 minutes', 'educational', 'B1', '✊', 'from-orange-500 to-rose-700', "Let's role-play a discussion about ending child labor. You share an opinion and ask for mine."),
  seed('Ordering at a restaurant', 'Ask about the menu, order, and handle the bill.', 'easy', '3-5 minutes', 'daily', 'A2', '🍽️', 'from-rose-500 to-orange-700', "Let's role-play ordering at a restaurant. You are the waiter; greet me and take my order."),
  seed('At the airport', 'Check in, pass security, and find your gate.', 'easy', '3-5 minutes', 'travel', 'A2', '✈️', 'from-sky-500 to-indigo-700', "Let's role-play checking in at an airport. You are the check-in agent."),
  seed('Hotel check-in', 'Reserve a room, ask about amenities, request help.', 'easy', '3-5 minutes', 'travel', 'A2', '🏨', 'from-cyan-500 to-teal-700', "Let's role-play a hotel check-in. You are the receptionist."),
  seed('Making new friends', 'Introduce yourself and keep small talk going.', 'medium', '3-5 minutes', 'social', 'B1', '🤝', 'from-fuchsia-500 to-pink-700', "Let's role-play meeting someone new at a party. You start the small talk."),
  seed('Business meeting', 'Share an opinion, agree, disagree, and wrap up.', 'hard', '5-10 minutes', 'professional', 'B2', '📊', 'from-blue-500 to-indigo-700', "Let's role-play a business meeting. You chair it and ask for my opinion.")
]

function db(): Roleplay[] {
  try {
    const raw = window.localStorage?.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as Roleplay[]
  } catch {
    /* fall through to seed */
  }
  try {
    window.localStorage?.setItem(LS_KEY, JSON.stringify(SEED))
  } catch {
    /* ignore */
  }
  return SEED
}

function save(list: Roleplay[]): void {
  try {
    window.localStorage?.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* quota / unavailable */
  }
}

export const roleplays = {
  list(): Roleplay[] {
    return db()
  },
  get(id: string): Roleplay | undefined {
    return db().find((r) => r.id === id)
  },
  upsert(input: Omit<Roleplay, 'id' | 'createdAt'> & { id?: string }): Roleplay {
    const list = db()
    if (input.id) {
      const idx = list.findIndex((r) => r.id === input.id)
      if (idx >= 0) {
        const updated = { ...list[idx], ...input, id: input.id } as Roleplay
        list[idx] = updated
        save(list)
        return updated
      }
    }
    const created: Roleplay = {
      ...input,
      id: input.id ?? createId('rp'),
      createdAt: new Date(0).toISOString()
    }
    save([created, ...list])
    return created
  },
  remove(id: string): void {
    save(db().filter((r) => r.id !== id))
  },
  /** Record that the viewer started this scenario — feeds Trending + activity. */
  recordPlay(id: string, nowIso: string): void {
    const list = db()
    const idx = list.findIndex((r) => r.id === id)
    if (idx < 0) return
    list[idx] = { ...list[idx], playCount: (list[idx].playCount ?? 0) + 1, lastPlayedAt: nowIso }
    save(list)
  }
}

/** React hook: the full scenario list, re-read on focus / after edits. */
export function useRoleplays(): { list: Roleplay[]; refresh: () => void } {
  const [list, setList] = useState<Roleplay[]>(() => roleplays.list())
  const [tick, setTick] = useState(0)
  useEffect(() => {
    setList(roleplays.list())
  }, [tick])
  return { list, refresh: () => setTick((t) => t + 1) }
}
