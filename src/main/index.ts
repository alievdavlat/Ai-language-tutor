import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createAppWindow } from './app/window.js'
import { registerAllIpcHandlers } from './ipc/index.js'
import { bootstrapSidecars, getSidecarManager } from './services/sidecars/index.js'
import { disposeAutoUpdater } from './services/updater/index.js'
import {
  attachWindow,
  beginQuit,
  disposeDesktopIntegration,
  focusAndRoute,
  initDesktopIntegration,
  navigateTo,
  shouldStartHidden
} from './services/desktop/index.js'
import { parseRouteArg } from './services/desktop/routes.js'

// Single-instance lock (#16): a second launch (e.g. from a jump-list task or the
// installer) must hand off to the already-running window instead of opening a
// duplicate. If we don't get the lock we're the second instance — quit now and
// let the primary handle the relaunch via the `second-instance` event below.
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
}

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

// A second launch fires here on the primary instance: focus + deep-link.
app.on('second-instance', (_e, argv) => {
  focusAndRoute(argv)
})

if (gotSingleInstanceLock) {
  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('app.speaking')

    app.on('browser-window-created', (_e, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Load DesktopSettings + apply OS integration (tray, autostart, jump-list)
    // before the window exists, so "start hidden at login" and tray behaviour
    // are correct from the first frame.
    await initDesktopIntegration(() => mainWindow)

    registerAllIpcHandlers({ getWindow: () => mainWindow })

    // Sidecars are independent of the window — start them in the background so
    // window creation never blocks on a slow health check.
    void bootstrapSidecars().catch((err) => {
      console.error('[sidecars] bootstrap failed', err)
    })

    mainWindow = createAppWindow({ startHidden: shouldStartHidden() })
    attachWindow(mainWindow)

    // Cold start from a jump-list task (no running instance yet): deep-link once
    // the renderer is ready to receive it.
    const initialRoute = parseRouteArg(process.argv)
    if (initialRoute) {
      mainWindow.webContents.once('did-finish-load', () => navigateTo(initialRoute))
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createAppWindow()
        attachWindow(mainWindow)
      }
    })
  })
}

app.on('before-quit', async () => {
  // Let close-to-tray know this is a real quit so window.close() goes through.
  beginQuit()
  disposeAutoUpdater()
  disposeDesktopIntegration()
  try {
    await getSidecarManager().stopAll()
  } catch (err) {
    console.error('[sidecars] shutdown failed', err)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
