import type { Accent } from '../types/learning.types'

export const ACCENTS: readonly Accent[] = ['us', 'uk', 'au', 'in'] as const

export const ACCENT_LABELS: Record<Accent, string> = {
  us: '🇺🇸 American',
  uk: '🇬🇧 British',
  au: '🇦🇺 Australian',
  in: '🇮🇳 Indian'
}

export const ACCENT_TO_LANG: Record<Accent, string> = {
  us: 'en-US',
  uk: 'en-GB',
  au: 'en-AU',
  in: 'en-IN'
}

export const ACCENT_TO_PERSONA_NAME: Record<Accent, string> = {
  us: 'Emma',
  uk: 'James',
  au: 'Liam',
  in: 'Priya'
}
