import { BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PRELOAD_PATH = join(__dirname, '../preload/index.mjs')
const RENDERER_FALLBACK_HTML = join(__dirname, '../renderer/index.html')

const WINDOW_DEFAULTS = {
  width: 1280,
  height: 820,
  minWidth: 1000,
  minHeight: 700,
  backgroundColor: '#0b1020'
} as const

export function createAppWindow(): BrowserWindow {
  const win = new BrowserWindow({
    ...WINDOW_DEFAULTS,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(RENDERER_FALLBACK_HTML)
  }

  return win
}
