# Backend architecture

The renderer talks to a single `Backend` interface (defined in
`src/renderer/src/services/backend/types.ts`). Every page imports through
`services/backend` — pages never reach into localStorage, IPC, or Supabase
directly. To go live, replace one file: `services/backend/index.ts`.

```ts
// services/backend/index.ts — current
import { localBackend } from './local'
export const backend = localBackend
```

```ts
// services/backend/index.ts — when Supabase lands
import { supabaseBackend } from './supabase'
export const backend = supabaseBackend
```

## What lives where

- `types.ts` — the `Backend` interface every implementation must satisfy.
- `local.ts` — in-process backend, persisted to `localStorage` under the key
  `speakai.backend.v1`. Used during UI iteration and as the dev seed for
  Electron preview. Every method is async to match the future Supabase shape.
- `seed.ts` — initial users / courses / posts / live streams shown on first
  launch. Swap or empty when wiring real data.
- `useBackend.ts` — tiny `useBackendQuery(fn, deps, initial)` hook that
  pages call. Returns `{ data, loading, refresh }`. Don't use `useEffect +
  fetch` directly — keep all backend access through this hook so the swap is
  a search-and-replace.

## Data shapes

See `src/shared/types/platform.types.ts`:

- `PlatformUser` — id, name, email, role (student | teacher), avatar,
  bio, native + target language, country, level.
- `Course` — id, teacherId, title, description, level, targetLanguage,
  cover gradient, pricing (free | one-off | sub), rating, reviewCount,
  enrollmentCount, hours, publishedAt (drafts have no publishedAt), capstone.
- `Unit` / `Lesson` — parent/child curriculum.
- `Post`, `Like`, `Save`, `Follow`, `Enrollment` — social + learning state.
- `LiveStream`, `LiveAnnouncement` — live tab data.
- `Notif` — notifications inbox.

## Swap checklist when moving to Supabase

1. Provision a Supabase project. Tables = data shapes in `platform.types.ts`.
2. Create `services/backend/supabase.ts` implementing the same `Backend`
   interface. Use `@supabase/supabase-js`.
3. Move the SQL schema into `supabase/migrations/`. RLS policies should match
   the access patterns: a user reads their own enrollments, anyone reads
   `publishedAt IS NOT NULL` courses, etc.
4. Replace the export in `services/backend/index.ts`.
5. No page-level code changes needed — every call site is already async and
   uses the same method names.

## Wiring auth

Clerk integration goes in two places only:
- `useAppStore.bootstrap()` reads the signed-in user from Clerk and calls
  `backend.signIn(email)` (or `signUp`) to mint/load the corresponding row.
- `SignInPage` swaps its inline form for `<SignIn />` from `@clerk/clerk-react`.

The rest of the app reads `backend.currentUserId()` regardless of where that
session originated.

## Realtime (LiveKit) wiring

`/live/room` and `/live/group` currently render mock peer tiles. To go real:
- Add a tiny token service (Cloudflare Worker / Edge Function) that signs
  LiveKit access tokens for the signed-in user.
- Replace the mock peer state in `LiveRoomPage` with `useRoom` from
  `@livekit/components-react`.

## Local backend lifetime

- The seed data is loaded on first `localStorage` read. After that, every
  mutation persists to `localStorage` synchronously.
- `signOut()` in the app store does NOT wipe the local backend store — only
  the auth flags. This lets two test users (e.g. one teacher, one student)
  share the same seeded courses/posts.
- Wipe by running `localStorage.removeItem('speakai.backend.v1')` in DevTools,
  or call `backend.signOut()` plus a hard reload.

## Extended data layer (2026-05-30 — platform foundation)

The `Backend` interface now covers every platform domain so feature sessions
wire to real data. New shapes live in `src/shared/types/platform-ext.types.ts`;
the Supabase tables in `supabase/migrations/0002_platform_ext.sql`. Both
`local.ts` and `supabase.ts` implement all of it behind the one interface.

Domains + key methods (all async, all on `backend`):

- **Users:** `listUsers({role?, q?, limit?})`, `signOut()`.
- **Enrollments:** `setEnrollmentProgress(userId, courseId, 0–100)`.
- **Reviews:** `listReviews(courseId)`, `createReview(...)` (recomputes course
  rating), `myReview(userId, courseId)`.
- **Groups / clubs:** `listGroups`, `getGroup`, `upsertGroup`, `joinGroup`,
  `leaveGroup`, `myGroups`, `groupMembers`.
- **Challenges:** `listChallenges({language?, active?})`, `upsertChallenge`,
  `joinChallenge`, `leaveChallenge`, `updateChallengeProgress`, `myChallenges`.
- **Exam attempts:** `recordExamAttempt(...)`, `listExamAttempts(userId, kind?)`.
- **Vocab (FSRS):** `listVocab`, `upsertVocab`, `deleteVocab`, `dueVocab` —
  `VocabItem` already carries the FSRS fields (`due/stability/difficulty/reps/
  lapses/state`). The scheduling algorithm is feature #7's job; the store is ready.
- **DMs:** `listThreads`, `getOrCreateThread`, `listMessages`, `sendMessage`,
  `markThreadRead`.
- **Media:** `listMedia`, `createMedia`, `deleteMedia`.
- **Announcements / notifications:** `createAnnouncement`, `createNotif`.
- **Stats & activity (#6/#18):** `getStats`, `recordActivity`, `listActivity`,
  `setDailyGoal`. Prefer the `services/activity` wrappers (`logActivity`,
  `useStats`, `useTodayProgress`) — they award default XP, fire realtime, and
  respect incognito.
- **GDPR (#39):** `exportUserData(userId)`, `deleteUserData(userId)`.

### Helpers around the backend (`services/backend` re-exports)

- **Uploads (#24):** `uploadFile(file, {prefix})` → `{url, path, …}`;
  `uploadAndRecord(file, ownerId)` → persisted `MediaAsset`. Supabase Storage
  `uploads` bucket when configured, base64 `data:` URL (≤4 MB) in local mode.
- **Realtime (#26):** `subscribeTable(table, cb, {event?, filter?})` and
  `joinRoom(roomId, presence?)`. Supabase Realtime when configured; same-tab
  `EventTarget` + cross-tab `storage` event fallback otherwise. `emitLocalChange`
  for optimistic local echoes.
- **One client:** `services/backend/client.ts` exposes `getSupabaseClient()` +
  `hasSupabaseEnv`; backend, storage, and realtime share it.

### Auth (#30)

`services/auth` — `signUp/signIn/quickContinue/signOut/persistRole`. Clerk is
unreachable in-region (`VITE_USE_CLERK=0`), so the default is a `users`-row
session keyed by email (offline-friendly). Set `VITE_USE_SUPABASE_AUTH=1` to
also drive real Supabase email/password auth. Role persists to the user row +
local store; AppRoutes role-gating is unchanged.

### i18n (#38) + privacy (#39)

- `src/renderer/src/i18n` — `useT()`, `useUILanguage()`, `<UILanguageSwitch>`;
  uz/en/ru tables in `i18n/strings.ts` (extend per feature, falls back to en).
- `services/privacy` — `exportMyData()`, `deleteMyAccount()`, `isIncognito()`,
  `isContentSafe()`. Two new `UserSettings` flags (`contentSafety`, `incognito`),
  undefined-safe. Surfaced in **Settings → Privacy** (`PrivacySection`).
