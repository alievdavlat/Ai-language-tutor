/**
 * Desktop integration (#16) — OS-level behaviours that live in the Electron main
 * process: the tray icon, minimize/close-to-tray, and launch-on-login. All flags
 * are persisted main-side (so the login item + tray behave correctly even before
 * the renderer loads) and mirrored to Settings → Desktop over IPC.
 *
 * Every field is required here, but the persisted file is merged over
 * `DEFAULT_DESKTOP_SETTINGS` on load so older files missing a key keep working.
 */
export interface DesktopSettings {
  /** Show the system-tray (notification-area) icon + menu at all. */
  showTrayIcon: boolean
  /** Minimizing the window hides it to the tray instead of the taskbar. */
  minimizeToTray: boolean
  /** Closing the window hides it to the tray instead of quitting the app. */
  closeToTray: boolean
  /** Launch the app automatically when the user logs in. */
  launchOnStartup: boolean
  /** When launched at login, start hidden in the tray (no window flash). */
  startMinimized: boolean
}

export const DEFAULT_DESKTOP_SETTINGS: DesktopSettings = {
  showTrayIcon: true,
  minimizeToTray: false,
  closeToTray: true,
  launchOnStartup: false,
  startMinimized: false
}
