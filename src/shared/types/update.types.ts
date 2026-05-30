/**
 * Auto-update status (#43). Surfaced to the renderer over IPC so Settings → About
 * can show "Up to date / Update available / Restart to apply" without ever
 * blocking the user. Downloads happen silently in the background; the silent
 * install runs on the next app quit (electron-updater `autoInstallOnAppQuit`).
 */
export type UpdatePhase =
  /** No check has completed yet this session. */
  | 'idle'
  /** A check is in flight. */
  | 'checking'
  /** A newer version exists and is downloading in the background. */
  | 'available'
  /** Background download finished — will install on next quit. */
  | 'downloaded'
  /** Running the newest version. */
  | 'up-to-date'
  /** Update feed/network error (non-fatal — the app keeps running). */
  | 'error'

export interface UpdateStatus {
  phase: UpdatePhase
  /** The version currently running (from package.json). */
  currentVersion: string
  /** The version offered by the feed, once known. */
  newVersion?: string
  /** 0–100 background download progress while `phase === 'available'`. */
  progressPercent?: number
  /** Human-readable error when `phase === 'error'`. */
  error?: string
  /** Release notes for the offered version, when the feed provides them. */
  releaseNotes?: string
}
