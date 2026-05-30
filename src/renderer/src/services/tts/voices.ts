import type { Accent } from '@shared/types'
import type { TTSProviderId } from '@shared/constants'

/**
 * Default voice ids per provider, keyed by the user's accent. Used when the
 * user hasn't picked an explicit voice in Settings → Companion → Voice. Each
 * provider names voices differently, so we keep a small per-provider table of
 * good defaults rather than one shared id.
 */

/** Microsoft Edge / Azure neural voice short-names. */
const EDGE_BY_ACCENT: Record<Accent, string> = {
  us: 'en-US-AriaNeural',
  uk: 'en-GB-SoniaNeural',
  au: 'en-AU-NatashaNeural',
  in: 'en-IN-NeerjaNeural'
}

/** Azure uses the same neural short-names as Edge. */
const AZURE_BY_ACCENT = EDGE_BY_ACCENT

/** OpenAI / Pollinations openai-audio voices (accent-agnostic — model handles it). */
const OPENAI_VOICE = 'nova'
const POLLINATIONS_VOICE = 'nova'

/** ElevenLabs multilingual default voice ("Rachel"). */
const ELEVENLABS_VOICE = '21m00Tcm4TlvDq8ikWAM'

/** Google Cloud TTS Neural2 voices per accent. */
const GOOGLE_BY_ACCENT: Record<Accent, string> = {
  us: 'en-US-Neural2-F',
  uk: 'en-GB-Neural2-A',
  au: 'en-AU-Neural2-A',
  in: 'en-IN-Neural2-A'
}

export function defaultVoiceFor(provider: TTSProviderId, accent: Accent): string {
  switch (provider) {
    case 'edge':
      return EDGE_BY_ACCENT[accent]
    case 'azure':
      return AZURE_BY_ACCENT[accent]
    case 'openai':
      return OPENAI_VOICE
    case 'pollinations':
      return POLLINATIONS_VOICE
    case 'elevenlabs':
      return ELEVENLABS_VOICE
    case 'google':
      return GOOGLE_BY_ACCENT[accent]
    default:
      return ''
  }
}

export const ACCENT_LANG: Record<Accent, string> = {
  us: 'en-US',
  uk: 'en-GB',
  au: 'en-AU',
  in: 'en-IN'
}
