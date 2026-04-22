import type { WhisperModelInfo, WhisperModelTag } from '../types/voice.types'

/** GGML models hosted on Hugging Face (same registry whisper.cpp uses). */
export const WHISPER_HF_BASE = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main'

export const WHISPER_MODELS: Record<WhisperModelTag, WhisperModelInfo> = {
  'tiny.en': {
    tag: 'tiny.en',
    sizeLabel: '78 MB',
    sizeBytes: 77_700_000,
    recommendedMode: 'fast',
    description: 'English only, fastest, lower accuracy'
  },
  'base.en': {
    tag: 'base.en',
    sizeLabel: '148 MB',
    sizeBytes: 148_000_000,
    recommendedMode: 'fast',
    description: 'English only, good balance for 8GB RAM'
  },
  'small.en': {
    tag: 'small.en',
    sizeLabel: '488 MB',
    sizeBytes: 488_000_000,
    recommendedMode: 'balanced',
    description: 'English only, better accuracy'
  },
  'medium.en': {
    tag: 'medium.en',
    sizeLabel: '1.5 GB',
    sizeBytes: 1_500_000_000,
    recommendedMode: 'quality',
    description: 'English only, high accuracy (needs 16GB RAM+)'
  },
  tiny: {
    tag: 'tiny',
    sizeLabel: '78 MB',
    sizeBytes: 77_700_000,
    recommendedMode: 'fast',
    description: 'Multilingual, fastest'
  },
  base: {
    tag: 'base',
    sizeLabel: '148 MB',
    sizeBytes: 148_000_000,
    recommendedMode: 'fast',
    description: 'Multilingual, balanced'
  },
  small: {
    tag: 'small',
    sizeLabel: '488 MB',
    sizeBytes: 488_000_000,
    recommendedMode: 'balanced',
    description: 'Multilingual, good accuracy'
  }
}

export function whisperModelFileName(tag: WhisperModelTag): string {
  return `ggml-${tag}.bin`
}

export function whisperModelUrl(tag: WhisperModelTag): string {
  return `${WHISPER_HF_BASE}/${whisperModelFileName(tag)}`
}
