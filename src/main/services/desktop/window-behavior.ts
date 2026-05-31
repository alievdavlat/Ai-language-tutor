/**
 * Minimize-to-tray / close-to-tray (#16). We attach `minimize` and `close`
 * handlers that hide the window instead of taskbar-minimizing or quitting, when
 * the matching DesktopSetting is on and the app isn't actually quitting.
 *
 * The handlers read live accessors (not a snapshot) so toggling the setting at
 * runtime takes effect without re-attaching anything.
 */
import type { BrowserWindow } from 'electron'
import type { DesktopSettings } from '@shared/types'

interface WindowBehaviorDeps {
  getSettings: () => DesktopSettings
  isQuitting: () => boolean
}

/** Idempotent: safe to call once per window. */
export function attachWindowBehavior(win: BrowserWindow, deps: WindowBehaviorDeps): void {
  win.on('minimize', () => {
    if (deps.getSettings().minimizeToTray && deps.getSettings().showTrayIcon) {
      win.hide() // remove from the taskbar; the tray icon is the way back
    }
  })

  win.on('close', (event) => {
    // A real quit (tray "Quit", app.quit, OS shutdown) must go through.
    if (deps.isQuitting()) return
    const s = deps.getSettings()
    if (s.closeToTray && s.showTrayIcon) {
      event.preventDefault()
      win.hide()
    }
  })
}
