/**
 * Cloud / neural TTS dispatcher. Given the active provider + the user's
 * accent/voice/rate, returns a playable audio Blob. Throws on any failure so
 * the TTS hook can fall back to the offline system voice.
 *
 * Free, no-key engines first: Edge (WSS) and Pollinations (GET). Key-gated
 * engines (ElevenLabs / OpenAI / Google) activate once a key is pasted in
 * Settings → Companion → Voice. Engines we don't have a real client for yet
 * (Kokoro/Piper/Azure/PlayHT — local sidecars or extra config) return null,
 * signalling the caller to use the system voice.
 */
import type { Accent } from '@shared/types'
import type { TTSProviderId } from '@shared/constants'
import { synthesizeEdge } from './edge'
import { defaultVoiceFor, ACCENT_LANG } from './voices'

export interface SynthRequest {
  provider: TTSProviderId
  text: string
  accent: Accent
  /** 0.5–2.0; 1.0 = normal. */
  rate: number
  /** Explicit per-provider voice id; empty = use the accent default. */
  voice?: string
  /** API key for key-gated providers. */
  apiKey?: string
  signal?: AbortSignal
}

/** Provider ids that have a real synthesizer in this module. */
const SUPPORTED: TTSProviderId[] = ['edge', 'pollinations', 'elevenlabs', 'openai', 'google']

export function isCloudTTSSupported(provider: TTSProviderId): boolean {
  return SUPPORTED.includes(provider)
}

async function synthesizePollinations(req: SynthRequest, voice: string): Promise<Blob> {
  const url =
    `https://text.pollinations.ai/${encodeURIComponent(req.text)}` +
    `?model=openai-audio&voice=${encodeURIComponent(voice || 'nova')}`
  const res = await fetch(url, { signal: req.signal })
  if (!res.ok) throw new Error(`Pollinations TTS ${res.status}`)
  const blob = await res.blob()
  if (!blob.type.startsWith('audio')) throw new Error('Pollinations returned non-audio')
  return blob
}

async function synthesizeElevenLabs(req: SynthRequest, voice: string): Promise<Blob> {
  if (!req.apiKey) throw new Error('ElevenLabs needs an API key')
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    signal: req.signal,
    headers: {
      'xi-api-key': req.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg'
    },
    body: JSON.stringify({
      text: req.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    })
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`)
  return res.blob()
}

async function synthesizeOpenAI(req: SynthRequest, voice: string): Promise<Blob> {
  if (!req.apiKey) throw new Error('OpenAI needs an API key')
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    signal: req.signal,
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: voice || 'nova',
      input: req.text,
      speed: Math.max(0.25, Math.min(4, req.rate))
    })
  })
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`)
  return res.blob()
}

async function synthesizeGoogle(req: SynthRequest, voice: string): Promise<Blob> {
  if (!req.apiKey) throw new Error('Google TTS needs an API key')
  const lang = ACCENT_LANG[req.accent]
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(req.apiKey)}`,
    {
      method: 'POST',
      signal: req.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: req.text },
        voice: { languageCode: lang, name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: Math.max(0.25, Math.min(4, req.rate)) }
      })
    }
  )
  if (!res.ok) throw new Error(`Google TTS ${res.status}`)
  const json = (await res.json()) as { audioContent?: string }
  if (!json.audioContent) throw new Error('Google TTS returned no audio')
  // base64 → bytes → Blob
  const bin = atob(json.audioContent)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: 'audio/mpeg' })
}

/**
 * Synthesize one chunk of text. Returns an audio Blob, or null when the
 * provider has no real client yet (caller should use the system voice).
 */
export async function synthesizeSpeech(req: SynthRequest): Promise<Blob | null> {
  const voice = req.voice || defaultVoiceFor(req.provider, req.accent)
  switch (req.provider) {
    case 'edge':
      return synthesizeEdge(req.text, {
        voice,
        lang: ACCENT_LANG[req.accent],
        rate: req.rate,
        signal: req.signal
      })
    case 'pollinations':
      return synthesizePollinations(req, voice)
    case 'elevenlabs':
      return synthesizeElevenLabs(req, voice)
    case 'openai':
      return synthesizeOpenAI(req, voice)
    case 'google':
      return synthesizeGoogle(req, voice)
    default:
      return null
  }
}
