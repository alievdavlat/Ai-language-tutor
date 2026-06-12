import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Test runner config (#28). Mirrors the renderer's vite aliases so unit tests
 * import shared + renderer code exactly like the app does, and runs in jsdom so
 * React component tests work. Pure-logic tests need no DOM but jsdom is cheap.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify('test')
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/renderer/src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/renderer/src/**/*.{ts,tsx}', 'src/shared/**/*.ts'],
      exclude: ['**/*.test.*', '**/*.spec.*', 'src/renderer/src/test/**']
    }
  }
})
