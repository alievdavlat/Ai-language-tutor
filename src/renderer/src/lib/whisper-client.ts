import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

// Keep transformers.js cache inside IndexedDB; no local-filesystem model files.
env.allowLocalModels = false
env.useBrowserCache = true

// Serve onnxruntime WASM from the app's own static copy — Vite's default dep
// optimizer can't pre-bundle the dynamic WASM imports cleanly.
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = '/vendor/ort/'
}

// Map our Whisper model tag → Xenova's Hugging Face ID. Xenova's conversions
// ship the ONNX weights transformers.js needs and are MIT-licensed.
const HF_MAP: Record<string, string> = {
  'tiny.en': 'Xenova/whisper-tiny.en',
  'base.en': 'Xenova/whisper-base.en',
  'small.en': 'Xenova/whisper-small.en',
  'medium.en': 'Xenova/whisper-medium.en',
  tiny: 'Xenova/whisper-tiny',
  base: 'Xenova/whisper-base',
  small: 'Xenova/whisper-small'
}

export interface WhisperProgressEvent {
  status: 'starting' | 'downloading' | 'progress' | 'ready' | 'done' | 'error'
  file?: string
  progress?: number // 0..100
  loaded?: number
  total?: number
  error?: string
}

export type ProgressListener = (event: WhisperProgressEvent) => void

interface CacheEntry {
  tag: string
  pipeline: AutomaticSpeechRecognitionPipeline
}

let cached: CacheEntry | null = null
let loading: Promise<AutomaticSpeechRecognitionPipeline> | null = null

// Shared event stream — any hook can subscribe once and watch every load.
const listeners = new Set<ProgressListener>()

export function subscribeWhisperProgress(listener: ProgressListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit(event: WhisperProgressEvent): void {
  for (const l of listeners) {
    try {
      l(event)
    } catch (err) {
      console.error('[whisper progress listener]', err)
    }
  }
}

function resolveModelId(tag: string): string {
  return HF_MAP[tag] ?? HF_MAP['base.en']
}

export async function loadWhisperPipeline(
  tag: string
): Promise<AutomaticSpeechRecognitionPipeline> {
  if (cached && cached.tag === tag) {
    emit({ status: 'ready', progress: 100 })
    return cached.pipeline
  }
  if (loading) return loading

  loading = (async () => {
    emit({ status: 'starting', progress: 0 })
    const modelId = resolveModelId(tag)
    console.info('[whisper] loading pipeline', { tag, modelId })

    try {
      const p = (await pipeline('automatic-speech-recognition', modelId, {
        progress_callback: (evt: unknown) => {
          const e = evt as {
            status?: string
            file?: string
            progress?: number
            loaded?: number
            total?: number
          }
          emit({
            status: (e.status as WhisperProgressEvent['status']) ?? 'progress',
            file: e.file,
            progress: e.progress,
            loaded: e.loaded,
            total: e.total
          })
        }
      })) as AutomaticSpeechRecognitionPipeline
      cached = { tag, pipeline: p }
      loading = null
      emit({ status: 'ready', progress: 100 })
      console.info('[whisper] pipeline ready', { tag })
      return p
    } catch (err) {
      loading = null
      const message = err instanceof Error ? err.message : String(err)
      console.error('[whisper] pipeline load failed', err)
      emit({ status: 'error', error: message })
      throw err
    }
  })()

  return loading
}

export interface TranscribeInput {
  samples: Float32Array
  sampleRate?: number
  language?: string
}

export async function transcribePCM(
  tag: string,
  input: TranscribeInput
): Promise<string> {
  const recognizer = await loadWhisperPipeline(tag)
  const result = (await recognizer(input.samples, {
    language: input.language ?? 'english',
    task: 'transcribe',
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false
  })) as { text?: string } | Array<{ text?: string }>

  const text = Array.isArray(result)
    ? result.map((r) => r.text ?? '').join(' ')
    : result.text ?? ''
  return text.trim()
}

export async function transcribeBlob(
  tag: string,
  blob: Blob,
  language = 'english'
): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) throw new Error('AudioContext unavailable — cannot decode microphone audio.')

  const audioCtx = new AudioCtx()
  const decoded = await audioCtx.decodeAudioData(buffer)
  const target = 16000
  let samples: Float32Array

  if (decoded.sampleRate === target) {
    samples = decoded.getChannelData(0)
  } else {
    const ratio = decoded.sampleRate / target
    const length = Math.floor(decoded.length / ratio)
    const source = decoded.getChannelData(0)
    samples = new Float32Array(length)
    for (let i = 0; i < length; i++) {
      samples[i] = source[Math.floor(i * ratio)]
    }
  }
  await audioCtx.close()

  return transcribePCM(tag, { samples, sampleRate: target, language })
}

export function isPipelineLoaded(tag: string): boolean {
  return cached !== null && cached.tag === tag
}

export function resetPipeline(): void {
  cached = null
  loading = null
}
