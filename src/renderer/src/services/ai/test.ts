/**
 * Tiny "is this API key live?" probe used by Settings → AI to give the user
 * immediate feedback. Sends one short prompt and reads the first delta — if
 * something comes back without an error, the key works.
 */
import type { AIProviderId } from '@shared/constants'
import { chatStream } from './router'

export interface TestResult {
  ok: boolean
  /** First few chars of the model's reply, or the error message on failure. */
  detail: string
  /** Round-trip ms — handy to surface latency in the UI. */
  ms: number
}

export async function testProvider(opts: {
  provider: AIProviderId
  model: string
  apiKey: string
}): Promise<TestResult> {
  const t0 = performance.now()
  const ac = new AbortController()
  // 12s ceiling — long enough for cold starts on slower providers, short
  // enough that a typoed key fails fast.
  const timeout = setTimeout(() => ac.abort(), 12_000)
  try {
    let preview = ''
    for await (const delta of chatStream(
      [
        { role: 'system', content: 'You are a connectivity test. Reply with exactly: "ok".' },
        { role: 'user', content: 'ping' }
      ],
      { ...opts, signal: ac.signal, maxTokens: 8, temperature: 0 }
    )) {
      preview += delta
      if (preview.length >= 8) break
    }
    clearTimeout(timeout)
    if (!preview.trim()) {
      return { ok: false, detail: 'Provider returned an empty response.', ms: Math.round(performance.now() - t0) }
    }
    return { ok: true, detail: preview.trim(), ms: Math.round(performance.now() - t0) }
  } catch (err) {
    clearTimeout(timeout)
    const detail = err instanceof Error ? err.message : String(err)
    return { ok: false, detail, ms: Math.round(performance.now() - t0) }
  }
}
