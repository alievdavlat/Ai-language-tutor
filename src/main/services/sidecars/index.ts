import { allSidecarDefinitions } from './definitions/index.js'
import { getSidecarManager, SidecarManager } from './sidecar-manager.js'

export { SidecarManager, getSidecarManager }
export type { SidecarDefinition } from './types.js'

/**
 * Registers the full sidecar catalog with the singleton manager and kicks
 * off every enabled sidecar. Called once from `app.whenReady()`.
 */
export async function bootstrapSidecars(): Promise<void> {
  const manager = getSidecarManager()
  for (const def of allSidecarDefinitions()) {
    await manager.register(def)
  }
  await manager.startAll()
}
