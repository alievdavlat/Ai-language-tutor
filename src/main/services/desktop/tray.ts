/**
 * System-tray icon + context menu (#16). The tray is the way back to the window
 * once it's been hidden to tray, and a quick launcher (speaking / vocab /
 * progress) that deep-links the renderer.
 */
import { Menu, Tray, app } from 'electron'
import { createTrayIcon } from './icon.js'

export interface TrayDeps {
  /** Show + focus the main window (restoring/creating as needed). */
  showWindow: () => void
  /** Hide the main window to the tray. */
  hideWindow: () => void
  /** Whether the main window is currently visible (drives the toggle label). */
  isWindowVisible: () => boolean
  /** Deep-link the renderer to an in-app route (shows the window first). */
  navigate: (route: string) => void
  /** Begin a real quit (sets the quitting flag, then app.quit). */
  quit: () => void
}

let tray: Tray | null = null
let deps: TrayDeps | null = null

function buildMenu(): Menu {
  const d = deps!
  const visible = d.isWindowVisible()
  return Menu.buildFromTemplate([
    {
      label: visible ? 'Hide SpeakAI' : 'Open SpeakAI',
      click: () => (visible ? d.hideWindow() : d.showWindow())
    },
    { type: 'separator' },
    { label: 'Start speaking', click: () => d.navigate('/speaking') },
    { label: 'Vocabulary review', click: () => d.navigate('/vocabulary') },
    { label: 'Today’s progress', click: () => d.navigate('/progress') },
    { type: 'separator' },
    { label: 'Settings', click: () => d.navigate('/settings') },
    { type: 'separator' },
    { label: 'Quit SpeakAI', click: () => d.quit() }
  ])
}

export function createTray(trayDeps: TrayDeps): void {
  deps = trayDeps
  if (tray && !tray.isDestroyed()) {
    refreshTrayMenu()
    return
  }
  tray = new Tray(createTrayIcon())
  tray.setToolTip(`SpeakAI ${app.getVersion()}`)
  tray.setContextMenu(buildMenu())

  // Windows/Linux: a left-click brings the window back; the menu is right-click.
  tray.on('click', () => trayDeps.showWindow())
  // Rebuild the menu each time it opens so the Open/Hide label is current.
  tray.on('right-click', () => tray?.setContextMenu(buildMenu()))
}

export function refreshTrayMenu(): void {
  if (tray && !tray.isDestroyed() && deps) tray.setContextMenu(buildMenu())
}

export function destroyTray(): void {
  if (tray && !tray.isDestroyed()) tray.destroy()
  tray = null
}

export function hasTray(): boolean {
  return !!tray && !tray.isDestroyed()
}
