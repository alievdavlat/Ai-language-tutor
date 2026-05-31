/**
 * React hooks that wire the Grammar / Vocabulary / Exams feature slice to the
 * Foundation backend (`services/backend`) for persistence and the FSRS engine
 * (`fsrs.ts`) for scheduling.
 *
 * Persistence goes through the single `backend` instance — local today,
 * Supabase when `VITE_USE_SUPABASE=1` — exactly as the Foundation session
 * intends. No page touches localStorage directly for these domains.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TargetLanguage, VocabItem } from '@shared/types'
import type { ReviewGrade } from '@shared/types/study.types'
import { backend } from '../backend'
import { logActivity } from '../activity'
import { createId } from '../../lib/ids'
import { useAppStore } from '../../store/useAppStore'
import { translate } from '../translate'
import { newVocabItem, retrievability, schedule } from './fsrs'
import { STARTER_VOCAB, seedMeaning } from './seedVocab'

const MS_PER_DAY = 86_400_000

/** Stable id for the viewer, with a local fallback so study works pre-sign-in. */
export function currentUserId(): string {
  return backend.currentUserId() ?? 'u_local'
}

export interface VocabStats {
  total: number
  due: number
  new: number
  learning: number
  mastered: number
  /** Average predicted retention 0–100 across reviewed cards. */
  retention: number
}

/** A card counts as "mastered" once it's in review with a long, stable interval. */
function isMastered(c: VocabItem): boolean {
  return c.state === 'review' && c.stability >= 21
}

export function computeStats(cards: VocabItem[], nowMs: number): VocabStats {
  let due = 0
  let learning = 0
  let mastered = 0
  let nu = 0
  let retSum = 0
  let retCount = 0
  for (const c of cards) {
    if (Date.parse(c.due) <= nowMs) due += 1
    if (c.state === 'new') nu += 1
    else if (c.state === 'learning' || c.state === 'relearning') learning += 1
    if (isMastered(c)) mastered += 1
    if (c.reps > 0 && c.lastReviewedAt) {
      const elapsed = Math.max(0, (nowMs - Date.parse(c.lastReviewedAt)) / MS_PER_DAY)
      retSum += retrievability(elapsed, c.stability)
      retCount += 1
    }
  }
  return {
    total: cards.length,
    due,
    new: nu,
    learning,
    mastered,
    retention: retCount ? Math.round((retSum / retCount) * 100) : 0
  }
}

interface UseVocabResult {
  cards: VocabItem[]
  due: VocabItem[]
  stats: VocabStats
  loading: boolean
  /** Add a custom word. Returns the created card. */
  add: (input: { term: string; translation: string; example?: string; deck?: string }) => Promise<VocabItem>
  /** Grade a card during review; reschedules via FSRS + logs activity. */
  review: (card: VocabItem, grade: ReviewGrade) => Promise<VocabItem>
  remove: (id: string) => Promise<void>
  refresh: () => void
}

/**
 * Loads the user's vocabulary for a language, seeding a starter deck on first
 * run so the page is never empty. Exposes add / review / remove actions that
 * persist through the backend and keep FSRS state correct.
 */
export function useVocab(language: TargetLanguage): UseVocabResult {
  const userId = currentUserId()
  // The learner's own language — vocab meanings are stored/shown in it.
  const native = useAppStore((s) => s.profile?.nativeLanguage) ?? 'en'
  const [cards, setCards] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      let list = await backend.listVocab(userId, { language })
      if (list.length === 0) {
        // Seed a small starter deck once so stats/review aren't empty. Meanings
        // are bundled for en/uz/ru and translated on demand for other natives.
        const now = Date.now()
        const seeded: VocabItem[] = []
        let i = 0
        for (const s of STARTER_VOCAB) {
          const meaning = seedMeaning(s, native) ?? (await translate(s.term, language, native)) ?? s.gloss
          const item = newVocabItem({
            id: createId('vocab'),
            userId,
            language,
            term: s.term,
            translation: meaning,
            example: s.example,
            deck: s.deck,
            // Stagger due times slightly so the queue has a natural order.
            nowMs: now - i
          })
          await backend.upsertVocab(item)
          seeded.push(item)
          i++
        }
        list = seeded
      } else if (native !== 'en') {
        // Migrate legacy seed cards (stored with the English gloss) to the
        // native meaning, so existing installs also show the learner's
        // language instead of an English-to-English flashcard pair.
        const byTerm = new Map(STARTER_VOCAB.map((w) => [w.term.toLowerCase(), w]))
        const migrated: VocabItem[] = []
        for (const c of list) {
          const w = byTerm.get(c.term.toLowerCase())
          if (w && c.translation === w.gloss) {
            const meaning = seedMeaning(w, native) ?? (await translate(w.term, language, native)) ?? w.gloss
            const updated = { ...c, translation: meaning }
            await backend.upsertVocab(updated)
            migrated.push(updated)
          } else {
            migrated.push(c)
          }
        }
        list = migrated
      }

      // Drop accidental duplicates (same term in the same language) — older
      // builds could double-seed under a mount race, leaving two identical
      // cards that show up as duplicate, ambiguous flashcard tiles.
      const seen = new Set<string>()
      const deduped: VocabItem[] = []
      const extras: VocabItem[] = []
      for (const c of list) {
        const k = c.term.trim().toLowerCase()
        if (seen.has(k)) extras.push(c)
        else { seen.add(k); deduped.push(c) }
      }
      if (extras.length > 0) {
        for (const e of extras) { try { await backend.deleteVocab(e.id) } catch { /* best-effort */ } }
        list = deduped
      }

      if (!cancelled) {
        setCards(list)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, language, native, tick])

  const add = useCallback<UseVocabResult['add']>(
    async (input) => {
      // Store the meaning in the learner's native language. If the caller's
      // translation is in another language (e.g. an English dictionary gloss),
      // translate the term — best-effort, falling back to what was passed in.
      const term = input.term.trim()
      let meaning = input.translation.trim()
      if (native !== language) {
        const translated = await translate(term, language, native)
        if (translated) meaning = translated
      }
      const item = {
        ...newVocabItem({
          id: createId('vocab'),
          userId,
          language,
          term,
          translation: meaning,
          example: input.example?.trim() || undefined,
          deck: input.deck?.trim() || 'My words',
          nowMs: Date.now()
        }),
        source: 'created' as const
      }
      const saved = await backend.upsertVocab(item)
      await logActivity({
        userId,
        kind: 'word_learned',
        language,
        xp: 2,
        meta: { word: saved.term, deck: saved.deck ?? '' }
      })
      setCards((prev) => [saved, ...prev])
      return saved
    },
    [userId, language, native]
  )

  const review = useCallback<UseVocabResult['review']>(
    async (card, grade) => {
      const { card: updated } = schedule(card, grade, Date.now())
      const saved = await backend.upsertVocab(updated)
      await logActivity({
        userId,
        kind: 'practice_session',
        language,
        xp: grade >= 3 ? 3 : 1,
        meta: { word: saved.term, grade }
      })
      setCards((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
      return saved
    },
    [userId, language]
  )

  const remove = useCallback<UseVocabResult['remove']>(
    async (id) => {
      await backend.deleteVocab(id)
      setCards((prev) => prev.filter((c) => c.id !== id))
    },
    []
  )

  const nowMs = Date.now()
  const due = useMemo(
    () => cards.filter((c) => Date.parse(c.due) <= nowMs).sort((a, b) => Date.parse(a.due) - Date.parse(b.due)),
    [cards, nowMs]
  )
  const stats = useMemo(() => computeStats(cards, nowMs), [cards, nowMs])

  return { cards, due, stats, loading, add, review, remove, refresh }
}
