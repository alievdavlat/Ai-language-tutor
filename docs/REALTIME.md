# Realtime / live slice

Covers the four live features:

- **#14 Live multiplayer quiz** (`/quiz/live`) — Kahoot-style room/PIN, synced
  questions, live self-scoring + presence leaderboard.
- **#15 Speaking-partner Meet** (`/meet`) — level/topic matchmaking queue +
  WebRTC 1:1 video (OmeTV-style skip/next), plus a group room.
- **#16 Live streaming + chat** (`/live`, `/live/room`) — host publishes camera,
  viewers watch, realtime chat + floating reactions, presence viewer counts,
  go-live flow.
- **#27 Group live** (`/live/group`) — 3–4 co-hosts share a multi-party video
  grid; host can remove participants; join/leave is live.

## Architecture

Two concerns, both behind small provider-agnostic seams in
`src/renderer/src/services/realtime/`:

### 1. Signaling / presence bus

Carries small JSON messages (join/leave, chat, quiz state, WebRTC
offer/answer/ICE) to everyone in a room, and tracks who is present.

| Transport | When it's picked | Reach |
|---|---|---|
| **Supabase Realtime** (`supabaseRealtime.ts`) | `VITE_USE_SUPABASE=1` + URL + anon key | Real, cross-device |
| **BroadcastChannel** (`broadcastChannel.ts`) | otherwise (default) | Same machine only (across windows/tabs) |

The factory in `index.ts` selects one; `config.ts` exposes the active choice and
`realtimeRequirements()` returns the honest "what still needs a server" list
that the live pages render via `<RealtimeStatus />`.

Supabase Realtime needs **no database tables** — broadcast + presence are
ephemeral. It's enabled by default on Supabase projects.

### 2. Media transport (audio/video)

`webrtc.ts` — a native `RTCPeerConnection` **mesh** using the standard
"perfect negotiation" pattern, signaled over whichever bus above is active.

- Perfect for **1:1** (Meet) and **small groups** (3–4 co-hosts, #27).
- Works peer-to-peer with public Google STUN. For reliable delivery across
  strict NATs/firewalls, configure a **TURN** relay.
- A full mesh is O(n²) connections — fine for small rooms, not for hundreds of
  viewers. For large audiences, swap in a **LiveKit SFU** (see below).

## Configuration ladder

All optional. With nothing set, everything works in same-machine demo mode.

| Env var | Effect |
|---|---|
| `VITE_USE_SUPABASE=1` + `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Rooms sync across devices via Supabase Realtime |
| `VITE_TURN_URL` (+ `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`) | Reliable video across strict NATs |
| `VITE_LIVEKIT_URL` + `VITE_LIVEKIT_TOKEN_ENDPOINT` | Marks the LiveKit SFU path as available (scale) |

Copy `.env.example` → `.env.local` and fill in. `.env.local` is gitignored.

## Testing locally with zero config

1. `npm run dev` (or the standalone renderer preview).
2. Open the app in **two windows** on the same machine.
3. **Quiz:** window A → `/quiz/live` → *Host a new game* → note the PIN.
   Window B → `/quiz/live` → enter the PIN → *Join*. Host starts; questions
   sync, scores appear on both leaderboards.
4. **Meet:** both windows → `/meet` → *Start matching* (same level/topic). They
   pair and a WebRTC video call opens (grant camera permission).
5. **Live:** window A → `/live` → *Go live* (host camera). Window B → click that
   stream tile → watch + chat. Chat and reactions flow both ways; viewer count
   tracks presence.
6. **Group:** both windows → `/live` → *Group live* — both appear in the grid.

> Cross-**device** testing needs Supabase Realtime turned on (otherwise the
> BroadcastChannel bus can't reach another machine). Cross-**network** video
> additionally needs a TURN relay.

## LiveKit (scale path) — what's required

The mesh is the default media engine and needs no server. To serve large live
audiences, run a [LiveKit](https://livekit.io) SFU instead:

1. Run a LiveKit server (Docker / LiveKit Cloud).
2. Stand up a **token endpoint** that mints room JWTs from your API key/secret
   (the secret must never reach the browser).
3. Set `VITE_LIVEKIT_URL` + `VITE_LIVEKIT_TOKEN_ENDPOINT`.
4. Install `livekit-client` and implement a LiveKit media engine alongside
   `webrtc.ts`, swapping it in when `realtimeConfig.liveKit.available` is true.

Until that engine is added, `realtimeConfig.liveKit.available` only gates the
status banner — the app keeps using the WebRTC mesh.

## Files

```
services/realtime/
  config.ts            env detection + requirements + ICE servers
  types.ts             RealtimeChannel / RealtimeProvider contracts
  broadcastChannel.ts  same-machine provider (presence via heartbeats)
  supabaseRealtime.ts  cross-device provider (Supabase broadcast + presence)
  webrtc.ts            RTCPeerConnection mesh (perfect negotiation) + getLocalMedia
  index.ts             provider factory + re-exports
hooks/realtime/
  useRealtimeRoom.ts   presence roster + event channel (quiz, chat-only)
  useMediaRoom.ts      channel + WebRTC mesh + local media + mic/cam controls
components/realtime/
  VideoTile.tsx        <video> bound to a MediaStream w/ avatar fallback
  RealtimeStatus.tsx   honest connected / demo-mode banner
features/quizlive/{questions.ts,useLiveQuiz.ts,LiveQuizPage.tsx}
features/meet/{useMeetQueue.ts,MeetPage.tsx}
features/live/{LivePage.tsx,LiveRoomPage.tsx}
```
