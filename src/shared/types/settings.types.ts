import type { Accent } from './learning.types'
import type { PerformanceMode } from './hardware.types'
import type { MicMode, STTEngine, TTSEngine, WhisperModelTag } from './voice.types'

export type CorrectionStyle = 'gentle' | 'strict' | 'silent' | 'inline'

export interface UserSettings {
  accent: Accent
  correctionStyle: CorrectionStyle
  micMode: MicMode
  performanceMode: PerformanceMode
  characterId: string
  ttsSpeed: number
  vadSilenceMs: number
  sttEngine: STTEngine
  ttsEngine: TTSEngine
  whisperModel: WhisperModelTag
  /** Ollama model tag the user explicitly picked. Empty means "use recommended". */
  llmModel: string
  /** SpeechSynthesisVoice.voiceURI the user picked. Empty = auto-pick by accent. */
  voiceURI: string
}
