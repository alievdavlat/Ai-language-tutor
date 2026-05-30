import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createAppWindow } from './app/window.js'
import { registerAllIpcHandlers } from './ipc/index.js'
import { bootstrapSidecars, getSidecarManager } from './services/sidecars/index.js'
import { disposeAutoUpdater } from './services/updater/index.js'

// Silence Chromium noise that doesn't apply to Electron:
//   - Autofill DevTools Protocol methods (no browser autofill here)
//   - Password manager prefetch, translation service, occlusion tracking
// These don't affect the app, but they clutter the console during development.
app.commandLine.appendSwitch(
  'disable-features',
  [
    'AutofillServerCommunication',
    'AutofillEnableAccountWalletStorage',
    'PasswordImport',
    'Translate',
    'CalculateNativeWinOcclusion',
    'HardwareMediaKeyHandling'
  ].join(',')
)
// Log level: 0 = INFO, 1 = WARNING, 2 = ERROR, 3 = FATAL. Keeping FATAL only
// muzzles `OnSizeReceived`/`chunked_data_pipe_upload_data_stream` warnings that
// Chromium fires when an HTTP stream is cancelled mid-flight (normal when
// Ollama errors out or DevTools aborts a request).
app.commandLine.appendSwitch('log-level', '3')

let mainWindow: BrowserWindow | null = null

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('app.speaking')

  app.on('browser-window-created', (_e, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAllIpcHandlers({ getWindow: () => mainWindow })

  // Sidecars are independent of the window — start them in the background so
  // window creation never blocks on a slow health check.
  void bootstrapSidecars().catch((err) => {
    console.error('[sidecars] bootstrap failed', err)
  })

  mainWindow = createAppWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createAppWindow()
    }
  })
})

app.on('before-quit', async () => {
  disposeAutoUpdater()
  try {
    await getSidecarManager().stopAll()
  } catch (err) {
    console.error('[sidecars] shutdown failed', err)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
