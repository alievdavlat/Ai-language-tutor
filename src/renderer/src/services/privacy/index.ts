/**
 * Privacy basics (Task #39). Thin layer over the backend's GDPR hooks plus the
 * content-safety + incognito settings flags.
 *
 * - exportMyData(): right to data portability — downloads a JSON of everything
 *   tied to the current user.
 * - deleteMyAccount(): right to erasure — hard-deletes all the user's rows then
 *   signs out.
 * - isIncognito(): activity tracking is paused (logActivity respects this).
 * - isContentSafe(): mature/unsafe content should be filtered (default ON).
 */
import { backend } from '../backend'
import * as auth from '../auth'
import { useAppStore } from '../../store/useAppStore'

/** Incognito = pause activity/stat tracking. Default OFF. */
export function isIncognito(): boolean {
  return useAppStore.getState().profile?.settings?.incognito === true
}

/** Safe-content filter. Default ON when the flag is unset (privacy-by-default). */
export function isContentSafe(): boolean {
  return useAppStore.getState().profile?.settings?.contentSafety !== false
}

/** Build the full export object for a user (defaults to current viewer). */
export async function getExport(userId?: string): Promise<Record<string, unknown> | null> {
  const id = userId ?? backend.currentUserId()
  if (!id) return null
  return backend.exportUserData(id)
}

/** Download the current user's data as a JSON file (browser/Electron renderer). */
export async function exportMyData(): Promise<void> {
  const data = await getExport()
  if (!data) throw new Error('No signed-in user to export.')
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `speakai-data-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke after a tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Erase everything tied to the current user, then sign out. */
export async function deleteMyAccount(): Promise<void> {
  const id = backend.currentUserId()
  if (id) await backend.deleteUserData(id)
  await auth.signOut()
}
