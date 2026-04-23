import { useCallback, useEffect, useRef, useState } from 'react'
import { MicVAD } from '@ricky0123/vad-web'
import { getAudioConstraints, type MicProcessingPrefs } from '../lib/audio'

interface UseVADOptions {
  enabled: boolean
  onSpeechStart?: () => void
  onSpeechEnd?: (samples: Float32Array) => void
  positiveSpeechThreshold?: number
  negativeSpeechThreshold?: number
  redemptionMs?: number
  micPrefs?: MicProcessingPrefs
}

interface VADController {
  active: boolean
  loading: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => Promise<void>
}

/**
 * Browser-side voice activity detection via Silero VAD (ONNX, WASM).
 * We force the library to load its ONNX weights and the onnxruntime-web WASM
 * binaries from `/vendor/*`, which Vite's static-copy plugin ships next to
 * the bundle. Default paths go through Vite's module rewriter and 404 on
 * `ort-wasm-simd-threaded.mjs`; serving the originals fixes it.
 */
const VAD_BASE_PATH = '/vendor/vad/'
const ONNX_WASM_PATH = '/vendor/ort/'

export function useVAD(opts: UseVADOptions): VADController {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const vadRef = useRef<MicVAD | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const start = useCallback(async (): Promise<void> => {
    if (vadRef.current) return
    setLoading(true)
    setError(null)
    try {
      console.info('[vad] initializing Silero VAD via /vendor/*')
      const vad = await MicVAD.new({
        baseAssetPath: VAD_BASE_PATH,
        onnxWASMBasePath: ONNX_WASM_PATH,
        positiveSpeechThreshold: optsRef.current.positiveSpeechThreshold ?? 0.8,
        negativeSpeechThreshold: optsRef.current.negativeSpeechThreshold ?? 0.35,
        redemptionMs: optsRef.current.redemptionMs ?? 1500,
        getStream: async () =>
          navigator.mediaDevices.getUserMedia({
            audio: getAudioConstraints(optsRef.current.micPrefs)
          }),
        onSpeechStart: () => {
          console.info('[vad] speech start')
          optsRef.current.onSpeechStart?.()
        },
        onSpeechEnd: (samples: Float32Array) => {
          console.info('[vad] speech end', { samples: samples.length })
          optsRef.current.onSpeechEnd?.(samples)
        },
        onVADMisfire: () => {
          console.info('[vad] misfire (too-short utterance)')
        }
      })
      vad.start()
      vadRef.current = vad
      setActive(true)
      console.info('[vad] active')
    } catch (err) {
      console.error('[vad] start failed', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const stop = useCallback(async (): Promise<void> => {
    if (!vadRef.current) return
    try {
      vadRef.current.pause()
      vadRef.current.destroy()
    } catch {
      // ignore
    }
    vadRef.current = null
    setActive(false)
  }, [])

  useEffect(() => {
    if (opts.enabled) {
      void start()
    } else {
      void stop()
    }
  }, [opts.enabled, start, stop])

  useEffect(() => {
    return () => {
      void stop()
    }
  }, [stop])

  return { active, loading, error, start, stop }
}
