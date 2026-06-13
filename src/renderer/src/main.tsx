import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import ErrorBoundary from './components/feedback/ErrorBoundary'
import './index.css'

// Standalone browser preview: install an in-memory window.api so the app boots
// without the Electron preload bridge. No-op inside Electron (bridge exists)
// and stripped from production builds (import.meta.env.DEV guard).
if (import.meta.env.DEV && !window.api) {
  const { installDevApiMock } = await import('./services/devApiMock')
  installDevApiMock()
}

// ── YouTube OAuth popup handoff (#A23) ───────────────────────────────────────
// Google's implicit flow returns the access token in the URL fragment. In a
// HashRouter app that fragment collides with routing, so the /youtube/callback
// route may never mount. Catch the token here — BEFORE the router — whenever
// this window is the OAuth popup, hand it to the opener, and close. Works no
// matter what path Google redirected to (/youtube/callback, /auth/callback, …)
// because it scans every '#'/'?' segment of the href for the token.
function handleYouTubeOAuthRedirect(): boolean {
  if (typeof window === 'undefined' || !window.opener) return false
  const seg = window.location.href
    .split(/[#?]/)
    .find((p) => p.includes('access_token=') || p.includes('error='))
  if (!seg) return false
  const params = new URLSearchParams(seg)
  const accessToken = params.get('access_token')
  const error = params.get('error')
  if (!accessToken && !error) return false
  const payload = accessToken
    ? { source: 'yt-oauth' as const, accessToken, expiresIn: Number(params.get('expires_in') ?? '3600') }
    : { source: 'yt-oauth' as const, error: error ?? 'no_token' }
  try {
    window.opener.postMessage(payload, window.location.origin)
  } catch {
    /* opener gone */
  }
  document.body.innerHTML =
    '<div style="display:grid;place-items:center;height:100vh;font-family:sans-serif;color:#e2e8f0;background:#0a0e1f">Channel connected — you can close this window.</div>'
  setTimeout(() => window.close(), 500)
  return true
}

const isOAuthPopup = handleYouTubeOAuthRedirect()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

// ── Auth mode: Clerk PRIMARY, Supabase fallback ──────────────────────────────
// The user picked "Clerk first, Supabase as a safety net". Clerk's hosted
// instance can be unreachable in some regions (the documented bug), so rather
// than gamble on it at render time we PROBE the Clerk frontend-API at boot:
//   • reachable  → mount <ClerkProvider> → real Clerk sign-in (Google/Apple).
//   • unreachable→ skip Clerk entirely → SignInPage renders the Supabase Auth
//                  path (real email/password + OAuth). No blank screen, no fake
//                  sign-in. The decision is published on window.__SPEAKAI_AUTH_MODE
//                  so SignInPage knows which UI to show.
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const clerkEnabled = import.meta.env.VITE_USE_CLERK === '1' && !!clerkPubKey

/** Decode the Clerk frontend-API host from a `pk_test_…`/`pk_live_…` key. */
function clerkFrontendApi(pubKey: string): string | null {
  try {
    const b64 = pubKey.replace(/^pk_(test|live)_/, '')
    return atob(b64).replace(/\$+$/, '') || null
  } catch {
    return null
  }
}

/** Ping the Clerk frontend-API; resolve false on any network error / timeout.
 *  Capped at 2s so a region-blocked instance delays first paint by at most that
 *  (and offline short-circuits instantly) before falling back to Supabase. */
async function clerkReachable(pubKey: string, timeoutMs = 2000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  const host = clerkFrontendApi(pubKey)
  if (!host) return false
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    // no-cors → opaque response, but a thrown error means it's unreachable.
    await fetch(`https://${host}/v1/health`, { mode: 'no-cors', signal: ctrl.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

const useClerk = clerkEnabled && (await clerkReachable(clerkPubKey!))
;(window as unknown as { __SPEAKAI_AUTH_MODE?: 'clerk' | 'fallback' }).__SPEAKAI_AUTH_MODE =
  useClerk ? 'clerk' : 'fallback'
if (clerkEnabled && !useClerk) {
  console.warn('[auth] Clerk unreachable — falling back to Supabase Auth.')
}

function AppTree(): JSX.Element {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  )
}

/**
 * Clerk is optional and its hosted instance can be unreachable in some regions.
 * Mounting ClerkProvider OUTSIDE an error boundary means any init failure blanks
 * the whole app (the bug that forced VITE_USE_CLERK=0). So the ErrorBoundary is
 * now the OUTERMOST wrapper — a Clerk failure surfaces a recoverable error screen
 * instead of a silent white page. Enable with VITE_USE_CLERK=1 once the Clerk
 * instance is confirmed reachable.
 */
if (!isOAuthPopup) ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      {useClerk ? (
        <ClerkProvider
          publishableKey={clerkPubKey!}
          // Electron loads via file:// — we use HashRouter so all redirects can stay relative.
          signInFallbackRedirectUrl="/#/"
          signUpFallbackRedirectUrl="/#/"
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#2563EB',
              colorBackground: '#0a0e1f',
              colorText: '#e2e8f0',
              colorInputBackground: 'rgba(255,255,255,0.05)',
              colorInputText: '#e2e8f0'
            }
          }}
        >
          <AppTree />
        </ClerkProvider>
      ) : (
        <AppTree />
      )}
    </ErrorBoundary>
  </React.StrictMode>
)
