import type { Accent } from '@shared/types'

export interface TTSState {
  speaking: boolean
  currentVisemeWeight: number
  voices: SpeechSynthesisVoice[]
}

export interface TTSController extends TTSState {
  speak: (text: string) => Promise<void>
  cancel: () => void
}

export interface UseTTSOptions {
  accent: Accent
  /** Explicit SpeechSynthesisVoice.voiceURI. Empty/undefined = auto-pick by accent. */
  voiceURI?: string
  rate?: number
  onStart?: () => void
  onEnd?: () => void
}
