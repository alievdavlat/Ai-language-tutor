import { useMemo } from 'react'
import { useWebSpeechSTT } from './useWebSpeechSTT'
import { useWhisperSTT } from './useWhisperSTT'
import type { STTController, UseSTTOptions } from './types'
import type { WhisperModelTag } from '@shared/types'

interface UseSTTConfig extends UseSTTOptions {
  whisperModel?: WhisperModelTag
}

/**
 * Dispatcher hook — selects the right STT engine from the user's settings.
 *
 * Whisper is the default and the only engine that works reliably here: the
 * browser's Web Speech API needs Google's cloud recognizer, and Electron ships
 * without the API key it requires, so `webkitSpeechRecognition` fails with a
 * `network` error even when the machine is online. Whisper runs fully in the
 * renderer (WASM) off a locally-bundled model, so it works offline.
 *
 * Both engine hooks are mounted unconditionally (React's rules of hooks); only
 * the selected one is `enabled`, and the dispatcher returns its controller.
 * Web Speech stays wired as an opt-in / fallback target.
 */
export function useSTT(config: UseSTTConfig): STTController {
  const engine = config.engine
  const active = config.enabled !== false

  const whisper = useWhisperSTT({
    mode: config.mode,
    modelTag: config.whisperModel ?? 'tiny.en',
    language: config.lang,
    enabled: engine === 'whisper-local' && active,
    onFinal: config.onFinal,
    onInterim: config.onInterim,
    onSpeechStart: config.onSpeechStart,
    onEngineFallback: config.onEngineFallback,
    micPrefs: config.micPrefs
  })

  const webSpeech = useWebSpeechSTT({
    mode: config.mode,
    lang: config.lang,
    enabled: engine === 'web-speech' && active,
    onFinal: config.onFinal,
    onInterim: config.onInterim,
    onSpeechStart: config.onSpeechStart
  })

  return useMemo<STTController>(
    () => (engine === 'web-speech' ? webSpeech : whisper),
    [engine, webSpeech, whisper]
  )
}

export type { STTController, STTState, UseSTTOptions } from './types'
