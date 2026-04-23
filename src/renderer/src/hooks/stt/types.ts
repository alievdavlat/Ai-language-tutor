import type { MicMode, STTEngine } from '@shared/types'

export interface STTState {
  listening: boolean
  interim: string
  supported: boolean
  error: string | null
}

export interface STTController {
  state: STTState
  start: () => void | Promise<void>
  stop: () => void | Promise<void>
}

export interface UseSTTOptions {
  engine: STTEngine
  lang?: string
  mode: MicMode
  enabled?: boolean
  onFinal: (transcript: string) => void
  onInterim?: (interim: string) => void
  /** Fires the instant the user starts speaking — wire this to TTS cancel for barge-in. */
  onSpeechStart?: () => void
  /**
   * Fires when an engine fails in a way the caller can recover from by
   * switching engines (e.g. Whisper model can't download). Parent should
   * flip the user's `sttEngine` setting so the next utterance uses a
   * different backend.
   */
  onEngineFallback?: (reason: string) => void
}
