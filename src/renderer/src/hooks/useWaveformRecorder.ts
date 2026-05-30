import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioConstraints } from '../lib/audio'

export interface WaveformRecorder {
  recording: boolean
  /** Live amplitude bars (0–1), newest pushed on the right while recording. */
  levels: number[]
  /** Downsampled bar set captured for the whole take (set on stop). */
  bars: number[]
  /** Object URL of the recorded audio, for replay (set on stop). */
  audioUrl: string | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

const BAR_COUNT = 48

/**
 * Records the mic with a live amplitude meter (AnalyserNode RMS) and keeps the
 * audio for replay. The bars are real, sampled from the user's voice — used by
 * Shadowing to show the take and (with transcript scoring) compare to target.
 */
export function useWaveformRecorder(): WaveformRecorder {
  const [recording, setRecording] = useState(false)
  const [levels, setLevels] = useState<number[]>([])
  const [bars, setBars] = useState<number[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const historyRef = useRef<number[]>([])
  const prevUrlRef = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
  }, [])

  const start = useCallback(async (): Promise<void> => {
    setError(null)
    setBars([])
    historyRef.current = []
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
      setAudioUrl(null)
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: getAudioConstraints() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied.')
      return
    }
    streamRef.current = stream

    // Recorder (for replay).
    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      const url = URL.createObjectURL(blob)
      prevUrlRef.current = url
      setAudioUrl(url)
      // Downsample the amplitude history into BAR_COUNT bars.
      const hist = historyRef.current
      const out: number[] = []
      for (let i = 0; i < BAR_COUNT; i++) {
        const slice = hist.slice(
          Math.floor((i / BAR_COUNT) * hist.length),
          Math.floor(((i + 1) / BAR_COUNT) * hist.length)
        )
        out.push(slice.length ? Math.max(...slice) : 0)
      }
      setBars(out)
    }
    recorder.start()
    recorderRef.current = recorder

    // Analyser (for live meter).
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    source.connect(analyser)
    const buf = new Uint8Array(analyser.fftSize)

    const tick = (): void => {
      analyser.getByteTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.min(1, Math.sqrt(sum / buf.length) * 3)
      historyRef.current.push(rms)
      setLevels((prev) => {
        const next = [...prev, rms]
        return next.length > BAR_COUNT ? next.slice(next.length - BAR_COUNT) : next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    setLevels([])
    rafRef.current = requestAnimationFrame(tick)
    setRecording(true)
  }, [])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    cleanup()
    setRecording(false)
  }, [cleanup])

  useEffect(() => {
    return () => {
      cleanup()
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [cleanup])

  return { recording, levels, bars, audioUrl, error, start, stop }
}
