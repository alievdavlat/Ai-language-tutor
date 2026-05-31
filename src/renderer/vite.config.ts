import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone renderer vite config (browser preview only — no electron-vite wrapper)
// Runs from src/renderer/ — tailwind.config.js and postcss.config.js are in project root (../../)
export default defineConfig({
  root: resolve(__dirname),
  // NOTE: this standalone preview intentionally runs on the LOCAL mock backend
  // (no root .env.local loaded here) because it has no signed-in Supabase user —
  // forcing Supabase here would leave currentUserId null and blank every "my"
  // view. The real Electron app (root electron.vite.config + auth) uses Supabase.
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
