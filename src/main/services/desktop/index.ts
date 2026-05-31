/**
 * Desktop integration orchestrator (#16).
 *
 * Owns the main-process side of: the tray icon, minimize/close-to-tray,
 * launch-on-login, the Windows jump-list, and the single-instance focus/deep-link
 * behaviour. The renderer only ever reads/patches DesktopSettings over IPC; this
 * module applies them to the OS and to the live window.
 *
 * Wiring (from the main entry):
 *   1. requestSingleInstanceLock()  — before anything else
 *   2. await initDesktopIntegration(getWindow)  — loads settings, tray, autostart
 *   3. create the window, then attachWindow(win)
 *   4. on second-instance / first-launch arg → focusAndRoute(argv)
 */
import { BrowserWindow, app } from 'electron'
import { DEFAULT_DESKTOP_SETTINGS, type DesktopSettings } from '@shared/types'
import { DESKTOP_CHANNELS } from '@shared/ipc'
import { loadDesktopSettings, saveDesktopSettings } from './settings.js'
import { applyAutostart, isAutostartEnabled, launchedHidden } from './autostart.js'
import { clearJumpList, setupJumpList } from './jumplist.js'
import { createTray, destroyTray, refreshTrayMenu } from './tray.js'
import { attachWindowBehavior } from './window-behavior.js'
import { parseRouteArg } from './routes.js'

let getWindowRef: () => BrowserWindow | null = () => null
let settings: DesktopSettings = { ...DEFAULT_DESKTOP_SETTINGS }
let quitting = false
const attached = new WeakSet<BrowserWindow>()

export function isDesktopQuitting(): boolean {
  return quitting
}

/** Flag a real quit so close-to-tray lets the window actually close. */
export function beginQuit(): void {
  quitting = true
}

export function getDesktopSettings(): DesktopSettings {
  return settings
}

/** Whether the current launch should start hidden (autostart + start-minimized). */
export function shouldStartHidden(): boolean {
  return settings.startMinimized && launchedHidden()
}

function showWindow(): void {
  const win = getWindowRef()
  if (!win || win.isDestroyed()) {
    // No window (e.g. after close-to-quit on mac) — recreate via activate path.
    app.emit('activate')
    return
  }
  if (win.isMinimized()) win.restore()
  if (!win.isVisible()) win.show()
  win.focus()
}

function hideWindow(): void {
  const win = getWindowRef()
  if (win && !win.isDestroyed()) win.hide()
}

function isWindowVisible(): boolean {
  const win = getWindowRef()
  return !!win && !win.isDestroyed() && win.isVisible()
}

/** Show the window and tell the renderer to navigate to an in-app route. */
export function navigateTo(route: string): void {
  showWindow()
  const win = getWindowRef()
  if (win && !win.isDestroyed()) win.webContents.send(DESKTOP_CHANNELS.NAVIGATE, route)
}

/** Focus the existing instance and deep-link if the relaunch carried a route. */
export function focusAndRoute(argv: readonly string[]): void {
  const route = parseRouteArg(argv)
  if (route) navigateTo(route)
  else showWindow()
}

function realQuit(): void {
  beginQuit()
  app.quit()
}

function applyTray(): void {
  if (settings.showTrayIcon) {
    createTray({
      showWindow,
      hideWindow,
      isWindowVisible,
      navigate: navigateTo,
      quit: realQuit
    })
    refreshTrayMenu()
  } else {
    destroyTray()
  }
}

/** Load settings + apply OS-level integration. Call once, before window create. */
export async function initDesktopIntegration(getWindow: () => BrowserWindow | null): Promise<void> {
  getWindowRef = getWindow
  settings = await loadDesktopSettings()
  // Reconcile our persisted flag with the OS's actual login-item state so the
  // UI never lies (e.g. the user removed the entry via Task Manager).
  settings.launchOnStartup = isAutostartEnabled() || settings.launchOnStartup
  applyAutostart(settings.launchOnStartup, settings.startMinimized)
  setupJumpList()
  applyTray()
}

/** Attach minimize/close-to-tray handlers to a window. Idempotent per window. */
export function attachWindow(win: BrowserWindow): void {
  if (attached.has(win)) return
  attached.add(win)
  attachWindowBehavior(win, { getSettings: getDesktopSettings, isQuitting: isDesktopQuitting })
}

/** Patch DesktopSettings, persist, and re-apply everything. Resolves to merged. */
export async function updateDesktopSettings(
  patch: Partial<DesktopSettings>
): Promise<DesktopSettings> {
  settings = { ...settings, ...patch }
  await saveDesktopSettings(settings)
  applyAutostart(settings.launchOnStartup, settings.startMinimized)
  applyTray()
  // If the tray was just turned off while the window is hidden, bring it back so
  // the user isn't stranded with no way to reach the app.
  if (!settings.showTrayIcon && !isWindowVisible()) showWindow()
  return settings
}

/** Tear down on app quit. */
export function disposeDesktopIntegration(): void {
  destroyTray()
  clearJumpList()
}
