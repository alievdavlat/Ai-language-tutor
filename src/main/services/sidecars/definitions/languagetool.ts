import type { ExternalMonitorDefinition } from '../types.js'

/**
 * LanguageTool runs as an external JAR on port 8010 (started by the user or
 * installed by Phase 6). We don't spawn it — we only health-check it so the
 * Settings page can show whether the self-hosted grammar is reachable.
 */
export const LANGUAGETOOL_SIDECAR: ExternalMonitorDefinition = {
  name: 'languagetool',
  label: 'LanguageTool (self-host)',
  description:
    'Local grammar checker on http://127.0.0.1:8010. Falls back to the public API when offline.',
  kind: 'external-monitor',
  enabled: true,
  healthCheck: {
    httpUrl: 'http://127.0.0.1:8010/v2/languages',
    intervalMs: 30_000,
    timeoutMs: 2_000,
    startupGraceMs: 0
  }
}
