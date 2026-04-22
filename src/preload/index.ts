import { contextBridge } from 'electron'
import { api } from './bridges/index.js'
export type { AppApi } from './bridges/index.js'

contextBridge.exposeInMainWorld('api', api)
