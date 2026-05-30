import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

// Offline-first: the default model (tiny.en) ships bundled under
// `public/models/` (served at `/models/`). transformers.js loads those files
// directly off disk — no CDN, no network, no CSP surprises — so the model is
// ready in a couple of seconds instead of hanging at 0%. We still allow remote
// downloads so the larger optional models (base/small/…) can be fetched on
// demand when the user picks one and has connectivity.
env.allowLocalModels = true
env.localModelPath = '/models/'
env.allowRemoteModels = true
env.useBrowserCache = true

// Serve onnxruntime WASM from the app's own static copy — Vite's default dep
// optimizer can't pre-bundle the dynamic WASM imports cleanly.
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = '/vendor/ort/'
}

/** The model bundled offline under public/models — loads with zero network. */
export const BUNDLED_WHISPER_TAG = 'tiny.en'

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

// Absolute ceiling on the first model load (download + WASM compile). The
// bundled model loads in ~2-5 s; this only ever bites a remote model on a
// slow link.
const LOAD_TIMEOUT_MS = 60_000
// Fail fast if the load makes NO progress for this long — a stuck-at-0%
// download (blocked CDN, dead socket) trips this in 15 s instead of hanging
// the whole call UI for a minute.
const LOAD_STALL_MS = 15_000
// Transcription is fast once the model is resident, but a weak CPU running the
// WASM backend single-threaded (no SharedArrayBuffer) needs headroom — 45 s is
// generous enough not to drop a real utterance, tight enough to catch a hang.
const TRANSCRIBE_TIMEOUT_MS = 45_000

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`))
    }, ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (err) => {
        clearTimeout(t)
        reject(err)
      }
    )
  })
}

/**
 * Resolves when `p` settles; rejects if neither `p` settles NOR `bump()` is
 * called within `stallMs`. Call `bump()` on every progress tick so a healthy
 * (if slow) download keeps the watchdog alive, but a truly stuck fetch dies fast.
 */
function withStallGuard<T>(
  run: (bump: () => void) => Promise<T>,
  stallMs: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false
    let timer: ReturnType<typeof setTimeout>
    const arm = (): void => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (done) return
        done = true
        reject(new Error(`${label} stalled — no progress for ${Math.round(stallMs / 1000)}s`))
      }, stallMs)
    }
    arm()
    run(() => {
      if (!done) arm()
    }).then(
      (v) => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve(v)
      },
      (err) => {
        if (done) return
        done = true
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

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
      const p = (await withTimeout(
        withStallGuard(
          (bump) =>
            pipeline('automatic-speech-recognition', modelId, {
              // The bundled files are q8 (`*_quantized.onnx`); pinning the dtype
              // keeps the renderer (wasm default = q8) and our bundle in lockstep.
              dtype: 'q8',
              progress_callback: (evt: unknown) => {
                bump()
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
            }),
          LOAD_STALL_MS,
          `Whisper model '${tag}' load`
        ),
        LOAD_TIMEOUT_MS,
        `Whisper model '${tag}' load`
      )) as AutomaticSpeechRecognitionPipeline
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

/** English-only Whisper builds (tag ends in `.en`) reject a `language`/`task`. */
function isEnglishOnly(tag: string): boolean {
  return tag.endsWith('.en')
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
  // Only multilingual builds accept language/task — passing them to an
  // English-only (.en) model throws "Cannot specify `task` or `language`".
  const genOpts: Record<string, unknown> = {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false
  }
  if (!isEnglishOnly(tag)) {
    genOpts.language = input.language ?? 'english'
    genOpts.task = 'transcribe'
  }
  const result = (await withTimeout(
    recognizer(input.samples, genOpts) as Promise<{ text?: string } | Array<{ text?: string }>>,
    TRANSCRIBE_TIMEOUT_MS,
    'Whisper transcription'
  )) as { text?: string } | Array<{ text?: string }>

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
