import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * YouTube player that works under the app's strict `script-src 'self'` CSP by
 * talking to the embed over postMessage instead of loading YouTube's IFrame
 * API script. Reports playback time (for transcript sync) and supports seeking.
 */

export interface YouTubeHandle {
  seekTo(seconds: number): void
  play(): void
  pause(): void
}

interface YouTubeEmbedProps {
  videoId: string
  /** Fires ~4×/sec while playing with the current time in seconds. */
  onTime?: (seconds: number) => void
  onDuration?: (seconds: number) => void
  onStateChange?: (playing: boolean) => void
  autoplay?: boolean
  /** Bump to force a fresh load (replay from the start). */
  nonce?: number
  className?: string
}

function post(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []): void {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*'
  )
}

const YouTubeEmbed = forwardRef<YouTubeHandle, YouTubeEmbedProps>(function YouTubeEmbed(
  { videoId, onTime, onDuration, onStateChange, autoplay = false, nonce = 0, className },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [ready, setReady] = useState(false)

  useImperativeHandle(ref, () => ({
    seekTo: (s: number) => post(iframeRef.current, 'seekTo', [Math.max(0, s), true]),
    play: () => post(iframeRef.current, 'playVideo'),
    pause: () => post(iframeRef.current, 'pauseVideo')
  }), [])

  // Listen for the embed's infoDelivery messages (currentTime, duration, state).
  useEffect(() => {
    function onMessage(ev: MessageEvent): void {
      if (typeof ev.origin === 'string' && !ev.origin.includes('youtube.com')) return
      let data: unknown
      try { data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data } catch { return }
      const msg = data as { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number } }
      if (msg?.event === 'onReady' || msg?.event === 'initialDelivery') setReady(true)
      const info = msg?.info
      if (!info) return
      if (typeof info.currentTime === 'number') onTime?.(info.currentTime)
      if (typeof info.duration === 'number' && info.duration > 0) onDuration?.(info.duration)
      if (typeof info.playerState === 'number') onStateChange?.(info.playerState === 1)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onTime, onDuration, onStateChange])

  // Subscribe to the player's event stream once the iframe has loaded.
  function handleLoad(): void {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    // Tell the embed we want to receive event/info updates.
    win.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*')
    setReady(true)
  }

  // Re-arm the listening handshake shortly after (re)load — the embed isn't
  // always ready on the load event.
  useEffect(() => {
    const t = setTimeout(handleLoad, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, nonce])

  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&autoplay=${autoplay ? 1 : 0}`

  return (
    <iframe
      key={`${videoId}:${nonce}`}
      ref={iframeRef}
      onLoad={handleLoad}
      title={`YouTube video ${videoId}`}
      className={className ?? 'w-full h-full'}
      src={src}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      data-ready={ready}
    />
  )
})

export default YouTubeEmbed
