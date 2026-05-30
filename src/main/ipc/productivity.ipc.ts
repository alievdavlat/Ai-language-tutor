import { app, ipcMain } from 'electron'
import { PRODUCTIVITY_CHANNELS } from '@shared/ipc'
import {
  isQuickLookupRegistered,
  registerQuickLookupShortcut,
  toggleWidgetWindow,
  unregisterAllShortcuts
} from '../services/productivity/index.js'
import type { IpcRegistrar } from './types.js'

export const registerProductivityIpc: IpcRegistrar = (ctx) => {
  // Register the global hotkey now that the app is ready.
  registerQuickLookupShortcut(ctx.getWindow)

  ipcMain.handle(PRODUCTIVITY_CHANNELS.TOGGLE_WIDGET, async () => toggleWidgetWindow())
  ipcMain.handle(PRODUCTIVITY_CHANNELS.SHORTCUT_STATUS, async () => isQuickLookupRegistered())

  app.on('will-quit', () => unregisterAllShortcuts())
}
