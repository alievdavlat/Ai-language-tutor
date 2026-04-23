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

/**
 * Pi-AI-style prosody shaping for Web Speech. We can't swap the voice
 * model, but we can vary rate/pitch per chunk so the monotone SAPI loop
 * breaks up. Rules:
 *   - short exclamations ("Oh!", "Really?", "Nice!") → slight pitch bump,
 *     faster rate → sounds reactive.
 *   - questions → pitch rises a hair, rate is normal.
 *   - everything else → tiny random jitter around the user's base rate
 *     (±4%) and base pitch (±5%) to kill the flat robot feel.
 *
 * Everything stays inside SAPI's comfortable range (rate 0.7–1.4, pitch
 * 0.85–1.15) so nothing sounds chipmunked.
 */
function shapeProsody(text: string, baseRate: number): { rate: number; pitch: number } {
  const trimmed = text.trim()
  const isShortExclaim = trimmed.length <= 18 && /[!]$/.test(trimmed)
  const isQuestion = /[?]\s*$/.test(trimmed)

  // Hash the text to a [-1, 1] jitter value so the same chunk never
  // gets two different prosodies in a row — but different chunks do.
  let h = 0
  for (let i = 0; i < trimmed.length; i++) h = (h * 31 + trimmed.charCodeAt(i)) | 0
  const jitter = ((h % 1000) / 1000) * 2 - 1 // -1..+1

  let rate = baseRate + jitter * 0.04 * baseRate
  let pitch = 1 + jitter * 0.05

  if (isShortExclaim) {
    rate = baseRate * 1.08
    pitch = 1.1
  } else if (isQuestion) {
    pitch = 1.05
  }

  // Hard-clamp to comfortable SAPI range.
  rate = Math.min(1.4, Math.max(0.7, rate))
  pitch = Math.min(1.15, Math.max(0.85, pitch))
  return { rate, pitch }
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
        const baseRate = optsRef.current.rate ?? 1.0
        const prosody = shapeProsody(text, baseRate)
        utter.rate = prosody.rate
        utter.pitch = prosody.pitch
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
