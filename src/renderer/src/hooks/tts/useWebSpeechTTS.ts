import { useCallback, useEffect, useRef, useState } from 'react'
import { ACCENT_TO_LANG } from '@shared/constants'
import { pickVoice } from './voice-picker'
import type { TTSController, UseTTSOptions } from './types'

const VISEME_TIMER_MS = 40
const PRIMARY_FREQ = 11
const SECONDARY_FREQ = 3.1

function computeMouthOpenForTime(elapsedSec: number): number {
  const primary = 0.4 * Math.abs(Math.sin(elapsedSec * PRIMARY_FREQ))
  const secondary = 0.2 * Math.abs(Math.sin(elapsedSec * SECONDARY_FREQ))
  return Math.min(1, 0.35 + primary + secondary)
}

export function useWebSpeechTTS(opts: UseTTSOptions): TTSController {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speaking, setSpeaking] = useState(false)
  const [currentVisemeWeight, setCurrentVisemeWeight] = useState(0)
  const visemeTimerRef = useRef<number | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  useEffect(() => {
    const load = (): void => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const stopVisemeLoop = useCallback((): void => {
    if (visemeTimerRef.current !== null) {
      window.clearInterval(visemeTimerRef.current)
      visemeTimerRef.current = null
    }
    setCurrentVisemeWeight(0)
  }, [])

  const startVisemeLoop = useCallback((): void => {
    const start = performance.now()
    visemeTimerRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - start) / 1000
      setCurrentVisemeWeight(computeMouthOpenForTime(elapsed))
    }, VISEME_TIMER_MS) as unknown as number
  }, [])

  const cancel = useCallback(() => {
    stopVisemeLoop()
    window.speechSynthesis.cancel()
  }, [stopVisemeLoop])

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!text.trim()) {
          resolve()
          return
        }
        cancel()
        const utter = new SpeechSynthesisUtterance(text)
        const lang = ACCENT_TO_LANG[optsRef.current.accent]
        utter.lang = lang
        utter.rate = optsRef.current.rate ?? 1.0
        const allVoices = window.speechSynthesis.getVoices()
        const explicit =
          optsRef.current.voiceURI &&
          allVoices.find((x) => x.voiceURI === optsRef.current.voiceURI)
        const v = explicit ?? pickVoice(allVoices, lang)
        if (v) utter.voice = v

        utter.onstart = () => {
          setSpeaking(true)
          optsRef.current.onStart?.()
          startVisemeLoop()
        }
        const finish = (): void => {
          stopVisemeLoop()
          setSpeaking(false)
          optsRef.current.onEnd?.()
          resolve()
        }
        utter.onend = finish
        utter.onerror = finish
        window.speechSynthesis.speak(utter)
      }),
    [cancel, startVisemeLoop, stopVisemeLoop]
  )

  useEffect(() => () => cancel(), [cancel])

  return { speaking, voices, currentVisemeWeight, speak, cancel }
}
