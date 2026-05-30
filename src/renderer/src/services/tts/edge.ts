/**
 * Microsoft Edge "read aloud" neural TTS over WebSocket — free, no API key,
 * Azure-quality voices. This is the same unofficial endpoint the popular
 * `edge-tts` Python/JS libraries use. It needs a short-lived DRM token
 * (`Sec-MS-GEC`) derived from the current time + a fixed trusted-client token.
 *
 * The endpoint can change without notice and CSP must allow the wss host; the
 * caller (services/tts/synthesize) falls back to the system voice if this
 * throws or times out.
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const WSS_BASE =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
// Format "1-<chromium-version>". Loosely tracks a recent Edge build.
const GEC_VERSION = '1-131.0.2903.112'
// 100-ns ticks between 1601-01-01 (Windows epoch) and 1970-01-01 (Unix epoch).
const WIN_EPOCH_SECONDS = 11644473600n

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/** Compute the Sec-MS-GEC DRM token for "now" (rounded down to a 5-min window). */
async function generateSecMsGec(): Promise<string> {
  const nowSec = BigInt(Math.floor(Date.now() / 1000)) + WIN_EPOCH_SECONDS
  const windowed = nowSec - (nowSec % 300n)
  const ticks = windowed * 10_000_000n // seconds → 100-ns units
  const str = `${ticks.toString()}${TRUSTED_CLIENT_TOKEN}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return toHex(digest)
}

function randomHex(len: number): string {
  const bytes = new Uint8Array(len / 2)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Convert a rate multiplier (1.0 = normal) into the SSML "+/-N%" string. */
function ratePct(rate: number): string {
  const pct = Math.round((rate - 1) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

function buildSSML(text: string, voice: string, lang: string, rate: number): string {
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>` +
    `<voice name='${voice}'>` +
    `<prosody pitch='+0Hz' rate='${ratePct(rate)}' volume='+0%'>${safe}</prosody>` +
    `</voice></speak>`
  )
}

export interface EdgeSynthOptions {
  voice: string
  lang: string
  rate: number
  /** Abort the socket early (barge-in / teardown). */
  signal?: AbortSignal
  /** Hard ceiling on the whole exchange. Default 15s. */
  timeoutMs?: number
}

/**
 * Synthesize `text` to an MP3 Blob over the Edge WebSocket endpoint.
 * Rejects on any protocol/connection error so the caller can fall back.
 */
export async function synthesizeEdge(text: string, opts: EdgeSynthOptions): Promise<Blob> {
  const gec = await generateSecMsGec()
  const url =
    `${WSS_BASE}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${GEC_VERSION}`
  const requestId = randomHex(32)
  const timeoutMs = opts.timeoutMs ?? 15_000

  return new Promise<Blob>((resolve, reject) => {
    let settled = false
    const audioParts: Uint8Array[] = []
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'

    const cleanup = (): void => {
      window.clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onAbort)
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close()
      } catch {
        /* ignore */
      }
    }
    const fail = (err: Error): void => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }
    const done = (): void => {
      if (settled) return
      settled = true
      cleanup()
      const total = audioParts.reduce((n, p) => n + p.length, 0)
      if (total === 0) {
        reject(new Error('Edge TTS returned no audio'))
        return
      }
      const merged = new Uint8Array(total)
      let off = 0
      for (const p of audioParts) {
        merged.set(p, off)
        off += p.length
      }
      resolve(new Blob([merged], { type: 'audio/mpeg' }))
    }

    const onAbort = (): void => fail(new Error('aborted'))
    if (opts.signal) {
      if (opts.signal.aborted) return fail(new Error('aborted'))
      opts.signal.addEventListener('abort', onAbort)
    }
    const timer = window.setTimeout(() => fail(new Error('Edge TTS timeout')), timeoutMs)

    ws.onopen = (): void => {
      const ts = new Date().toISOString()
      const config =
        `X-Timestamp:${ts}\r\n` +
        'Content-Type:application/json; charset=utf-8\r\n' +
        'Path:speech.config\r\n\r\n' +
        '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}'
      ws.send(config)
      const ssml = buildSSML(text, opts.voice, opts.lang, opts.rate)
      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        'Content-Type:application/ssml+xml\r\n' +
        `X-Timestamp:${ts}Z\r\n` +
        'Path:ssml\r\n\r\n' +
        ssml
      ws.send(ssmlMsg)
    }

    ws.onmessage = (ev: MessageEvent): void => {
      if (typeof ev.data === 'string') {
        if (ev.data.includes('Path:turn.end')) done()
        return
      }
      // Binary audio frame: [uint16 headerLen][header ascii][audio bytes].
      const view = new DataView(ev.data as ArrayBuffer)
      const headerLen = view.getUint16(0)
      const all = new Uint8Array(ev.data as ArrayBuffer)
      audioParts.push(all.subarray(2 + headerLen))
    }

    ws.onerror = (): void => fail(new Error('Edge TTS socket error'))
    ws.onclose = (ev: CloseEvent): void => {
      if (!settled) fail(new Error(`Edge TTS closed (${ev.code})`))
    }
  })
}
