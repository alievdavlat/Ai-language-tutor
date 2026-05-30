/**
 * Productivity (#37) — main-process pieces:
 *  - a global quick-lookup hotkey (Ctrl/Cmd+Shift+Space) that focuses the app
 *    and tells the renderer to open the quick-lookup overlay;
 *  - an always-on-top frameless desktop widget window (daily word / streak).
 */
import { BrowserWindow, globalShortcut, screen, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRODUCTIVITY_CHANNELS } from '@shared/ipc'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRELOAD_PATH = join(__dirname, '../preload/index.mjs')
const RENDERER_FALLBACK_HTML = join(__dirname, '../renderer/index.html')

export const QUICK_LOOKUP_ACCELERATOR = 'CommandOrControl+Shift+Space'

let shortcutRegistered = false
let widgetWindow: BrowserWindow | null = null

/** Register the global quick-lookup shortcut. Returns whether it took. */
export function registerQuickLookupShortcut(getWindow: () => BrowserWindow | null): boolean {
  try {
    if (globalShortcut.isRegistered(QUICK_LOOKUP_ACCELERATOR)) {
      shortcutRegistered = true
      return true
    }
    shortcutRegistered = globalShortcut.register(QUICK_LOOKUP_ACCELERATOR, () => {
      const win = getWindow()
      if (!win) return
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
      win.webContents.send(PRODUCTIVITY_CHANNELS.QUICK_LOOKUP)
    })
    return shortcutRegistered
  } catch {
    shortcutRegistered = false
    return false
  }
}

export function isQuickLookupRegistered(): boolean {
  return shortcutRegistered
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
  shortcutRegistered = false
}

/** Toggle the desktop widget. Returns the new visibility. */
export function toggleWidgetWindow(): boolean {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.close()
    widgetWindow = null
    return false
  }
  const display = screen.getPrimaryDisplay()
  const { width } = display.workAreaSize
  widgetWindow = new BrowserWindow({
    width: 280,
    height: 200,
    x: width - 300,
    y: 40,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: PRELOAD_PATH,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  widgetWindow.setVisibleOnAllWorkspaces(true)
  widgetWindow.on('closed', () => { widgetWindow = null })

  const route = '#/widget'
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void widgetWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${route}`)
  } else {
    void widgetWindow.loadFile(RENDERER_FALLBACK_HTML, { hash: '/widget' })
  }
  widgetWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  return true
}
