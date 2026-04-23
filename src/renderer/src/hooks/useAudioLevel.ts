import { useEffect, useRef, useState } from 'react'
import { getAudioConstraints, type MicProcessingPrefs } from '../lib/audio'

interface UseAudioLevelOptions {
  enabled: boolean
  /** How many times per second to sample RMS. 30 is buttery for UI. */
  fps?: number
  /** Exponential smoothing factor — 0.25 is a nice "alive" feel. */
  smoothing?: number
  micPrefs?: MicProcessingPrefs
}

/**
 * Tap the default microphone and report its RMS level in the 0..1 range.
 * Useful for driving reactive visuals (voice orb, wave bars) without pulling
 * the raw audio stream into React state every frame.
 */
export function useAudioLevel(opts: UseAudioLevelOptions): number {
  const [level, setLevel] = useState(0)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const smoothedRef = useRef(0)

  useEffect(() => {
    if (!opts.enabled) return
    let cancelled = false

    const start = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: getAudioConstraints(opts.micPrefs)
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext!
        const ctx = new AudioCtx()
        ctxRef.current = ctx

        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.3
        source.connect(analyser)
        analyserRef.current = analyser

        const buffer = new Uint8Array(analyser.fftSize)
        const smoothing = opts.smoothing ?? 0.25
        const interval = 1000 / (opts.fps ?? 30)
        let last = performance.now()

        const tick = (now: number): void => {
          if (cancelled) return
          rafRef.current = requestAnimationFrame(tick)
          if (now - last < interval) return
          last = now

          analyser.getByteTimeDomainData(buffer)
          let sum = 0
          for (let i = 0; i < buffer.length; i++) {
            const v = (buffer[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / buffer.length)
          // Squash the typical 0..0.3 natural range into a livelier 0..1.
          const target = Math.min(1, rms * 3.5)
          smoothedRef.current = smoothedRef.current * (1 - smoothing) + target * smoothing
          setLevel(smoothedRef.current)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch (err) {
        console.error('[useAudioLevel] getUserMedia failed', err)
      }
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      analyserRef.current?.disconnect()
      ctxRef.current?.close().catch(() => {
        /* ignore */
      })
      streamRef.current?.getTracks().forEach((t) => t.stop())
      analyserRef.current = null
      ctxRef.current = null
      streamRef.current = null
      smoothedRef.current = 0
      setLevel(0)
    }
  }, [
    opts.enabled,
    opts.fps,
    opts.smoothing,
    opts.micPrefs?.noiseSuppression,
    opts.micPrefs?.echoCancellation,
    opts.micPrefs?.autoGainControl
  ])

  return level
}
