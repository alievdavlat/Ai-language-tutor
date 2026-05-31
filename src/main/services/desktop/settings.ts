/**
 * Persisted DesktopSettings (#16). Owned by the main process so the login-item
 * and tray behaviour are correct from the very first line of startup — before
 * the renderer (which owns UserSettings in localStorage) has even loaded.
 *
 * Stored as a small JSON file in userData, merged over the defaults on read so
 * a file written by an older build that lacks a key keeps working.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { DEFAULT_DESKTOP_SETTINGS, type DesktopSettings } from '@shared/types'
import { userDataPath } from '../../utils/paths.js'

function settingsFilePath(): string {
  return userDataPath('desktop-settings.json')
}

export async function loadDesktopSettings(): Promise<DesktopSettings> {
  try {
    const raw = await fs.readFile(settingsFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<DesktopSettings>
    return { ...DEFAULT_DESKTOP_SETTINGS, ...parsed }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { ...DEFAULT_DESKTOP_SETTINGS }
    // A corrupt file shouldn't brick startup — fall back to defaults.
    return { ...DEFAULT_DESKTOP_SETTINGS }
  }
}

export async function saveDesktopSettings(settings: DesktopSettings): Promise<void> {
  const target = settingsFilePath()
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, JSON.stringify(settings, null, 2), 'utf-8')
}
