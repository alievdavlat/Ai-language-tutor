import type { Accent } from './learning.types'
import type { PerformanceMode } from './hardware.types'
import type { MicMode, STTEngine, TTSEngine, WhisperModelTag } from './voice.types'

export type CorrectionStyle = 'gentle' | 'strict' | 'silent' | 'inline'

/**
 * Cloud AI provider configuration. The renderer-level routing layer picks the
 * active provider for every AI-dependent feature (Speaking, IELTS simulator,
 * writing rubric, vocab translations). When `activeProviderId` is null every
 * one of those features is gated until the user configures a provider in
 * Settings → AI.
 */
export interface AIConfig {
  /** Currently-active provider — null when nothing is configured yet. */
  activeProviderId: string | null
  /** Per-provider API key. Stored locally; not synced anywhere. */
  tokens: Record<string, string>
  /** Per-provider chosen model id. Falls back to the first model in the catalog. */
  models: Record<string, string>
}

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
  /**
   * Phase 12 — default VRM model URL used for the 3D avatar when the active
   * companion has none of its own. Empty = use the procedural avatar.
   */
  vrmModelUrl?: string
  /**
   * Avatar render mode for Speaking. Chosen in Settings → Companion (not from
   * the chat header anymore). Defaults to 2D.
   */
  avatarMode?: '2d' | '3d'
  /** Browser-level noise suppression on the mic stream (Chromium/WebRTC). */
  noiseSuppression: boolean
  /** Browser-level acoustic echo cancellation — stops speaker feedback into the mic. */
  echoCancellation: boolean
  /** Browser-level automatic gain control — normalizes mic volume. */
  autoGainControl: boolean
  /** Cloud-AI provider configuration. Optional for backwards-compat — code
   *  treats `ai === undefined` as "no provider configured". */
  ai?: AIConfig
}
