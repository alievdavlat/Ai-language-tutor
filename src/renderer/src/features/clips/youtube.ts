import { useEffect, useRef, useState } from 'react'

// Minimal typing for the YouTube IFrame Player API we use. The API replaces a
// target <div> with an <iframe> and lets us play/pause/seek programmatically —
// which is what makes the per-line "sync-pause" real (a plain embed can't be
// controlled from JS).

interface YTPlayerInstance {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  destroy: () => void
}

interface YTNamespace {
  Player: new (
    el: HTMLElement | string,
    opts: {
      videoId: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: () => void
        onStateChange?: (e: { data: number }) => void
      }
    }
  ) => YTPlayerInstance
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null

function loadYouTubeAPI(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise<YTNamespace>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = (): void => {
      prev?.()
      if (window.YT) resolve(window.YT)
    }
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script')
      s.id = 'yt-iframe-api'
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    }
  })
  return apiPromise
}

export interface UseYouTubePlayer {
  ready: boolean
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  getTime: () => number
}

/**
 * Mount a controllable YouTube player into the element with `elementId`.
 * `onTick` fires ~4×/sec with the current playback time so the caller can
 * drive line tracking + sync-pause. No-op (ready stays false) when videoId is
 * empty — the caller then shows its gradient placeholder.
 */
export function useYouTubePlayer(
  elementId: string,
  videoId: string,
  onTick?: (time: number) => void
): UseYouTubePlayer {
  const [ready, setReady] = useState(false)
  const playerRef = useRef<YTPlayerInstance | null>(null)
  const tickRef = useRef(onTick)
  tickRef.current = onTick

  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    let interval: number | null = null

    void loadYouTubeAPI().then((YT) => {
      if (cancelled) return
      const el = document.getElementById(elementId)
      if (!el) return
      playerRef.current = new YT.Player(el, {
        videoId,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            if (cancelled) return
            setReady(true)
            interval = window.setInterval(() => {
              const p = playerRef.current
              if (p) tickRef.current?.(p.getCurrentTime())
            }, 250)
          }
        }
      })
    })

    return () => {
      cancelled = true
      if (interval !== null) window.clearInterval(interval)
      try {
        playerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      playerRef.current = null
      setReady(false)
    }
  }, [elementId, videoId])

  return {
    ready,
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    seekTo: (s: number) => playerRef.current?.seekTo(s, true),
    getTime: () => playerRef.current?.getCurrentTime() ?? 0
  }
}
