import { ipcRenderer } from 'electron'
import { PRODUCTIVITY_CHANNELS } from '@shared/ipc'

export interface ProductivityBridge {
  /** Subscribe to the global quick-lookup hotkey. Returns an unsubscribe fn. */
  onQuickLookup: (cb: () => void) => () => void
  /** Toggle the always-on-top desktop widget. Resolves to new visibility. */
  toggleWidget: () => Promise<boolean>
  /** Whether the global shortcut registered successfully. */
  shortcutStatus: () => Promise<boolean>
}

export const productivityBridge: ProductivityBridge = {
  onQuickLookup: (cb) => {
    const handler = (): void => cb()
    ipcRenderer.on(PRODUCTIVITY_CHANNELS.QUICK_LOOKUP, handler)
    return () => ipcRenderer.removeListener(PRODUCTIVITY_CHANNELS.QUICK_LOOKUP, handler)
  },
  toggleWidget: () => ipcRenderer.invoke(PRODUCTIVITY_CHANNELS.TOGGLE_WIDGET),
  shortcutStatus: () => ipcRenderer.invoke(PRODUCTIVITY_CHANNELS.SHORTCUT_STATUS)
}
