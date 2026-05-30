/**
 * Catalog of text-to-speech (companion voice) providers. Mirrors the AI
 * provider catalog: the user browses, compares free/paid, pastes a key where
 * needed, and picks the voice their companion speaks with. Rendered by
 * Settings → Companion → Voice.
 *
 * `status: 'ready'` engines work today; `'soon'` engines are scaffolded (key +
 * selection persist) and wired by the integration tasks. Pricing/free-tier
 * notes reflect publicly-listed info as of `verifiedOn` — verify before relying.
 */

export type TTSProviderId =
  | 'system'
  | 'edge'
  | 'kokoro'
  | 'piper'
  | 'pollinations'
  | 'elevenlabs'
  | 'openai'
  | 'google'
  | 'azure'
  | 'playht'

export interface TTSProvider {
  id: TTSProviderId
  name: string
  tagline: string
  /** browser = built-in · local = runs offline on the device · cloud = network */
  kind: 'browser' | 'local' | 'cloud'
  strengths: string[]
  weaknesses: string[]
  flag: string
  /** Brand accent gradient for the card header. */
  cover: string
  /** Has a usable free option (free tier or fully free). */
  hasFreeTier: boolean
  /** Short copy describing the free option. */
  freeTier?: string
  /** Whether the user must paste an API key. */
  needsKey: boolean
  tokenLabel?: string
  tokenSteps?: { label: string; url?: string }[]
  /** 'ready' works now; 'soon' is scaffolded, wired by integration tasks. */
  status: 'ready' | 'soon'
  verifiedOn: string
}

export const TTS_PROVIDERS: TTSProvider[] = [
  {
    id: 'system',
    name: 'System voice',
    tagline: 'Built-in, instant, fully offline — no setup, but robotic.',
    kind: 'browser',
    strengths: ['Works immediately, no key', 'Fully offline', 'Many OS languages/voices', 'Zero cost'],
    weaknesses: ['Robotic compared to neural voices', 'Quality varies by OS'],
    flag: '🖥️',
    cover: 'from-slate-500 to-slate-700',
    hasFreeTier: true,
    freeTier: 'Always free · offline · uses your OS voices',
    needsKey: false,
    status: 'ready',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'edge',
    name: 'Edge Neural (Microsoft)',
    tagline: 'Azure-quality neural voices — free, no key, 100+ languages.',
    kind: 'cloud',
    strengths: ['Neural Azure-quality voices', '100+ languages incl. many accents', 'Completely free, NO API key or signup', 'Great value for a learning app'],
    weaknesses: ['Cloud (needs internet)', 'Unofficial endpoint — may change'],
    flag: '🟦',
    cover: 'from-sky-500 to-blue-700',
    hasFreeTier: true,
    freeTier: 'Free · no key, no signup · neural quality',
    needsKey: false,
    status: 'ready',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'kokoro',
    name: 'Kokoro (open-source)',
    tagline: 'Open neural TTS that runs offline — natural, free, private.',
    kind: 'local',
    strengths: ['Very natural for an open model', 'Runs offline on CPU', 'Apache-2.0 · free · private', 'No per-character limits'],
    weaknesses: ['One-time model download (~300 MB)', 'A bit heavier than system voices'],
    flag: '🧠',
    cover: 'from-emerald-500 to-teal-700',
    hasFreeTier: true,
    freeTier: 'Free · offline · open-source (Apache-2.0)',
    needsKey: false,
    status: 'soon',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'piper',
    name: 'Piper (open-source)',
    tagline: 'Ultra-light offline neural voices — fast on weak machines.',
    kind: 'local',
    strengths: ['Very lightweight + fast', 'Runs offline', 'Many languages', 'Free / open-source (MIT)'],
    weaknesses: ['Slightly less natural than Kokoro', 'Per-voice model download'],
    flag: '🪈',
    cover: 'from-lime-500 to-green-700',
    hasFreeTier: true,
    freeTier: 'Free · offline · open-source (MIT)',
    needsKey: false,
    status: 'soon',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'pollinations',
    name: 'Pollinations',
    tagline: 'Free cloud TTS — no key, decent quality.',
    kind: 'cloud',
    strengths: ['Free, no key', 'Simple API', 'Several voices'],
    weaknesses: ['Cloud (needs internet)', 'Rate-limited', 'Quality below ElevenLabs'],
    flag: '🌸',
    cover: 'from-pink-500 to-rose-700',
    hasFreeTier: true,
    freeTier: 'Free · no key · rate-limited',
    needsKey: false,
    status: 'ready',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    tagline: 'The most realistic voices + cloning. Small free tier.',
    kind: 'cloud',
    strengths: ['Most human-like, emotional voices', 'Instant voice cloning (paid)', 'Best for a premium companion feel', 'Free tier to try'],
    weaknesses: ['Free tier small (~10k chars/mo, attribution)', 'Cloning + commercial need paid', 'Cloud + API key'],
    flag: '🎙️',
    cover: 'from-violet-500 to-purple-700',
    hasFreeTier: true,
    freeTier: 'Free ~10,000 chars/mo (≈10 min) · then from ~$5/mo',
    needsKey: true,
    tokenLabel: 'ElevenLabs API key',
    tokenSteps: [
      { label: 'Open elevenlabs.io and sign up', url: 'https://elevenlabs.io/' },
      { label: 'Open Profile → API Keys' },
      { label: 'Create a key and copy it' }
    ],
    status: 'ready',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'openai',
    name: 'OpenAI TTS',
    tagline: 'Very natural, 6 expressive voices. Pay-as-you-go.',
    kind: 'cloud',
    strengths: ['Very natural + expressive', '6 voices, multilingual', 'Cheap per character'],
    weaknesses: ['No standing free tier', 'Needs OpenAI API key + billing', 'Cloud'],
    flag: '🤖',
    cover: 'from-emerald-600 to-teal-800',
    hasFreeTier: false,
    freeTier: 'No free tier · ~$15 / 1M chars',
    needsKey: true,
    tokenLabel: 'OpenAI API key (sk-…)',
    tokenSteps: [
      { label: 'Open OpenAI Platform', url: 'https://platform.openai.com/api-keys' },
      { label: 'Create a secret key (billing required)' },
      { label: 'Copy the key (starts with sk-…)' }
    ],
    status: 'ready',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'google',
    name: 'Google Cloud TTS',
    tagline: 'WaveNet/Neural voices, generous free tier.',
    kind: 'cloud',
    strengths: ['High-quality WaveNet/Neural2 voices', 'Free tier ~1M chars/mo', 'Huge language coverage'],
    weaknesses: ['Google Cloud account + key setup', 'Cloud'],
    flag: '🔵',
    cover: 'from-blue-500 to-indigo-700',
    hasFreeTier: true,
    freeTier: 'Free tier ~1M chars/mo (WaveNet ~free) · needs account',
    needsKey: true,
    tokenLabel: 'Google Cloud API key',
    tokenSteps: [
      { label: 'Open Google Cloud Console', url: 'https://console.cloud.google.com/' },
      { label: 'Enable the Text-to-Speech API' },
      { label: 'Create an API key and copy it' }
    ],
    status: 'ready',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'azure',
    name: 'Azure Speech',
    tagline: 'Microsoft neural voices with an official free tier.',
    kind: 'cloud',
    strengths: ['Official neural voices (same as Edge)', 'Free tier ~500k chars/mo', 'SSML, styles, emotions'],
    weaknesses: ['Azure account + region + key', 'Cloud'],
    flag: '☁️',
    cover: 'from-cyan-500 to-sky-700',
    hasFreeTier: true,
    freeTier: 'Free tier ~500k chars/mo (neural) · needs account',
    needsKey: true,
    tokenLabel: 'Azure Speech key',
    tokenSteps: [
      { label: 'Open Azure Portal', url: 'https://portal.azure.com/' },
      { label: 'Create a Speech resource (free F0 tier)' },
      { label: 'Copy a key + your region' }
    ],
    status: 'soon',
    verifiedOn: '2026-05-30'
  },
  {
    id: 'playht',
    name: 'PlayHT',
    tagline: 'Realistic voices + cloning, freemium.',
    kind: 'cloud',
    strengths: ['Very natural voices', 'Voice cloning', 'Large voice library'],
    weaknesses: ['Small free tier', 'Cloud + API key', 'Paid for serious use'],
    flag: '▶️',
    cover: 'from-amber-500 to-orange-700',
    hasFreeTier: true,
    freeTier: 'Small free trial · then paid',
    needsKey: true,
    tokenLabel: 'PlayHT API key + User ID',
    tokenSteps: [
      { label: 'Open play.ht and sign up', url: 'https://play.ht/' },
      { label: 'Open API access' },
      { label: 'Copy your API key + User ID' }
    ],
    status: 'soon',
    verifiedOn: '2026-05-30'
  }
]

export function getTTSProvider(id: string): TTSProvider | undefined {
  return TTS_PROVIDERS.find((p) => p.id === id)
}
