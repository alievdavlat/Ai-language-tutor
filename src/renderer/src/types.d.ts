/// <reference types="vite/client" />
import type { AppApi } from '../../preload/bridges/index.js'

declare global {
  interface Window {
    api: AppApi
  }
}

export {}
