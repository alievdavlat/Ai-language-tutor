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
   * any transcript is available. Used for barge-in — cancel TTS / abort LLM
   * generation the instant the user opens their mouth.
   */
  onSpeechStart?: () => void
  micPrefs?: MicProcessingPrefs
}
