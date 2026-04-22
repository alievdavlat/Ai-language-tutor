import type { Interest } from '@shared/types'

export interface InterestOption {
  id: Interest
  emoji: string
  label: string
}

export const INTEREST_OPTIONS: readonly InterestOption[] = [
  { id: 'tech', emoji: '💻', label: 'Tech' },
  { id: 'sports', emoji: '⚽', label: 'Sports' },
  { id: 'movies', emoji: '🎬', label: 'Movies' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'business', emoji: '📈', label: 'Business' },
  { id: 'travel', emoji: '🌍', label: 'Travel' },
  { id: 'food', emoji: '🍜', label: 'Food' },
  { id: 'science', emoji: '🔬', label: 'Science' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming' },
  { id: 'books', emoji: '📚', label: 'Books' },
  { id: 'fashion', emoji: '👗', label: 'Fashion' },
  { id: 'health', emoji: '🏃', label: 'Health' }
] as const
