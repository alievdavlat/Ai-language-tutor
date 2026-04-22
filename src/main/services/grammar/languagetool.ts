import type { GrammarMatch, GrammarResult } from '@shared/types'

const LOCAL_URL = 'http://127.0.0.1:8010/v2/check'
const PUBLIC_URL = 'https://api.languagetool.org/v2/check'
const REQUEST_TIMEOUT_MS = 6000

interface LTRawMatch {
  message: string
  shortMessage?: string
  offset: number
  length: number
  replacements: Array<{ value: string }>
  rule: { id: string; category: { id: string } }
}

interface LTResponse {
  matches: LTRawMatch[]
}

function normalizeMatch(m: LTRawMatch): GrammarMatch {
  return {
    message: m.message,
    shortMessage: m.shortMessage,
    offset: m.offset,
    length: m.length,
    replacement: m.replacements[0]?.value ?? null,
    ruleId: m.rule.id,
    category: m.rule.category.id
  }
}

async function callLanguageTool(url: string, text: string): Promise<GrammarResult> {
  const body = new URLSearchParams({
    text,
    language: 'en-US',
    enabledOnly: 'false'
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
  if (!res.ok) throw new Error(`LanguageTool HTTP ${res.status}`)

  const data = (await res.json()) as LTResponse

  return {
    ok: true,
    matches: data.matches.map(normalizeMatch),
    source: url === LOCAL_URL ? 'local' : 'public'
  }
}

/**
 * Try the self-hosted LanguageTool JAR on localhost first. If unreachable,
 * fall back to the public API (rate-limited, but good enough for MVP).
 */
export async function checkGrammar(text: string): Promise<GrammarResult> {
  if (!text.trim()) return { ok: true, matches: [], source: 'local' }
  try {
    return await callLanguageTool(LOCAL_URL, text)
  } catch {
    try {
      return await callLanguageTool(PUBLIC_URL, text)
    } catch (err) {
      return {
        ok: false,
        matches: [],
        error: err instanceof Error ? err.message : String(err),
        source: 'public'
      }
    }
  }
}
