/**
 * Realtime / live transport configuration.
 *
 * The live slice (multiplayer quiz, speaking-partner Meet, live streaming,
 * group rooms) needs two capabilities:
 *
 *   1. A SIGNALING / PRESENCE bus — small JSON messages (join/leave, chat,
 *      quiz state, WebRTC offer/answer/ICE) fanned out to everyone in a room.
 *   2. A MEDIA transport — actual audio/video between peers.
 *
 * We support a graceful ladder so the feature works with *zero* cloud keys in
 * dev/demo, and scales up when the operator provides credentials:
 *
 *   • Signaling:
 *       - `supabase`  → Supabase Realtime channels (broadcast + presence).
 *                       Real cross-machine. Picked when VITE_USE_SUPABASE=1 and
 *                       the URL + anon key are present (same flags the data
 *                       backend already uses — see services/backend/index.ts).
 *       - `broadcast` → BroadcastChannel API. Same-machine only (across browser
 *                       windows / Electron windows / tabs). Zero config — this
 *                       is what makes the live pages demoable with no backend.
 *
 *   • Media:
 *       - native WebRTC mesh (RTCPeerConnection), signaled over whichever bus
 *         above is active. Works peer-to-peer with public STUN. For reliable
 *         cross-NAT delivery a TURN server is required (VITE_TURN_*).
 *       - LiveKit (SFU) is the documented scale-up path for large rooms. When
 *         VITE_LIVEKIT_URL + a token endpoint are configured we surface it as
 *         available; the `livekit` engine module documents the integration.
 *
 * Nothing here throws when unconfigured — the live pages read these flags to
 * show an accurate "what's wired / what needs a server" banner.
 */

const env = (k: string): string | undefined => {
  if (typeof import.meta === 'undefined') return undefined
  const v = (import.meta.env as Record<string, unknown> | undefined)?.[k]
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

const supabaseOn =
  (env('VITE_USE_SUPABASE') === '1' || env('VITE_USE_SUPABASE') === 'true') &&
  !!env('VITE_SUPABASE_URL') &&
  !!env('VITE_SUPABASE_ANON_KEY')

export type SignalingTransport = 'supabase' | 'broadcast'

export interface IceServerConfig {
  urls: string | string[]
  username?: string
  credential?: string
}

/** Public Google STUN — fine for same-host / open NATs, not a relay. */
const DEFAULT_STUN: IceServerConfig = { urls: 'stun:stun.l.google.com:19302' }

function buildIceServers(): IceServerConfig[] {
  const servers: IceServerConfig[] = [DEFAULT_STUN]
  const turnUrl = env('VITE_TURN_URL')
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: env('VITE_TURN_USERNAME'),
      credential: env('VITE_TURN_CREDENTIAL')
    })
  }
  return servers
}

export interface RealtimeConfig {
  /** Which signaling/presence bus is active right now. */
  signaling: SignalingTransport
  /** True when the active bus reaches other machines (Supabase). */
  crossMachine: boolean
  /** ICE servers for RTCPeerConnection. */
  iceServers: IceServerConfig[]
  /** Whether a dedicated TURN relay was configured (needed across strict NATs). */
  hasTurn: boolean
  /** LiveKit SFU availability (scale path for large live rooms). */
  liveKit: {
    available: boolean
    url?: string
    tokenEndpoint?: string
  }
}

export const realtimeConfig: RealtimeConfig = {
  signaling: supabaseOn ? 'supabase' : 'broadcast',
  crossMachine: supabaseOn,
  iceServers: buildIceServers(),
  hasTurn: !!env('VITE_TURN_URL'),
  liveKit: {
    available: !!env('VITE_LIVEKIT_URL') && !!env('VITE_LIVEKIT_TOKEN_ENDPOINT'),
    url: env('VITE_LIVEKIT_URL'),
    tokenEndpoint: env('VITE_LIVEKIT_TOKEN_ENDPOINT')
  }
}

/**
 * Human-readable summary used by the live pages to render an honest status
 * banner. Returns the things that would need a server/env to go beyond
 * same-machine demo. Empty array = fully cloud-wired.
 */
export function realtimeRequirements(): string[] {
  const reqs: string[] = []
  if (realtimeConfig.signaling === 'broadcast') {
    reqs.push(
      'Cross-device sync needs Supabase Realtime — set VITE_USE_SUPABASE=1 with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY. Without it, rooms only sync between windows on this machine.'
    )
  }
  if (!realtimeConfig.hasTurn) {
    reqs.push(
      'Reliable video across networks needs a TURN relay — set VITE_TURN_URL (+ VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL). Without it, calls work on the same machine / open networks only.'
    )
  }
  if (!realtimeConfig.liveKit.available) {
    reqs.push(
      'Large live rooms (100s of viewers) need a LiveKit SFU — set VITE_LIVEKIT_URL + VITE_LIVEKIT_TOKEN_ENDPOINT. Without it, streaming uses a peer-to-peer mesh that suits small rooms.'
    )
  }
  return reqs
}

/** True when the live slice runs in same-machine demo mode (no cloud bus). */
export const isDemoRealtime = realtimeConfig.signaling === 'broadcast'
