/**
 * Turn a raw provider HTTP failure into one short, human-readable line.
 *
 * Every adapter funnels its non-2xx responses through here so the user sees
 * "rate limit / quota reached — wait or pick a lighter model" instead of a
 * dump of `{ "error": { "code": 429, ... } }`. Applies uniformly to every
 * provider (Gemini, Claude, OpenAI-compatible).
 */

/** Pull a useful message out of a provider error body (JSON or text). */
function extractMessage(bodyText: string): string {
  const t = bodyText.trim()
  if (!t) return ''
  try {
    const j = JSON.parse(t)
    // Gemini / OpenAI: { error: { message } }; some: { error: "..."} or { message }
    const msg =
      j?.error?.message ??
      (typeof j?.error === 'string' ? j.error : undefined) ??
      j?.message
    if (typeof msg === 'string' && msg.trim()) return msg.trim().slice(0, 180)
  } catch {
    /* not JSON — fall through */
  }
  return t.slice(0, 160)
}

export function humanizeAIError(providerLabel: string, status: number, bodyText: string): string {
  const detail = extractMessage(bodyText)
  if (status === 429) {
    return `${providerLabel}: rate limit / quota reached. Free tiers cap requests per minute & per day — wait ~60s and retry, switch to a lighter model (Flash / Mini / Haiku / a "free" route), or check your plan & billing.`
  }
  if (status === 401 || status === 403) {
    return `${providerLabel}: the API key was rejected (${status}). Make sure you copied the whole key and that it's enabled for this model/region.`
  }
  if (status === 404) {
    return `${providerLabel}: model not found (404). This model may not be available for your key — pick a different model.`
  }
  if (status === 400) {
    return `${providerLabel}: request rejected (400)${detail ? ` — ${detail}` : ''}.`
  }
  if (status >= 500) {
    return `${providerLabel} is having server trouble (${status}). Try again in a moment.`
  }
  return `${providerLabel} error ${status}${detail ? `: ${detail}` : ''}.`
}
