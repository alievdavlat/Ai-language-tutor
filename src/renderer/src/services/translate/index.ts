/**
 * Tiny free translation helper (no API key). Used to render vocabulary meanings
 * in the learner's native language when no bundled translation exists.
 *
 * Backend: MyMemory (https://mymemory.translated.net) — free, key-less, CORS-
 * enabled, ~anonymous daily quota. Results are cached in localStorage so we
 * never re-hit the network for the same word, and the app stays usable offline
 * once a word has been seen.
 *
 * Best-effort by design: any failure returns `null` so callers fall back to the
 * original text rather than blocking the UI.
 */

const CACHE_KEY = 'speakai.translateCache.v1'
type Cache = Record<string, string>

let mem: Cache | null = null

function load(): Cache {
  if (mem) return mem
  try {
    mem = JSON.parse(window.localStorage?.getItem(CACHE_KEY) ?? '{}') as Cache
  } catch {
    mem = {}
  }
  return mem
}

function persist(): void {
  try {
    window.localStorage?.setItem(CACHE_KEY, JSON.stringify(mem ?? {}))
  } catch {
    /* quota / unavailable — cache stays in-memory only */
  }
}

const key = (text: string, from: string, to: string): string => `${from}|${to}|${text.toLowerCase()}`

/**
 * Translate `text` from `from` to `to`. Returns the cached/translated string,
 * or `null` if the language pair is trivial (same language) or the lookup fails.
 */
export async function translate(text: string, from: string, to: string): Promise<string | null> {
  const clean = text.trim()
  if (!clean || from === to) return null

  const cache = load()
  const k = key(clean, from, to)
  if (cache[k]) return cache[k]

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number }
    const out = data.responseData?.translatedText?.trim()
    // MyMemory echoes the input (or an error sentence) on failure — reject those.
    if (!out || out.toLowerCase() === clean.toLowerCase() || /^(MYMEMORY|INVALID|PLEASE)/i.test(out)) {
      return null
    }
    cache[k] = out
    persist()
    return out
  } catch {
    return null
  }
}
