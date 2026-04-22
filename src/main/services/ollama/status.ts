import type { OllamaStatus } from '@shared/types'
import { OLLAMA_HOST } from './client.js'

interface TagsResponse {
  models?: Array<{ name: string }>
}

interface VersionResponse {
  version: string
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(2000)
    })
    if (!res.ok) {
      return {
        installed: true,
        running: false,
        models: [],
        error: `HTTP ${res.status}`
      }
    }
    const data = (await res.json()) as TagsResponse
    const models = (data.models ?? []).map((m) => m.name)

    let version: string | undefined
    try {
      const vRes = await fetch(`${OLLAMA_HOST}/api/version`, {
        signal: AbortSignal.timeout(1000)
      })
      if (vRes.ok) version = ((await vRes.json()) as VersionResponse).version
    } catch {
      // optional — continue without version
    }

    return { installed: true, running: true, version, models }
  } catch (err) {
    return {
      installed: false,
      running: false,
      models: [],
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
