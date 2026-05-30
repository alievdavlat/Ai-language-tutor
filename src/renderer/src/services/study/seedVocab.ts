/**
 * A small starter vocabulary deck, seeded the first time a user opens the
 * Vocabulary page so the FSRS stats and review queue are never empty. Once the
 * user adds their own words, this is never used again.
 */
export interface SeedWord {
  term: string
  translation: string
  example?: string
  deck: string
}

export const STARTER_VOCAB: SeedWord[] = [
  { term: 'itinerary', translation: 'a planned route or journey', example: 'Our itinerary includes three cities in five days.', deck: 'Travel' },
  { term: 'reservation', translation: 'an arrangement to keep something for someone', example: 'I made a reservation for two at 8 pm.', deck: 'Travel' },
  { term: 'spontaneous', translation: 'done without planning ahead', example: 'It was a spontaneous decision to take the trip.', deck: 'Daily life' },
  { term: 'negotiate', translation: 'to discuss in order to reach an agreement', example: 'They negotiated a better price for the contract.', deck: 'Business' },
  { term: 'deadline', translation: 'the latest time by which something must be done', example: 'The deadline for the report is Friday.', deck: 'Business' },
  { term: 'reluctant', translation: 'unwilling and hesitant', example: 'She was reluctant to share her opinion.', deck: 'Daily life' },
  { term: 'thorough', translation: 'complete with regard to every detail', example: 'He gave the room a thorough cleaning.', deck: 'Academic' },
  { term: 'inevitable', translation: 'certain to happen; unavoidable', example: 'Change is inevitable in any growing company.', deck: 'Academic' },
  { term: 'accommodate', translation: 'to provide room for; to adapt to', example: 'The hotel can accommodate 200 guests.', deck: 'Travel' },
  { term: 'tedious', translation: 'too long, slow, or dull; tiresome', example: 'Filling in the forms was a tedious task.', deck: 'Daily life' },
  { term: 'feasible', translation: 'possible to do easily or conveniently', example: 'Is it feasible to finish by next week?', deck: 'Business' },
  { term: 'ambiguous', translation: 'open to more than one interpretation', example: 'The instructions were ambiguous and confusing.', deck: 'Academic' }
]
