import { useCallback, useRef, useState } from 'react'
import type { TTSProviderId } from '@shared/constants'
import { useAppStore } from '../../store/useAppStore'
import { useWebSpeechTTS } from './useWebSpeechTTS'
import { synthesizeSpeech, isCloudTTSSupported } from '../../services/tts/synthesize'
import type { TTSController, UseTTSOptions } from './types'

const VISEME_TIMER_MS = 40
const PRIMARY_FREQ = 11
const SECONDARY_FREQ = 3.1

function computeMouthOpenForTime(elapsedSec: number): number {
  const primary = 0.4 * Math.abs(Math.sin(elapsedSec * PRIMARY_FREQ))
  const secondary = 0.2 * Math.abs(Math.sin(elapsedSec * SECONDARY_FREQ))
  return Math.min(1, 0.35 + primary + secondary)
}

/** Free, no-key cloud engines — usable without a pasted API key. */
const KEYLESS: TTSProviderId[] = ['edge', 'pollinations']

/**
 * Dispatcher for TTS engines. Honors the voice the user picked in
 * Settings → Companion → Voice (`profile.settings.tts.activeProviderId`):
 *
 *   - `system`            → built-in Web Speech / SAPI (offline default)
 *   - `edge` / `pollinations` → free neural cloud voices, no key
 *   - `elevenlabs` / `openai` / `google` → neural cloud voices once a key is set
 *
 * Cloud engines synthesize an audio Blob and play it through an <audio>
 * element; on any failure we transparently fall back to the system voice so
 * speech never silently drops. `speak()` still resolves only when playback
 * finishes (the streaming-speaker queue relies on that), and `cancel()` aborts
 * the in-flight fetch + stops playback so barge-in stays instant.
 */
export function useTTS(opts: UseTTSOptions): TTSController {
  const tts = useAppStore((s) => s.profile?.settings.tts)
  const ttsRef = useRef(tts)
  ttsRef.current = tts
  const optsRef = useRef(opts)
  optsRef.current = opts

  const webSpeech = useWebSpeechTTS(opts)

  const [cloudSpeaking, setCloudSpeaking] = useState(false)
  const [cloudViseme, setCloudViseme] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const visemeTimerRef = useRef<number | null>(null)
  // Lets cancel() resolve a play() that's mid-flight (pausing doesn't fire `ended`).
  const finishRef = useRef<(() => void) | null>(null)

  const stopVisemeLoop = useCallback((): void => {
    if (visemeTimerRef.current !== null) {
      window.clearInterval(visemeTimerRef.current)
      visemeTimerRef.current = null
    }
    setCloudViseme(0)
  }, [])

  const startVisemeLoop = useCallback((): void => {
    const start = performance.now()
    visemeTimerRef.current = window.setInterval(() => {
      setCloudViseme(computeMouthOpenForTime((performance.now() - start) / 1000))
    }, VISEME_TIMER_MS) as unknown as number
  }, [])

  const cancel = useCallback((): void => {
    abortRef.current?.abort()
    abortRef.current = null
    const a = audioRef.current
    if (a) {
      try {
        a.pause()
        a.removeAttribute('src')
        a.load()
      } catch {
        /* ignore */
      }
    }
    finishRef.current?.()
    finishRef.current = null
    stopVisemeLoop()
    setCloudSpeaking(false)
    webSpeech.cancel()
  }, [stopVisemeLoop, webSpeech])

  /** Returns true if the cloud path handled this utterance (played or aborted). */
  const speakCloud = useCallback(
    async (text: string, provider: TTSProviderId, apiKey?: string): Promise<boolean> => {
      const ac = new AbortController()
      abortRef.current = ac
      let url: string | null = null
      try {
        const blob = await synthesizeSpeech({
          provider,
          text,
          accent: optsRef.current.accent,
          rate: optsRef.current.rate ?? 1,
          voice: ttsRef.current?.voices?.[provider],
          apiKey,
          signal: ac.signal
        })
        if (blob === null) return false // no real client → fall back
        if (ac.signal.aborted) return true

        url = URL.createObjectURL(blob)
        const audio = audioRef.current ?? new Audio()
        audioRef.current = audio
        audio.src = url
        audio.playbackRate = 1 // rate already baked into synthesis where supported

        await new Promise<void>((resolve) => {
          const finish = (): void => {
            if (url) {
              URL.revokeObjectURL(url)
              url = null
            }
            stopVisemeLoop()
            setCloudSpeaking(false)
            finishRef.current = null
            optsRef.current.onEnd?.()
            resolve()
          }
          finishRef.current = finish
          audio.onplay = (): void => {
            setCloudSpeaking(true)
            optsRef.current.onStart?.()
            startVisemeLoop()
          }
          audio.onended = finish
          audio.onerror = finish
          void audio.play().catch(finish)
        })
        return true
      } catch (err) {
        if (url) URL.revokeObjectURL(url)
        if (ac.signal.aborted) return true // user cancelled — handled
        console.warn(`[tts] ${provider} failed, falling back to system voice:`, err)
        return false
      } finally {
        if (abortRef.current === ac) abortRef.current = null
      }
    },
    [startVisemeLoop, stopVisemeLoop]
  )

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim()) return
      const cfg = ttsRef.current
      const provider = (cfg?.activeProviderId ?? 'system') as TTSProviderId
      const needsCloud = provider !== 'system' && isCloudTTSSupported(provider)
      if (needsCloud) {
        const apiKey = cfg?.tokens?.[provider]
        const hasKeyIfNeeded = KEYLESS.includes(provider) || !!apiKey
        if (hasKeyIfNeeded) {
          webSpeech.cancel() // make sure SAPI isn't also talking
          const handled = await speakCloud(text, provider, apiKey)
          if (handled) return
        }
      }
      await webSpeech.speak(text)
    },
    [speakCloud, webSpeech]
  )

  const usingCloud = cloudSpeaking
  return {
    speaking: cloudSpeaking || webSpeech.speaking,
    voices: webSpeech.voices,
    currentVisemeWeight: usingCloud ? cloudViseme : webSpeech.currentVisemeWeight,
    speak,
    cancel
  }
}

export type { TTSController, TTSState, UseTTSOptions } from './types'
