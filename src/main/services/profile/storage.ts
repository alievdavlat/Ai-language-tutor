import fs from 'node:fs/promises'
import path from 'node:path'
import type { UserProfile } from '@shared/types'
import { profileFilePath } from '../../utils/paths.js'

/**
 * Heal settings that can't work on this runtime. Web Speech STT needs Google's
 * cloud recognizer, which Electron has no API key for — it always fails with a
 * `network` error — so any profile still pinned to it is migrated to the
 * locally-bundled Whisper engine that actually works (online or off).
 */
function normalizeProfile(profile: UserProfile): UserProfile {
  if (profile.settings?.sttEngine === 'web-speech') {
    return {
      ...profile,
      settings: { ...profile.settings, sttEngine: 'whisper-local' }
    }
  }
  return profile
}

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const raw = await fs.readFile(profileFilePath(), 'utf-8')
    return normalizeProfile(JSON.parse(raw) as UserProfile)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const target = profileFilePath()
  await fs.mkdir(path.dirname(target), { recursive: true })
  const next: UserProfile = { ...profile, updatedAt: new Date().toISOString() }
  await fs.writeFile(target, JSON.stringify(next, null, 2), 'utf-8')
}

export async function resetProfile(): Promise<void> {
  try {
    await fs.unlink(profileFilePath())
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
}
