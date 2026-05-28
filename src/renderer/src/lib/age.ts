import type { AgeBand } from '@shared/types'

/** Years between an ISO date string (yyyy-mm-dd) and now. */
export function computeAge(dob: string): number {
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const beforeBirthday =
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  if (beforeBirthday) age -= 1
  return Math.max(0, age)
}

export function bandFromAge(age: number): AgeBand {
  if (age < 13) return 'under13'
  if (age < 18) return 'teen'
  return 'adult'
}

export function bandFromDob(dob: string | undefined): AgeBand | null {
  if (!dob) return null
  return bandFromAge(computeAge(dob))
}

/** Pretty label for messaging. */
export const BAND_LABEL: Record<AgeBand, string> = {
  under13: 'Kids zone',
  teen: 'Teens (13–17)',
  adult: 'Adults (18+)'
}
