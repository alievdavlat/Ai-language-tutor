import { useWebSpeechTTS } from './useWebSpeechTTS'
import type { TTSController, UseTTSOptions } from './types'

/**
 * Dispatcher for TTS engines. Web Speech is the default for all tiers.
 * Piper/Kokoro engine branches will plug in here in a later phase.
 */
export function useTTS(opts: UseTTSOptions): TTSController {
  return useWebSpeechTTS(opts)
}

export type { TTSController, TTSState, UseTTSOptions } from './types'
