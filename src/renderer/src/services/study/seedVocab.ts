/**
 * A small starter vocabulary deck, seeded the first time a user opens the
 * Vocabulary page so the FSRS stats and review queue are never empty. Once the
 * user adds their own words, this is never used again.
 *
 * `gloss` is an English definition (shown when the native language is English).
 * `tr` holds the meaning in the other UI languages so flashcards can show the
 * word in the learner's OWN language instead of an English-to-English pair.
 */
export interface SeedWord {
  term: string
  /** English definition — used as the meaning for English natives + fallback. */
  gloss: string
  /** Native-language meaning per non-English UI language. */
  tr: { uz: string; ru: string }
  example?: string
  deck: string
}

export const STARTER_VOCAB: SeedWord[] = [
  { term: 'itinerary', gloss: 'a planned route or journey', tr: { uz: 'sayohat rejasi, marshrut', ru: 'маршрут (поездки)' }, example: 'Our itinerary includes three cities in five days.', deck: 'Travel' },
  { term: 'reservation', gloss: 'an arrangement to keep something for someone', tr: { uz: 'bron, oldindan band qilish', ru: 'бронь, резервирование' }, example: 'I made a reservation for two at 8 pm.', deck: 'Travel' },
  { term: 'spontaneous', gloss: 'done without planning ahead', tr: { uz: 'rejasiz, beixtiyor', ru: 'спонтанный' }, example: 'It was a spontaneous decision to take the trip.', deck: 'Daily life' },
  { term: 'negotiate', gloss: 'to discuss in order to reach an agreement', tr: { uz: 'muzokara qilmoq', ru: 'вести переговоры' }, example: 'They negotiated a better price for the contract.', deck: 'Business' },
  { term: 'deadline', gloss: 'the latest time by which something must be done', tr: { uz: 'oxirgi muddat', ru: 'крайний срок' }, example: 'The deadline for the report is Friday.', deck: 'Business' },
  { term: 'reluctant', gloss: 'unwilling and hesitant', tr: { uz: 'istamaydigan, ikkilanadigan', ru: 'неохотный' }, example: 'She was reluctant to share her opinion.', deck: 'Daily life' },
  { term: 'thorough', gloss: 'complete with regard to every detail', tr: { uz: 'puxta, batafsil', ru: 'тщательный' }, example: 'He gave the room a thorough cleaning.', deck: 'Academic' },
  { term: 'inevitable', gloss: 'certain to happen; unavoidable', tr: { uz: 'muqarrar', ru: 'неизбежный' }, example: 'Change is inevitable in any growing company.', deck: 'Academic' },
  { term: 'accommodate', gloss: 'to provide room for; to adapt to', tr: { uz: 'joylashtirmoq; moslashmoq', ru: 'вмещать; приспосабливать' }, example: 'The hotel can accommodate 200 guests.', deck: 'Travel' },
  { term: 'tedious', gloss: 'too long, slow, or dull; tiresome', tr: { uz: 'zerikarli, charchatadigan', ru: 'утомительный, скучный' }, example: 'Filling in the forms was a tedious task.', deck: 'Daily life' },
  { term: 'feasible', gloss: 'possible to do easily or conveniently', tr: { uz: 'amalga oshsa bo‘ladigan', ru: 'осуществимый' }, example: 'Is it feasible to finish by next week?', deck: 'Business' },
  { term: 'ambiguous', gloss: 'open to more than one interpretation', tr: { uz: 'noaniq, ikki ma‘noli', ru: 'неоднозначный' }, example: 'The instructions were ambiguous and confusing.', deck: 'Academic' }
]

/**
 * The bundled meaning for a seed word in the learner's native language, or
 * `undefined` when we don't ship one for that language (the caller then
 * translates on demand). English natives get the English gloss.
 */
export function seedMeaning(word: SeedWord, native: string): string | undefined {
  if (native === 'uz') return word.tr.uz
  if (native === 'ru') return word.tr.ru
  if (native === 'en') return word.gloss
  return undefined
}
