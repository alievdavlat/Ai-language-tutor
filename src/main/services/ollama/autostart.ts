import { spawn } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import os from 'os'
import { getOllamaStatus } from './status.js'

/**
 * Candidate Ollama binary paths, in priority order.
 * We try the user's local Programs install first (typical Windows install),
 * then the system Programs Files, then rely on PATH.
 */
function candidatePaths(): string[] {
  const home = os.homedir()
  return [
    path.join(home, 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
    'C:\\Program Files\\Ollama\\ollama.exe',
    'ollama' // fallback: rely on PATH
  ]
}

function findOllamaBinary(): string | null {
  for (const candidate of candidatePaths()) {
    if (candidate === 'ollama') return candidate // always try PATH last
    if (existsSync(candidate)) return candidate
  }
  return null
}

let servePid: number | null = null

/**
 * Attempt to launch `ollama serve` if Ollama is installed but not running.
 * Returns true if the service appears to be running after this call.
 */
export async function ensureOllamaRunning(): Promise<boolean> {
  const initial = await getOllamaStatus()
  if (initial.running) return true

  const binary = findOllamaBinary()
  if (!binary) {
    console.info('[ollama:autostart] binary not found — user must install Ollama manually')
    return false
  }

  console.info('[ollama:autostart] launching', binary)
  try {
    const child = spawn(binary, ['serve'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    })
    child.unref()
    servePid = child.pid ?? null
  } catch (err) {
    console.error('[ollama:autostart] spawn failed', err)
    return false
  }

  // Poll for up to 12 seconds (6 attempts × 2 s) waiting for the service to be ready.
  for (let i = 0; i < 6; i++) {
    await new Promise<void>((r) => setTimeout(r, 2000))
    const status = await getOllamaStatus()
    if (status.running) {
      console.info('[ollama:autostart] service is up')
      return true
    }
  }

  console.warn('[ollama:autostart] service did not come up in time')
  return false
}

export function getServePid(): number | null {
  return servePid
}
