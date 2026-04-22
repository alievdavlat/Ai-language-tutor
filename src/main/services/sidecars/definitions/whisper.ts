import { listModels } from '../../stt/model-registry.js'
import type { VirtualSidecarDefinition } from '../types.js'

/**
 * Whisper runs in-process via nodejs-whisper — there is no daemon to spawn.
 * We surface it as a "virtual" sidecar so the orchestrator can report its
 * readiness (installed model count) next to the other sidecars.
 */
export const WHISPER_SIDECAR: VirtualSidecarDefinition = {
  name: 'whisper',
  label: 'Whisper (offline STT)',
  description: 'Speech-to-text via whisper.cpp. Runs per-transcription inside the Electron process.',
  kind: 'virtual',
  enabled: true,
  probeIntervalMs: 60_000,
  probe: async () => {
    const models = listModels()
    const installed = models.filter((m) => m.installed)
    if (installed.length === 0) {
      return { ok: false, detail: 'no whisper model downloaded yet' }
    }
    return { ok: true, detail: `${installed.length} model(s) ready` }
  }
}
