import { ipcRenderer } from 'electron'
import { DESKTOP_CHANNELS } from '@shared/ipc'
import type { DesktopSettings } from '@shared/types'

export interface DesktopBridge {
  /** Read the current desktop-integration settings. */
  getSettings: () => Promise<DesktopSettings>
  /** Patch desktop-integration settings; resolves to the merged result. */
  setSettings: (patch: Partial<DesktopSettings>) => Promise<DesktopSettings>
  /**
   * Subscribe to deep-link navigations from the tray menu / taskbar jump-list /
   * a second launch. Returns an unsubscribe fn.
   */
  onNavigate: (cb: (route: string) => void) => () => void
}

export const desktopBridge: DesktopBridge = {
  getSettings: () => ipcRenderer.invoke(DESKTOP_CHANNELS.GET_SETTINGS),
  setSettings: (patch) => ipcRenderer.invoke(DESKTOP_CHANNELS.SET_SETTINGS, patch),
  onNavigate: (cb) => {
    const handler = (_e: unknown, route: string): void => cb(route)
    ipcRenderer.on(DESKTOP_CHANNELS.NAVIGATE, handler)
    return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.NAVIGATE, handler)
  }
}
