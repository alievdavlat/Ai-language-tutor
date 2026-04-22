/**
 * Race a promise against a timeout, returning fallback if it doesn't resolve in time.
 * Used to keep startup snappy even when OS-level calls (WMI, etc.) hang.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ])
}
