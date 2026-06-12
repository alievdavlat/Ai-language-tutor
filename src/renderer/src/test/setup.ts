/**
 * Vitest global setup (#28). Adds jest-dom matchers and a localStorage stub so
 * stores that read window.localStorage at import time don't explode in jsdom.
 */
import '@testing-library/jest-dom/vitest'

// jsdom provides localStorage, but guard for any environment that doesn't.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    }
  } as Storage
}
