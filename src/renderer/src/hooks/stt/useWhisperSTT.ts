import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicMode, WhisperModelTag } from '@shared/types'
import { useVAD } from '../useVAD'
import { usePTTRecorder } from '../useAudioRecorder'
import type { MicProcessingPrefs } from '../../lib/audio'
import {
  loadWhisperPipeline,
  transcribeBlob,
  transcribePCM
} from '../../lib/whisper-client'
import type { STTController, STTState } from './types'

interface UseWhisperSTTOptions {
  mode: MicMode
  modelTag: WhisperModelTag
  language?: string
  onFinal: (transcript: string) => void
  onInterim?: (text: string) => void
  onSpeechStart?: () => void
  /**
   * Fires once when the engine hits an unrecoverable load/transcribe error.
   * Parent can flip the app-wide STT engine to `web-speech` so the next
   * utterance actually produces a reply instead of silent failure.
   */
  onEngineFallback?: (reason: string) => void
  enabled?: boolean
  micPrefs?: MicProcessingPrefs
}

// Heuristic: treat any error mentioning network / 404 / timeout / load as a
// signal that Whisper just isn't going to work in this environment.
function isFatalWhisperError(message: string): boolean {
  return /timed out|failed to fetch|network|404|Could not load|load failed|ENOTFOUND|ERR_INTERNET/i.test(
    message
  )
}

/**
 * Offline STT via Whisper — runs fully in the renderer through
 * `@huggingface/transformers`. No native binary, no main-process IPC.
 * Two capture paths:
 *   - push-to-talk: MediaRecorder → WebM blob → WebAudio decode → PCM → pipeline
 *   - always-on: Silero-VAD → Float32 PCM at 16 kHz → pipeline directly
 */
export function useWhisperSTT(opts: UseWhisperSTTOptions): STTController {
  const [state, setState] = useState<STTState>({
    listening: false,
    interim: '',
    supported: true,
    error: null
  })
  const optsRef = useRef(opts)
  optsRef.current = opts

  // Once we've fired the fallback callback we don't want to keep spamming it
  // for every subsequent utterance — the parent only needs to know once.
  const fallbackFiredRef = useRef(false)

  const setError = useCallback((message: string | null) => {
    setState((prev) => ({ ...prev, error: message }))
    if (
      message &&
      !fallbackFiredRef.current &&
      isFatalWhisperError(message) &&
      optsRef.current.onEngineFallback
    ) {
      fallbackFiredRef.current = true
      optsRef.current.onEngineFallback(message)
    }
  }, [])

  const setInterim = useCallback((text: string) => {
    setState((prev) => ({ ...prev, interim: text }))
    optsRef.current.onInterim?.(text)
  }, [])

  // #A104 — Load the model LAZILY on first mic use, not on mount. Mounting the
  // STT hook on a speaking / level-test page used to eagerly fetch the ONNX
  // model + WASM at boot (noisy console, wasted fetch, 404s in preview). We now
  // warm the pipeline the first time the user actually records/listens (see
  // `start()` below), which keeps the first transcription snappy without paying
  // the cost just for landing on the page.
  const warmedRef = useRef(false)
  const warmPipeline = useCallback((): void => {
    if (warmedRef.current) return
    warmedRef.current = true
    loadWhisperPipeline(optsRef.current.modelTag).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err))
    })
  }, [setError])

  // Push-to-talk path — MediaRecorder emits a compressed blob we decode here.
  const ptt = usePTTRecorder({
    micPrefs: opts.micPrefs,
    onStop: async (blob) => {
      try {
        setInterim('transcribing…')
        const text = await transcribeBlob(
          optsRef.current.modelTag,
          blob,
          optsRef.current.language ?? 'english'
        )
        setInterim('')
        if (text && text.length > 0) {
          optsRef.current.onFinal(text)
        } else {
          setError("I didn't catch that — try speaking louder or closer to the mic.")
        }
      } catch (err) {
        setInterim('')
        setError(err instanceof Error ? err.message : String(err))
      }
    }
  })

  // Always-on path — Silero VAD gives Float32 PCM already at 16 kHz.
  const vad = useVAD({
    enabled: opts.mode === 'always-on' && opts.enabled !== false,
    micPrefs: opts.micPrefs,
    onSpeechEnd: async (samples) => {
      try {
        setInterim('transcribing…')
        const text = await transcribePCM(optsRef.current.modelTag, {
          samples,
          sampleRate: 16000,
          language: optsRef.current.language ?? 'english'
        })
        setInterim('')
        if (text && text.length > 0) optsRef.current.onFinal(text)
        // In always-on mode, stay silent on empty transcripts — the user's
        // probably still collecting their thoughts between utterances.
      } catch (err) {
        setInterim('')
        setError(err instanceof Error ? err.message : String(err))
      }
    },
    onSpeechStart: () => {
      // First real speech in always-on mode — warm the model now so the
      // transcribe call below isn't the thing that triggers the cold load.
      warmPipeline()
      setState((prev) => ({ ...prev, listening: true }))
      // Propagate to the caller for TTS barge-in + LLM abort.
      optsRef.current.onSpeechStart?.()
    }
  })

  useEffect(() => {
    if (opts.mode === 'always-on' && opts.enabled !== false) {
      setState((prev) => ({ ...prev, listening: vad.active }))
    }
  }, [vad.active, opts.mode, opts.enabled])

  const start = useCallback(async (): Promise<void> => {
    setError(null)
    // First actual mic use — warm the Whisper pipeline now (lazy load, #A104).
    warmPipeline()
    if (optsRef.current.mode === 'push-to-talk') {
      await ptt.start()
      setState((prev) => ({ ...prev, listening: true }))
    } else {
      await vad.start()
    }
  }, [ptt, vad, setError, warmPipeline])

  const stop = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, listening: false, interim: '' }))
    if (optsRef.current.mode === 'push-to-talk') {
      await ptt.stop()
    } else {
      await vad.stop()
    }
  }, [ptt, vad])

  return { state, start, stop }
}
