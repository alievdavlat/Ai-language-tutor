import { useCallback, useRef } from 'react'
import { getAudioConstraints, type MicProcessingPrefs } from '../lib/audio'

interface PTTOptions {
  mimeType?: string
  micPrefs?: MicProcessingPrefs
  onStop: (blob: Blob) => void | Promise<void>
}

interface PTTController {
  start: () => Promise<void>
  stop: () => Promise<void>
}

/**
 * MediaRecorder-backed push-to-talk recorder. Captures WebM/Opus by default.
 * Whisper happily consumes the resulting blob after it's base64-encoded.
 */
export function usePTTRecorder(opts: PTTOptions): PTTController {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const optsRef = useRef(opts)
  optsRef.current = opts

  const start = useCallback(async (): Promise<void> => {
    if (recorderRef.current) return
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: getAudioConstraints(optsRef.current.micPrefs)
    })
    streamRef.current = stream
    const recorder = new MediaRecorder(stream, {
      mimeType: optsRef.current.mimeType ?? 'audio/webm;codecs=opus'
    })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = async () => {
      const mime = recorder.mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: mime })
      chunksRef.current = []
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      recorderRef.current = null
      await optsRef.current.onStop(blob)
    }
    recorder.start()
    recorderRef.current = recorder
  }, [])

  const stop = useCallback(async (): Promise<void> => {
    const r = recorderRef.current
    if (!r) return
    if (r.state === 'recording') r.stop()
  }, [])

  return { start, stop }
}
