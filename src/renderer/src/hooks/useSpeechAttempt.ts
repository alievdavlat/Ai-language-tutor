import { useCallback, useEffect, useRef, useState } from 'react'
import { getSpeechRecognitionCtor, type SpeechRecognitionLike } from './stt/webspeech-types'

export interface SpeechAttempt {
  supported: boolean
  recording: boolean
  /** Live partial transcript while speaking. */
  interim: string
  /** Final accumulated transcript after stop. */
  transcript: string
  /** Recording length in seconds (set on stop). */
  durationSec: number
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

/**
 * One-shot push-to-talk capture for pronunciation / shadowing scoring. Uses
 * Web Speech recognition (continuous so a whole sentence is captured) and
 * accumulates the final transcript. The caller scores transcript vs target
 * with lib/pronunciation. Recognition runs offline-ish via the OS engine on
 * supported platforms; needs internet on some (Windows Chromium).
 */
export function useSpeechAttempt(lang = 'en-US'): SpeechAttempt {
  const Ctor = getSpeechRecognitionCtor()
  const [recording, setRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [transcript, setTranscript] = useState('')
  const [durationSec, setDurationSec] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const finalRef = useRef('')
  const startedAtRef = useRef(0)

  const stop = useCallback(() => {
    const r = recRef.current
    recRef.current = null
    if (startedAtRef.current) {
      setDurationSec((performance.now() - startedAtRef.current) / 1000)
      startedAtRef.current = 0
    }
    try {
      r?.stop()
    } catch {
      /* ignore */
    }
    setRecording(false)
    setInterim('')
  }, [])

  const reset = useCallback(() => {
    finalRef.current = ''
    setTranscript('')
    setInterim('')
    setDurationSec(0)
    setError(null)
  }, [])

  const start = useCallback(() => {
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser.')
      return
    }
    reset()
    const rec = new Ctor()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = true

    rec.onstart = () => {
      startedAtRef.current = performance.now()
      setRecording(true)
      setError(null)
    }
    rec.onresult = (event) => {
      let live = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalRef.current += (finalRef.current ? ' ' : '') + res[0].transcript.trim()
        else live += res[0].transcript
      }
      setInterim(live)
      setTranscript(finalRef.current)
    }
    rec.onerror = (e) => {
      setError(e.error === 'no-speech' ? "Didn't catch that — try again." : e.error)
      setRecording(false)
    }
    rec.onend = () => {
      setRecording(false)
      setInterim('')
      setTranscript(finalRef.current)
    }

    recRef.current = rec
    try {
      rec.start()
    } catch (err) {
      setError((err as Error).message)
    }
  }, [Ctor, lang, reset])

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return {
    supported: Ctor !== null,
    recording,
    interim,
    transcript,
    durationSec,
    error,
    start,
    stop,
    reset
  }
}
