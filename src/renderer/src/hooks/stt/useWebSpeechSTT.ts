import { useCallback, useEffect, useRef, useState } from 'react'
import { getSpeechRecognitionCtor, type SpeechRecognitionLike } from './webspeech-types'
import type { STTController, STTState, UseSTTOptions } from './types'

const RESTART_DELAY_MS = 200

type WebSpeechOptions = Omit<UseSTTOptions, 'engine'>

export function useWebSpeechSTT(opts: WebSpeechOptions): STTController {
  const Ctor = getSpeechRecognitionCtor()
  const [state, setState] = useState<STTState>({
    listening: false,
    interim: '',
    supported: Ctor !== null,
    error: null
  })
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldRestartRef = useRef(false)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const stop = useCallback(() => {
    // Hard stop — never restart after an explicit user stop.
    shouldRestartRef.current = false
    const r = recognitionRef.current
    recognitionRef.current = null
    try {
      r?.abort()
    } catch {
      // ignore — recognition might not be running
    }
    setState((prev) => ({ ...prev, listening: false, interim: '' }))
  }, [])

  const start = useCallback(() => {
    if (!Ctor) {
      setState((prev) => ({ ...prev, error: 'SpeechRecognition not supported' }))
      return
    }
    if (recognitionRef.current) stop()

    const recognition = new Ctor()
    recognition.lang = optsRef.current.lang ?? 'en-US'
    recognition.interimResults = true
    recognition.continuous = optsRef.current.mode === 'always-on'

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, listening: true, error: null }))
    }

    // Fires as soon as the browser detects the user speaking — this is the
    // cheapest barge-in trigger since it runs before the transcript arrives.
    recognition.onspeechstart = () => {
      optsRef.current.onSpeechStart?.()
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) final += res[0].transcript
        else interim += res[0].transcript
      }
      if (interim) {
        setState((prev) => ({ ...prev, interim }))
        optsRef.current.onInterim?.(interim)
      }
      if (final.trim()) {
        optsRef.current.onFinal(final.trim())
        setState((prev) => ({ ...prev, interim: '' }))
      }
    }

    recognition.onerror = (e) => {
      setState((prev) => ({ ...prev, error: e.error, listening: false }))
    }

    recognition.onend = () => {
      setState((prev) => ({ ...prev, listening: false, interim: '' }))
      if (shouldRestartRef.current && optsRef.current.enabled !== false) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {
            // ignore
          }
        }, RESTART_DELAY_MS)
      }
    }

    recognitionRef.current = recognition
    shouldRestartRef.current = optsRef.current.mode === 'always-on'

    try {
      recognition.start()
    } catch (err) {
      setState((prev) => ({ ...prev, error: (err as Error).message }))
    }
  }, [Ctor, stop])

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      try {
        recognitionRef.current?.abort()
      } catch {
        // ignore
      }
    }
  }, [])

  return { state, start, stop }
}
