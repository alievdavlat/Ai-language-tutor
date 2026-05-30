/**
 * Free, keyless dictionary lookup for the quick-lookup overlay (#37).
 * Uses dictionaryapi.dev (CORS-friendly, no API key). Falls back gracefully.
 */
export interface LookupSense {
  partOfSpeech: string
  definition: string
  example?: string
}
export interface LookupResult {
  word: string
  phonetic?: string
  audio?: string
  senses: LookupSense[]
}

export async function lookupWord(raw: string): Promise<LookupResult | null> {
  const word = raw.trim().toLowerCase()
  if (!word) return null
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!res.ok) return { word, senses: [] }
    const data = (await res.json()) as Array<{
      word: string
      phonetic?: string
      phonetics?: { text?: string; audio?: string }[]
      meanings?: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[]
    }>
    const entry = data[0]
    if (!entry) return { word, senses: [] }
    const audio = entry.phonetics?.find((p) => p.audio)?.audio
    const senses: LookupSense[] = []
    for (const m of entry.meanings ?? []) {
      for (const d of m.definitions.slice(0, 2)) {
        senses.push({ partOfSpeech: m.partOfSpeech, definition: d.definition, example: d.example })
      }
    }
    return { word: entry.word, phonetic: entry.phonetic ?? entry.phonetics?.find((p) => p.text)?.text, audio, senses: senses.slice(0, 6) }
  } catch {
    return { word, senses: [] }
  }
}
