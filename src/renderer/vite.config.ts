import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone renderer vite config (browser preview only — no electron-vite wrapper)
// Runs from src/renderer/ — tailwind.config.js and postcss.config.js are in project root (../../)
export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../../src/shared')
    }
  },
  css: {
    postcss: resolve(__dirname, '../../postcss.config.js')
  },
  plugins: [react()],
  server: {
    port: 5175
  }
})
