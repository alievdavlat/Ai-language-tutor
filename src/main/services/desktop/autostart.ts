/**
 * Launch-on-login (#16) via Electron's cross-platform login-item API. On Windows
 * this writes the `HKCU\…\Run` registry entry; on macOS it registers a login
 * item; on Linux electron doesn't support it (no-op, reported as unsupported).
 *
 * When "start minimized" is on we register the login entry with a `--hidden`
 * flag so the startup launch comes up silently in the tray (the entry checks
 * for this flag — see window creation in the main entry).
 */
import { app } from 'electron'

/** The arg the login-item launch carries so we know to start hidden. */
export const HIDDEN_LAUNCH_ARG = '--hidden'

/** Whether this OS supports the login-item API at all (Linux does not). */
export function autostartSupported(): boolean {
  return process.platform === 'win32' || process.platform === 'darwin'
}

/** Whether the current launch came from the login item with the hidden flag. */
export function launchedHidden(): boolean {
  if (process.argv.includes(HIDDEN_LAUNCH_ARG)) return true
  // macOS reports this directly rather than via argv.
  try {
    return app.getLoginItemSettings().wasOpenedAsHidden
  } catch {
    return false
  }
}

export function applyAutostart(launchOnStartup: boolean, startMinimized: boolean): void {
  if (!autostartSupported()) return
  try {
    app.setLoginItemSettings({
      openAtLogin: launchOnStartup,
      openAsHidden: startMinimized, // honored on macOS
      args: startMinimized ? [HIDDEN_LAUNCH_ARG] : [] // honored on Windows
    })
  } catch (err) {
    console.error('[desktop] failed to apply login item settings', err)
  }
}

/** Read back the OS's actual login-item state (source of truth on Windows). */
export function isAutostartEnabled(): boolean {
  if (!autostartSupported()) return false
  try {
    return app.getLoginItemSettings().openAtLogin
  } catch {
    return false
  }
}
