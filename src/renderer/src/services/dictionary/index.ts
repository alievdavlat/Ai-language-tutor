/**
 * Dictionary lookup: offline-first (bundled WordNet-style data) with a free
 * online fallback (dictionaryapi.dev, no key) when the word isn't bundled and
 * the device is online. Powers press-hold-to-translate and the Dictionary page.
 */
import { lookupOffline, type DictEntry, type DictMeaning } from './data'

export type { DictEntry, DictMeaning } from './data'
export { PHRASEBOOK, lookupOffline } from './data'
export type { Phrase, PhraseCategory } from './data'

export interface LookupResult {
  entry: DictEntry | null
  source: 'offline' | 'online' | 'none'
}

interface ApiPhonetic { text?: string }
interface ApiDefinition { definition: string; example?: string }
interface ApiMeaning { partOfSpeech: string; definitions: ApiDefinition[] }
interface ApiEntry { word: string; phonetic?: string; phonetics?: ApiPhonetic[]; meanings: ApiMeaning[] }

const onlineCache = new Map<string, DictEntry | null>()

async function lookupOnline(word: string): Promise<DictEntry | null> {
  const key = word.trim().toLowerCase()
  if (onlineCache.has(key)) return onlineCache.get(key)!
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`)
    if (!res.ok) { onlineCache.set(key, null); return null }
    const data = (await res.json()) as ApiEntry[]
    const first = data?.[0]
    if (!first) { onlineCache.set(key, null); return null }
    const phonetic = first.phonetic || first.phonetics?.find((p) => p.text)?.text
    const meanings: DictMeaning[] = first.meanings.flatMap((m) =>
      m.definitions.slice(0, 2).map((d) => ({ pos: m.partOfSpeech, definition: d.definition, example: d.example }))
    )
    const entry: DictEntry = { word: first.word, phonetic, meanings: meanings.slice(0, 4) }
    onlineCache.set(key, entry)
    return entry
  } catch {
    onlineCache.set(key, null)
    return null
  }
}

/**
 * Look a word up. Resolves from the bundled dictionary instantly; if missing
 * and online, tries the free API. Never throws.
 */
export async function lookup(word: string): Promise<LookupResult> {
  const clean = word.trim().replace(/[^A-Za-z'-]/g, '')
  if (!clean) return { entry: null, source: 'none' }

  const offline = lookupOffline(clean)
  if (offline) return { entry: offline, source: 'offline' }

  const online = navigator.onLine ? await lookupOnline(clean) : null
  if (online) return { entry: online, source: 'online' }

  return { entry: null, source: 'none' }
}

/** Native-language gloss for a word, if bundled. */
export function translate(word: string, lang: string): string | undefined {
  return lookupOffline(word)?.tr?.[lang]
}
