# YouTube OAuth & import (#25)

The teacher *YouTube channel* page (`/teacher/youtube`) connects a Google
account, imports the channel's videos, and turns any pasted link into a lesson
or clip. It runs in **demo mode** with no credentials, and switches to the real
Google flow when env vars are present.

## What works without any keys

- **Paste-a-link metadata** — title, channel and thumbnail are fetched from
  `noembed.com` (CORS-friendly, keyless) with the public thumbnail CDN as a
  fallback. Fully functional offline-of-keys.
- **Demo connect / import** — a realistic demo channel + video set so the whole
  import → "make a lesson" / "cut a clip" flow is exercisable.

## Required environment (`.env.local`)

```ini
# OAuth 2.0 Web client id (Google Cloud Console → APIs & Services → Credentials)
VITE_YT_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com

# (optional) Data API v3 key — needed to list a channel's real videos
VITE_YT_API_KEY=AIza...

# OAuth redirect; defaults to <origin>/youtube/callback
VITE_YT_REDIRECT_URI=http://localhost:5173/youtube/callback
```

## Google Cloud setup

1. Create a project at <https://console.cloud.google.com>.
2. **APIs & Services → Library** → enable **YouTube Data API v3**.
3. **OAuth consent screen** → External → add the `youtube.readonly` scope and
   your test users.
4. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorized JavaScript origins: `http://localhost:5173` (dev), your prod origin.
   - Authorized redirect URIs: the `VITE_YT_REDIRECT_URI` above.
5. (Optional) **Create credentials → API key** for `VITE_YT_API_KEY`.

## Flow

```
Connect channel  ──▶  Google consent (scope: youtube.readonly)
       │                         │
       │                redirect to VITE_YT_REDIRECT_URI?code=…
       ▼                         ▼
 demo connection         exchange code → access token  (server-side / Electron)
                                 │
                          GET youtube/v3/search?channelId=…  → import videos
```

### Completing the real exchange

`services/studio/youtube.ts` builds the consent URL (`buildAuthUrl`) and opens
it. To finish in production you need a small token-exchange step that is **not**
safe to do purely in the renderer (it needs the client secret):

- **Electron**: handle the redirect in the main process (loopback `http://127.0.0.1`
  server or a custom `speakai://` scheme), exchange the `code` at
  `https://oauth2.googleapis.com/token`, and hand the access token back to the
  renderer, which calls `studio.setYouTubeConnection(...)` + `importChannelVideos`.
- **Web/Supabase**: do the exchange in an edge function and store the refresh
  token server-side.

Until that step is wired, the demo connection keeps every downstream screen
working.
