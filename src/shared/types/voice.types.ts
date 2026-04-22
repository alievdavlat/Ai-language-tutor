export type MicMode = 'push-to-talk' | 'always-on'

export type STTEngine = 'web-speech' | 'whisper-local'

export type TTSEngine = 'web-speech' | 'piper-local' | 'kokoro-local'

export type WhisperModelTag =
  | 'tiny.en'
  | 'base.en'
  | 'small.en'
  | 'medium.en'
  | 'tiny'
  | 'base'
  | 'small'

export interface WhisperModelInfo {
  tag: WhisperModelTag
  sizeLabel: string
  sizeBytes: number
  recommendedMode: 'fast' | 'balanced' | 'quality'
  description: string
}

export interface WhisperModelStatus {
  tag: WhisperModelTag
  installed: boolean
  path: string | null
  sizeBytes: number
}

export interface WhisperTranscription {
  text: string
  language?: string
  durationMs: number
}

export interface WhisperDownloadProgress {
  tag: WhisperModelTag
  phase: 'starting' | 'downloading' | 'done' | 'error'
  bytesDownloaded: number
  bytesTotal: number
  pct: number
  error?: string
}
