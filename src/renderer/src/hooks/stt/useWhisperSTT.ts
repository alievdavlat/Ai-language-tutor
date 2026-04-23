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
  enabled?: boolean
  micPrefs?: MicProcessingPrefs
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

  const setError = useCallback((message: string | null) => {
    setState((prev) => ({ ...prev, error: message }))
  }, [])

  const setInterim = useCallback((text: string) => {
    setState((prev) => ({ ...prev, interim: text }))
    optsRef.current.onInterim?.(text)
  }, [])

  // Warm up the pipeline when the engine becomes active so the first
  // transcription doesn't eat a 10-30 s download-and-compile delay.
  useEffect(() => {
    if (opts.enabled === false) return
    loadWhisperPipeline(opts.modelTag).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err))
    })
  }, [opts.enabled, opts.modelTag, setError])

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
      setState((prev) => ({ ...prev, listening: true }))
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
    if (optsRef.current.mode === 'push-to-talk') {
      await ptt.start()
      setState((prev) => ({ ...prev, listening: true }))
    } else {
      await vad.start()
    }
  }, [ptt, vad, setError])

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
