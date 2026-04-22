import type { SpawnedSidecarDefinition } from '../types.js'

/**
 * Placeholder definition for Phase 3.8 — Kokoro TTS Python sidecar.
 * Kept disabled so the manager simply reports it as `disabled` in the UI,
 * making the upcoming feature visible without any runtime side effects.
 *
 * When Phase 3.8 lands, set `enabled: true` and replace the command with the
 * actual Python daemon entrypoint produced by PythonBootstrap.
 */
export const KOKORO_SIDECAR: SpawnedSidecarDefinition = {
  name: 'kokoro-tts',
  label: 'Kokoro TTS (Phase 3.8)',
  description: 'Offline neural TTS with multi-accent voices. Coming in Phase 3.8.',
  kind: 'spawned',
  enabled: false,
  command: 'python',
  args: ['-m', 'kokoro_daemon'],
  healthCheck: {
    httpUrl: 'http://127.0.0.1:8766/health',
    intervalMs: 15_000,
    timeoutMs: 2_000,
    startupGraceMs: 4_000
  },
  restart: {
    enabled: true,
    maxAttempts: 5,
    initialBackoffMs: 1_000,
    maxBackoffMs: 30_000
  }
}
