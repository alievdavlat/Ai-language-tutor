/**
 * Duplicate-content detection (#A65). One small, dependency-free toolkit the
 * upload forms + the admin "find duplicates" tool both lean on.
 *
 * The whole app encodes "what makes this piece of content the same thing" into a
 * single canonical **content key** string (stored in the `contentHash` column /
 * field). Detection then collapses to a cheap string compare:
 *
 *   • file uploads (pdf / audio / image / video) → `file:<sha256>`
 *   • videos / clips                              → `yt:<youtubeId>`
 *   • books (no file)                             → `isbn:<digits>` or
 *                                                   `ta:<title>|<author>`
 *   • courses / stories                           → `to:<title>|<ownerId>`
 *
 * EXACT match on the key → it's the same item (block the upload, link to the
 * original). When there's no shared key we fall back to a fuzzy title compare
 * (Dice bigram coefficient) for a SOFT "looks similar — add anyway?" warning.
 *
 * Hashing uses Web Crypto (`crypto.subtle`, available in Electron + the dev
 * preview on localhost). A tiny FNV fallback keeps it working in any
 * non-secure context instead of throwing.
 */

// ─── normalization ────────────────────────────────────────────────────────────

/** Lowercase, strip accents + punctuation, collapse whitespace. Stable across
 *  "Café  Lessons!" / "cafe lessons" so they key to the same thing. */
export function normalizeText(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Digits-only ISBN (handles ISBN-10/13 with dashes/spaces); '' if none. */
export function normalizeIsbn(s: string | undefined | null): string {
  if (!s) return ''
  const d = s.replace(/[^0-9xX]/g, '').toUpperCase()
  return d.length === 10 || d.length === 13 ? d : ''
}

// ─── canonical content keys ─────────────────────────────────────────────────

export type DupStrategy = 'file' | 'youtube' | 'isbn' | 'title-author' | 'title-owner'

export const contentKey = {
  file: (sha256: string): string => `file:${sha256}`,
  youtube: (youtubeId: string): string => `yt:${youtubeId.trim()}`,
  isbn: (isbn: string): string => `isbn:${normalizeIsbn(isbn)}`,
  titleAuthor: (title: string, author?: string): string =>
    `ta:${normalizeText(title)}|${normalizeText(author)}`,
  titleOwner: (title: string, ownerId: string): string =>
    `to:${normalizeText(title)}|${ownerId}`
}

/** Human label for why two items collide — shown in the admin tool. */
export function strategyLabel(key: string): string {
  if (key.startsWith('file:')) return 'Identical file'
  if (key.startsWith('yt:')) return 'Same video'
  if (key.startsWith('isbn:')) return 'Same ISBN'
  if (key.startsWith('ta:')) return 'Same title & author'
  if (key.startsWith('to:')) return 'Same title & owner'
  return 'Duplicate'
}

// ─── hashing ─────────────────────────────────────────────────────────────────

function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

/** Deterministic 64-bit FNV-1a fallback (non-secure contexts only). */
function fnv1a(bytes: Uint8Array): string {
  let h1 = 0x811c9dc5
  let h2 = 0x811c9dc5
  for (let i = 0; i < bytes.length; i++) {
    h1 ^= bytes[i]
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= bytes[bytes.length - 1 - i]
    h2 = Math.imul(h2, 0x01000193)
  }
  const hex = (n: number): string => (n >>> 0).toString(16).padStart(8, '0')
  return `fnv${hex(h1)}${hex(h2)}${bytes.length.toString(16)}`
}

function subtle(): SubtleCrypto | null {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto
    return c?.subtle ?? null
  } catch {
    return null
  }
}

/** SHA-256 (hex) of an ArrayBuffer/Uint8Array/string. FNV fallback if needed. */
export async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data)
  const sc = subtle()
  if (sc) {
    try {
      // Copy into a fresh ArrayBuffer so subtle gets a clean BufferSource.
      const copy = bytes.slice()
      const digest = await sc.digest('SHA-256', copy.buffer)
      return bufToHex(digest)
    } catch {
      /* fall through to FNV */
    }
  }
  return fnv1a(bytes)
}

/** SHA-256 (hex) of a File/Blob's bytes — the file-level dedup fingerprint. */
export async function hashFile(file: Blob): Promise<string> {
  return sha256Hex(await file.arrayBuffer())
}

// ─── fuzzy similarity (near-duplicate titles) ──────────────────────────────────

/** Dice coefficient over character bigrams → 0 (different) … 1 (identical). */
export function diceCoefficient(a: string, b: string): number {
  const x = normalizeText(a)
  const y = normalizeText(b)
  if (!x || !y) return 0
  if (x === y) return 1
  if (x.length < 2 || y.length < 2) return x === y ? 1 : 0
  const bigrams = (s: string): Map<string, number> => {
    const m = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2)
      m.set(g, (m.get(g) ?? 0) + 1)
    }
    return m
  }
  const ma = bigrams(x)
  const mb = bigrams(y)
  let overlap = 0
  for (const [g, count] of ma) {
    const other = mb.get(g)
    if (other) overlap += Math.min(count, other)
  }
  return (2 * overlap) / (x.length - 1 + (y.length - 1))
}

/** Default threshold above which two titles are treated as "near duplicates". */
export const NEAR_DUP_THRESHOLD = 0.82

// ─── generic detection ──────────────────────────────────────────────────────

export interface DupCandidate {
  /** Canonical content key (file:/yt:/isbn:/ta:/to:). */
  contentHash?: string
  title: string
  author?: string
  /** Exclude this id from matches (when editing an existing item). */
  excludeId?: string
}

export interface NearMatch<T> {
  item: T
  score: number
}

export interface DupResult<T> {
  /** Same canonical key — definitely the same content. */
  exact: T | null
  /** Similar title (+author) — probably the same; warn, don't block. */
  near: NearMatch<T>[]
}

/**
 * Compare a candidate against existing items. `getKey`/`getTitle`/`getId` read
 * the comparable fields off each existing item so this stays domain-agnostic.
 */
export function checkDuplicate<T>(
  candidate: DupCandidate,
  existing: T[],
  accessors: {
    getId: (t: T) => string
    getKey: (t: T) => string | undefined
    getTitle: (t: T) => string
    getAuthor?: (t: T) => string | undefined
  },
  threshold = NEAR_DUP_THRESHOLD
): DupResult<T> {
  const { getId, getKey, getTitle, getAuthor } = accessors
  let exact: T | null = null
  const near: NearMatch<T>[] = []

  for (const item of existing) {
    if (candidate.excludeId && getId(item) === candidate.excludeId) continue
    if (candidate.contentHash && getKey(item) === candidate.contentHash) {
      exact = item
      break
    }
  }
  if (exact) return { exact, near: [] }

  for (const item of existing) {
    if (candidate.excludeId && getId(item) === candidate.excludeId) continue
    const score = diceCoefficient(candidate.title, getTitle(item))
    if (score < threshold) continue
    // A matching author lifts confidence; a clearly different one lowers it.
    const ca = normalizeText(candidate.author)
    const ia = normalizeText(getAuthor?.(item))
    if (ca && ia && ca !== ia && score < 0.95) continue
    near.push({ item, score })
  }
  near.sort((a, b) => b.score - a.score)
  return { exact: null, near }
}

// ─── clustering (admin find-duplicates) ─────────────────────────────────────

export interface DupCluster<T> {
  /** The shared key (exact) or normalized title (near). */
  key: string
  reason: string
  kind: 'exact' | 'near'
  items: T[]
}

/**
 * Group a list into duplicate clusters: first by exact content key, then a
 * fuzzy title pass over whatever's left. Only clusters with ≥2 members are
 * returned.
 */
export function findClusters<T>(
  items: T[],
  accessors: {
    getId: (t: T) => string
    getKey: (t: T) => string | undefined
    getTitle: (t: T) => string
  },
  threshold = NEAR_DUP_THRESHOLD
): DupCluster<T>[] {
  const { getId, getKey, getTitle } = accessors
  const clusters: DupCluster<T>[] = []
  const claimed = new Set<string>()

  // 1) exact key groups
  const byKey = new Map<string, T[]>()
  for (const it of items) {
    const k = getKey(it)
    if (!k) continue
    const arr = byKey.get(k)
    if (arr) arr.push(it)
    else byKey.set(k, [it])
  }
  for (const [key, group] of byKey) {
    if (group.length < 2) continue
    group.forEach((g) => claimed.add(getId(g)))
    clusters.push({ key, reason: strategyLabel(key), kind: 'exact', items: group })
  }

  // 2) fuzzy title groups over the remainder
  const rest = items.filter((it) => !claimed.has(getId(it)))
  for (let i = 0; i < rest.length; i++) {
    if (claimed.has(getId(rest[i]))) continue
    const group = [rest[i]]
    for (let j = i + 1; j < rest.length; j++) {
      if (claimed.has(getId(rest[j]))) continue
      if (diceCoefficient(getTitle(rest[i]), getTitle(rest[j])) >= threshold) group.push(rest[j])
    }
    if (group.length < 2) continue
    group.forEach((g) => claimed.add(getId(g)))
    clusters.push({
      key: `near:${normalizeText(getTitle(rest[i]))}`,
      reason: 'Similar title',
      kind: 'near',
      items: group
    })
  }

  return clusters
}
