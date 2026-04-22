import { ipcRenderer } from 'electron'
import { SIDECAR_CHANNELS } from '@shared/ipc'
import type {
  SidecarLogLine,
  SidecarStateChangeEvent,
  SidecarStatus
} from '@shared/types'

export interface SidecarsBridge {
  list: () => Promise<SidecarStatus[]>
  start: (name: string) => Promise<{ ok: boolean }>
  stop: (name: string) => Promise<{ ok: boolean }>
  restart: (name: string) => Promise<{ ok: boolean }>
  onStateChange: (listener: (event: SidecarStateChangeEvent) => void) => () => void
  onLog: (listener: (line: SidecarLogLine) => void) => () => void
}

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const wrapped = (_: unknown, payload: T): void => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.off(channel, wrapped)
}

export const sidecarsBridge: SidecarsBridge = {
  list: () => ipcRenderer.invoke(SIDECAR_CHANNELS.LIST),
  start: (name) => ipcRenderer.invoke(SIDECAR_CHANNELS.START, name),
  stop: (name) => ipcRenderer.invoke(SIDECAR_CHANNELS.STOP, name),
  restart: (name) => ipcRenderer.invoke(SIDECAR_CHANNELS.RESTART, name),
  onStateChange: (listener) => subscribe(SIDECAR_CHANNELS.STATE_CHANGED, listener),
  onLog: (listener) => subscribe(SIDECAR_CHANNELS.LOG, listener)
}
