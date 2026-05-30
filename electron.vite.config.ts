import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// App version from package.json, injected into the renderer as __APP_VERSION__
// (shown in the sidebar footer).
const appVersion = JSON.parse(readFileSync(resolve('package.json'), 'utf-8')).version as string

// fast-glob (used by vite-plugin-static-copy) only accepts POSIX paths. On
// Windows `path.resolve` hands back `C:\Users\...\foo\*.wasm` — we normalize
// to forward slashes before handing it over.
const posix = (...parts: string[]): string => resolve(...parts).replace(/\\/g, '/')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        input: resolve('src/main/index.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        input: resolve('src/preload/index.ts')
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    define: {
      __APP_VERSION__: JSON.stringify(appVersion)
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [
      react(),
      // Copy ONNX Runtime and Silero VAD binaries out of node_modules into
      // a predictable static path. Both renderer libs (@huggingface/transformers
      // and @ricky0123/vad-web) sit on top of onnxruntime-web, and Vite's
      // default optimizeDeps can't rewrite the dynamic WASM imports correctly —
      // so we serve the originals verbatim from `/vendor/*`.
      viteStaticCopy({
        targets: [
          { src: posix('node_modules/onnxruntime-web/dist/*.wasm'), dest: 'vendor/ort' },
          { src: posix('node_modules/onnxruntime-web/dist/*.mjs'), dest: 'vendor/ort' },
          { src: posix('node_modules/@ricky0123/vad-web/dist/*.onnx'), dest: 'vendor/vad' },
          {
            src: posix('node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js'),
            dest: 'vendor/vad'
          }
        ]
      })
    ],
    // Let Vite pre-bundle these — @ricky0123/vad-web ships as CJS, so without
    // pre-bundling the ESM `import { MicVAD }` fails ("does not provide an
    // export named 'MicVAD'"). Their dynamic WASM/worklet imports work fine
    // once we point them at /vendor/* via baseAssetPath / onnxWASMBasePath
    // (see `useVAD.ts` and `whisper-client.ts`).
    optimizeDeps: {
      include: ['@ricky0123/vad-web', 'onnxruntime-web', '@huggingface/transformers']
    },
    worker: {
      format: 'es'
    },
    build: {
      rollupOptions: {
        input: resolve('src/renderer/index.html')
      }
    }
  }
})
