import net from 'node:net'
import type { HealthCheckConfig } from './types.js'

export interface HealthResult {
  ok: boolean
  detail?: string
}

async function checkHttp(url: string, timeoutMs: number): Promise<HealthResult> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (res.ok) return { ok: true, detail: `HTTP ${res.status}` }
    return { ok: false, detail: `HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

function checkPort(host: string, port: number, timeoutMs: number): Promise<HealthResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const settle = (result: HealthResult): void => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => settle({ ok: true, detail: `port ${port} open` }))
    socket.once('timeout', () => settle({ ok: false, detail: 'timeout' }))
    socket.once('error', (err) => settle({ ok: false, detail: err.message }))
    socket.connect(port, host)
  })
}

export async function runHealthCheck(cfg: HealthCheckConfig): Promise<HealthResult> {
  if (cfg.httpUrl) {
    return checkHttp(cfg.httpUrl, cfg.timeoutMs)
  }
  if (typeof cfg.port === 'number') {
    return checkPort(cfg.host ?? '127.0.0.1', cfg.port, cfg.timeoutMs)
  }
  return { ok: true, detail: 'no health check configured' }
}
