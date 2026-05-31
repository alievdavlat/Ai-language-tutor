import { useEffect, useState } from 'react'

/**
 * OAuth redirect target (#25). Google's implicit flow returns the access token
 * in the URL fragment (`#access_token=…&expires_in=…`). We parse it, hand it
 * back to the window that opened this popup via postMessage, and close.
 *
 * Rendered outside the AppShell (no sidebar) — it's a transient popup page.
 */
export default function YouTubeCallbackPage(): JSX.Element {
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working')

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const expiresIn = Number(params.get('expires_in') ?? '3600')
    const error = params.get('error')

    const payload = accessToken
      ? { source: 'yt-oauth' as const, accessToken, expiresIn }
      : { source: 'yt-oauth' as const, error: error ?? 'no_token' }

    try {
      window.opener?.postMessage(payload, window.location.origin)
    } catch {
      /* opener gone */
    }
    setStatus(accessToken ? 'ok' : 'error')
    // Give the opener a beat to receive the message, then close.
    const t = setTimeout(() => window.close(), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="h-full min-h-screen grid place-items-center bg-canvas text-center px-6">
      <div>
        <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/15 grid place-items-center mb-4">
          <span className="text-2xl">▶</span>
        </div>
        <p className="text-white font-semibold">
          {status === 'working' ? 'Finishing connection…' : status === 'ok' ? 'Channel connected ✓' : 'Connection cancelled'}
        </p>
        <p className="text-sm text-slate-400 mt-1">You can close this window.</p>
      </div>
    </div>
  )
}
