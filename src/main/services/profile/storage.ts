import fs from 'node:fs/promises'
import path from 'node:path'
import type { UserProfile } from '@shared/types'
import { profileFilePath } from '../../utils/paths.js'

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const raw = await fs.readFile(profileFilePath(), 'utf-8')
    return JSON.parse(raw) as UserProfile
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
