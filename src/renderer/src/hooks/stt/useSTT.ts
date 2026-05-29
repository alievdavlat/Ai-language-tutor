import { useWebSpeechSTT } from './useWebSpeechSTT'
import type { STTController, UseSTTOptions } from './types'
import type { WhisperModelTag } from '@shared/types'

interface UseSTTConfig extends UseSTTOptions {
  whisperModel?: WhisperModelTag
}

/**
 * Dispatcher hook — selects the right STT engine based on user settings.
 * The two branches have identical shapes so the caller never cares which is active.
 */
export function useSTT(config: UseSTTConfig): STTController {
  // Local Whisper STT is deferred (transformers.js English-only models error on
  // a `language` param, and the app is cloud-first now) — always use the
  // browser's Web Speech engine. Keeps the dispatcher shape identical.
  const engine: 'web-speech' = 'web-speech'

  const webSpeech = useWebSpeechSTT({
    mode: config.mode,
    lang: config.lang,
    enabled: engine === 'web-speech' && config.enabled !== false,
    onFinal: config.onFinal,
    onInterim: config.onInterim,
    onSpeechStart: config.onSpeechStart
  })

  return webSpeech
}

export type { STTController, STTState, UseSTTOptions } from './types'
