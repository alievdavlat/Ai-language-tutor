/**
 * Auto-update service (#43).
 *
 * Silent background updates via electron-updater + GitHub Releases. A user on
 * vX.Y.Z auto-updates to the next release with **no prompts**:
 *   - `autoDownload = true`        → a newer release downloads in the background
 *   - `autoInstallOnAppQuit = true` → it installs silently on the next app quit
 *
 * We check on launch (production only) and again every ~4 hours. Every state
 * change is pushed to the renderer over IPC so Settings → About can show
 * "Up to date / Update available / Restart to apply" without ever blocking.
 *
 * electron-updater ships as CommonJS — under Node ESM the named `autoUpdater`
 * export isn't reliably hoisted, so we pull it off the default import.
 */
import type { BrowserWindow } from 'electron'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import electronUpdater from 'electron-updater'
import { UPDATE_CHANNELS } from '@shared/ipc'
import type { UpdateStatus } from '@shared/types'

const { autoUpdater } = electronUpdater

/** Re-check this often once the app is running. */
const RECHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4h

let getWindow: (() => BrowserWindow | null) | null = null
let recheckTimer: ReturnType<typeof setInterval> | null = null

let status: UpdateStatus = {
  phase: 'idle',
  currentVersion: app.getVersion()
}

function emit(patch: Partial<UpdateStatus>): void {
  status = { ...status, ...patch }
  const win = getWindow?.()
  if (win && !win.isDestroyed()) {
    win.webContents.send(UPDATE_CHANNELS.CHANGED, status)
  }
}

export function getUpdateStatus(): UpdateStatus {
  return status
}

/** Force an immediate check. Safe to call repeatedly; no-ops in dev. */
export async function checkForUpdatesNow(): Promise<UpdateStatus> {
  if (is.dev) {
    // electron-updater refuses to run from an unpackaged dev build anyway;
    // short-circuit so the renderer gets a sensible "up-to-date" instead of an
    // "update feed unavailable" error during development.
    emit({ phase: 'up-to-date' })
    return status
  }
  try {
    emit({ phase: 'checking' })
    await autoUpdater.checkForUpdates()
  } catch (err) {
    emit({ phase: 'error', error: err instanceof Error ? err.message : String(err) })
  }
  return status
}

/**
 * Wire the autoUpdater up and kick off the first check. Called once from the
 * main entry after the window is created. `windowGetter` lets us push events to
 * whatever window is current.
 */
export function initAutoUpdater(windowGetter: () => BrowserWindow | null): void {
  getWindow = windowGetter

  // Silent: download as soon as an update is found, install on next quit.
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  // We surface our own status; electron-updater shouldn't pop native dialogs.
  autoUpdater.logger = null

  autoUpdater.on('checking-for-update', () => emit({ phase: 'checking' }))

  autoUpdater.on('update-available', (info) => {
    emit({
      phase: 'available',
      newVersion: info.version,
      progressPercent: 0,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined
    })
  })

  autoUpdater.on('update-not-available', () => emit({ phase: 'up-to-date' }))

  autoUpdater.on('download-progress', (p) => {
    emit({ phase: 'available', progressPercent: Math.round(p.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    // Stays staged until the user quits — autoInstallOnAppQuit handles it.
    emit({ phase: 'downloaded', newVersion: info.version, progressPercent: 100 })
  })

  autoUpdater.on('error', (err) => {
    emit({ phase: 'error', error: err instanceof Error ? err.message : String(err) })
  })

  // Production only: a dev build has no update feed / code signature to verify.
  if (is.dev) {
    emit({ phase: 'up-to-date' })
    return
  }

  void checkForUpdatesNow()
  recheckTimer = setInterval(() => void checkForUpdatesNow(), RECHECK_INTERVAL_MS)
}

export function disposeAutoUpdater(): void {
  if (recheckTimer) {
    clearInterval(recheckTimer)
    recheckTimer = null
  }
}
