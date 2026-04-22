import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { userDataPath } from '../../utils/paths.js'

const MAX_BYTES_PER_FILE = 512 * 1024 // 512 KB
const MAX_ROTATED_FILES = 3

export function sidecarLogDir(): string {
  return userDataPath('logs', 'sidecars')
}

export function sidecarLogFile(name: string): string {
  return path.join(sidecarLogDir(), `${name}.log`)
}

export async function ensureLogDir(): Promise<void> {
  await fsp.mkdir(sidecarLogDir(), { recursive: true })
}

function rotatedPath(base: string, i: number): string {
  return `${base}.${i}`
}

function rotateIfNeeded(filePath: string): void {
  try {
    const stats = fs.statSync(filePath)
    if (stats.size < MAX_BYTES_PER_FILE) return
  } catch {
    return
  }

  for (let i = MAX_ROTATED_FILES - 1; i >= 1; i--) {
    const older = rotatedPath(filePath, i)
    const newer = rotatedPath(filePath, i + 1)
    if (fs.existsSync(older)) {
      try {
        fs.renameSync(older, newer)
      } catch {
        // best-effort
      }
    }
  }
  try {
    fs.renameSync(filePath, rotatedPath(filePath, 1))
  } catch {
    // best-effort
  }
}

export class SidecarLogger {
  private readonly filePath: string

  constructor(public readonly name: string) {
    this.filePath = sidecarLogFile(name)
  }

  async init(): Promise<void> {
    await ensureLogDir()
  }

  append(stream: 'stdout' | 'stderr' | 'meta', line: string): void {
    rotateIfNeeded(this.filePath)
    const timestamp = new Date().toISOString()
    const entry = `[${timestamp}] [${stream}] ${line.trimEnd()}\n`
    try {
      fs.appendFileSync(this.filePath, entry, 'utf-8')
    } catch {
      // swallow — logging should never crash the app
    }
  }
}
