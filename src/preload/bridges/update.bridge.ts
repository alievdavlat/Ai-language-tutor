import { ipcRenderer } from 'electron'
import { UPDATE_CHANNELS } from '@shared/ipc'
import type { UpdateStatus } from '@shared/types'

export interface UpdateBridge {
  /** Current update status snapshot. */
  status: () => Promise<UpdateStatus>
  /** Force an immediate check (also runs on launch + every 4h in production). */
  check: () => Promise<UpdateStatus>
  /** Subscribe to status changes. Returns an unsubscribe fn. */
  onChange: (cb: (status: UpdateStatus) => void) => () => void
}

export const updateBridge: UpdateBridge = {
  status: () => ipcRenderer.invoke(UPDATE_CHANNELS.STATUS),
  check: () => ipcRenderer.invoke(UPDATE_CHANNELS.CHECK),
  onChange: (cb) => {
    const handler = (_e: unknown, status: UpdateStatus): void => cb(status)
    ipcRenderer.on(UPDATE_CHANNELS.CHANGED, handler)
    return () => ipcRenderer.removeListener(UPDATE_CHANNELS.CHANGED, handler)
  }
}
