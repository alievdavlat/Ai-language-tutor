/**
 * Single entry point for the realtime/live transport. Picks the cross-device
 * Supabase Realtime provider when configured, else the same-machine
 * BroadcastChannel provider so the live pages work with zero backend.
 *
 * See config.ts for the env flags and `realtimeRequirements()` for the
 * honest "what still needs a server" list the live pages display.
 */
import { realtimeConfig } from './config'
import { broadcastProvider } from './broadcastChannel'
import { supabaseRealtimeProvider } from './supabaseRealtime'
import type { RealtimeChannel, RealtimeProvider } from './types'

export const realtimeProvider: RealtimeProvider =
  realtimeConfig.signaling === 'supabase' ? supabaseRealtimeProvider : broadcastProvider

/** Open a realtime channel for a room. Caller owns subscribe()/unsubscribe(). */
export function openChannel(roomId: string): RealtimeChannel {
  return realtimeProvider.channel(roomId)
}

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[realtime] signaling=${realtimeProvider.kind} crossMachine=${realtimeConfig.crossMachine}`)
}

export { realtimeConfig, realtimeRequirements, isDemoRealtime } from './config'
export type {
  RealtimeChannel,
  RealtimeProvider,
  PresencePeer,
  PresenceMeta,
  PeerId
} from './types'
