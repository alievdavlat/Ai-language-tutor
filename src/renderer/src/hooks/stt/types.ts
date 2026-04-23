import type { MicMode, STTEngine } from '@shared/types'
import type { MicProcessingPrefs } from '../../lib/audio'

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
  /**
   * Fires the moment the engine detects the user has started speaking, before
   * any transcript is available. Used for barge-in — cancel TTS + abort the
   * LLM stream the instant the user opens their mouth.
   */
  onSpeechStart?: () => void
  /**
   * Fires when an engine fails in a way the caller can recover from by
   * switching engines (e.g. Whisper model can't download). Parent should
   * flip the user's `sttEngine` setting so the next utterance uses a
   * different backend.
   */
  onEngineFallback?: (reason: string) => void
  /** Phase 5 — browser-level mic-processing flags (NS/AEC/AGC). */
  micPrefs?: MicProcessingPrefs
}
