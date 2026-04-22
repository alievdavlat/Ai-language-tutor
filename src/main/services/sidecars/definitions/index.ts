import type { SidecarDefinition } from '../types.js'
import { KOKORO_SIDECAR } from './kokoro.js'
import { LANGUAGETOOL_SIDECAR } from './languagetool.js'
import { WHISPER_SIDECAR } from './whisper.js'

/** Every sidecar the manager is aware of at boot, in display order. */
export function allSidecarDefinitions(): SidecarDefinition[] {
  return [WHISPER_SIDECAR, LANGUAGETOOL_SIDECAR, KOKORO_SIDECAR]
}

export { KOKORO_SIDECAR, LANGUAGETOOL_SIDECAR, WHISPER_SIDECAR }
