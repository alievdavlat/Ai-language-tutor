/**
 * Bridge between the fast local "saved words" cache (for instant highlight /
 * offline) and Foundation's FSRS vocabulary backend (so the Vocabulary page and
 * spaced-repetition reviews pick the word up). Saves are dual-written; the local
 * cache is the source of truth for the synchronous `isWordSaved` UI check.
 */
import type { TargetLanguage, VocabItem } from '@shared/types'
import { backend } from '../backend'
import {
  isWordSaved as localIsSaved,
  removeWord as localRemove,
  saveWord as localSave,
  type SavedWord
} from './progress'

export { isWordSaved, listSavedWords } from './progress'

function newVocabItem(userId: string, language: TargetLanguage, term: string, translation: string, example?: string, deck?: string): VocabItem {
  const now = new Date().toISOString()
  return {
    id: `v_${language}_${term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    userId,
    language,
    term,
    translation: translation || '',
    example,
    deck,
    due: now,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: 'new',
    createdAt: now
  }
}

export interface SaveVocabInput extends Omit<SavedWord, 'id' | 'at'> {
  /** Native-language gloss to store as the FSRS card's translation. */
  translation?: string
  example?: string
  deck?: string
}

/** Save a word to both the local cache and the FSRS backend. */
export function saveVocab(input: SaveVocabInput): void {
  localSave({ word: input.word, lang: input.lang, pos: input.pos, meaning: input.meaning, source: input.source })
  const userId = backend.currentUserId()
  if (!userId) return
  const lang = (input.lang as TargetLanguage) || 'en'
  const item = newVocabItem(userId, lang, input.word, input.translation || input.meaning || '', input.example, input.deck ?? input.source)
  void backend.upsertVocab(item).catch(() => { /* offline / not signed in */ })
}

/** Remove a word from the local cache and, best-effort, the FSRS backend. */
export function removeVocab(word: string, lang: string): void {
  localRemove(word, lang)
  const userId = backend.currentUserId()
  if (!userId) return
  void backend
    .listVocab(userId, { language: lang as TargetLanguage })
    .then((items) => {
      const match = items.find((v) => v.term.toLowerCase() === word.trim().toLowerCase())
      if (match) return backend.deleteVocab(match.id)
    })
    .catch(() => { /* ignore */ })
}

/** Toggle save state. Returns the new state (true = now saved). */
export function toggleVocab(input: SaveVocabInput): boolean {
  if (localIsSaved(input.word, input.lang)) {
    removeVocab(input.word, input.lang)
    return false
  }
  saveVocab(input)
  return true
}
