import { useWebSpeechSTT } from './useWebSpeechSTT'
import { useWhisperSTT } from './useWhisperSTT'
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
  const webSpeech = useWebSpeechSTT({
    mode: config.mode,
    lang: config.lang,
    enabled: config.engine === 'web-speech' && config.enabled !== false,
    onFinal: config.onFinal,
    onInterim: config.onInterim
  })

  const whisper = useWhisperSTT({
    mode: config.mode,
    modelTag: config.whisperModel ?? 'base.en',
    language: 'en',
    enabled: config.engine === 'whisper-local' && config.enabled !== false,
    onFinal: config.onFinal,
    onInterim: config.onInterim
  })

  return config.engine === 'whisper-local' ? whisper : webSpeech
}

export type { STTController, STTState, UseSTTOptions } from './types'
