/**
 * Catalog of cloud AI providers the app supports. Used by Settings → AI to
 * render comparison cards, and by every AI-dependent feature (Speaking, IELTS
 * simulator, writing rubric, etc.) to gate access until the user configures
 * at least one provider.
 *
 * Pricing and free-tier info reflect publicly-listed rates as of 2026-05-28.
 * Rates change — keep the `verifiedOn` date current when refreshing.
 */

export type AIProviderId =
  | 'gemini'
  | 'claude'
  | 'openai'
  | 'deepseek'
  | 'grok'
  | 'mistral'
  | 'groq'
  | 'openrouter'

export interface AIModel {
  id: string
  label: string
  /** Public per-million-token pricing (input → output). null = free tier only. */
  inputUsdPerM: number | null
  outputUsdPerM: number | null
  contextK: number
  /** Tier marker for the card chip. */
  tier: 'flagship' | 'fast' | 'free' | 'reasoning'
}

export interface AIProvider {
  id: AIProviderId
  name: string
  /** One-line distinguishing pitch — shown on the card. */
  tagline: string
  /** Detail body shown when the card is expanded. */
  strengths: string[]
  weaknesses: string[]
  flag: string
  /** Brand accent gradient for cards. */
  cover: string
  models: AIModel[]
  /** Has a free tier the app can use? Drives the "Free" filter. */
  hasFreeTier: boolean
  /** Short copy describing the free tier. */
  freeTier?: string
  /** Step-by-step guide for the user to get an API key. */
  tokenSteps: { label: string; url?: string }[]
  /** Where the user pastes the token. */
  tokenLabel: string
  /** Last time the pricing/availability info on this card was confirmed. */
  verifiedOn: string
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Generous free tier — fastest way to get started without a card.',
    strengths: [
      'Free tier with no credit card (Gemini 2.5 Flash)',
      'Strong multimodal — handles audio + images well',
      'Long 1M-token context window',
      'Best free option for speaking practice'
    ],
    weaknesses: [
      'Free tier rate-limited (15 req/min, 1500/day)',
      'Reasoning sometimes weaker than Claude / o-series'
    ],
    flag: '🇺🇸',
    cover: 'from-sky-500 to-blue-700',
    hasFreeTier: true,
    freeTier: 'Free 15 RPM / 1500/day · Gemini 2.5 Flash · no card needed',
    models: [
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', inputUsdPerM: 1.25, outputUsdPerM: 10.0, contextK: 1000, tier: 'flagship' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', inputUsdPerM: 0.30, outputUsdPerM: 2.50, contextK: 1000, tier: 'fast' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', inputUsdPerM: 0.10, outputUsdPerM: 0.40, contextK: 1000, tier: 'free' }
    ],
    tokenSteps: [
      { label: 'Open Google AI Studio', url: 'https://aistudio.google.com/apikey' },
      { label: 'Sign in with a Google account' },
      { label: 'Click "Create API key" → "Create in new project"' },
      { label: 'Copy the key and paste it below' }
    ],
    tokenLabel: 'Google API key',
    verifiedOn: '2026-05-28'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    tagline: 'Best for nuanced corrections, long conversations, IELTS-style essay grading.',
    strengths: [
      'Most precise grammar/style corrections',
      'Excellent for IELTS / TOEFL writing rubric scoring',
      'Strongest multi-turn conversational coherence',
      'Honest with errors — won\'t hallucinate band scores'
    ],
    weaknesses: [
      'No no-card free tier — small starter credit only',
      'Slightly slower than Flash-tier models'
    ],
    flag: '🇺🇸',
    cover: 'from-amber-500 to-orange-700',
    hasFreeTier: false,
    freeTier: '$5 starter credit on signup (expires 14 days)',
    models: [
      { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', inputUsdPerM: 15.0, outputUsdPerM: 75.0, contextK: 1000, tier: 'flagship' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', inputUsdPerM: 3.0, outputUsdPerM: 15.0, contextK: 200, tier: 'reasoning' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', inputUsdPerM: 0.25, outputUsdPerM: 1.25, contextK: 200, tier: 'fast' }
    ],
    tokenSteps: [
      { label: 'Open the Anthropic Console', url: 'https://console.anthropic.com/' },
      { label: 'Sign up (Google login works)' },
      { label: 'Go to Settings → API Keys → Create key' },
      { label: 'Copy the key (starts with sk-ant-…)' }
    ],
    tokenLabel: 'Anthropic API key (sk-ant-…)',
    verifiedOn: '2026-05-28'
  },
  {
    id: 'openai',
    name: 'OpenAI ChatGPT',
    tagline: 'Industry standard. Best-known models, broad ecosystem.',
    strengths: [
      'Very strong general-purpose conversation',
      'Realtime voice API (low-latency speaking practice)',
      'GPT-4o multimodal — audio in/out for IELTS speaking',
      'Largest community + most third-party tools'
    ],
    weaknesses: [
      'No standing free tier on the API',
      'Strict rate limits on new accounts',
      'More expensive than Gemini for equivalent quality'
    ],
    flag: '🇺🇸',
    cover: 'from-emerald-500 to-teal-700',
    hasFreeTier: false,
    freeTier: '$5 credit if signed up before pricing change (varies)',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', inputUsdPerM: 2.50, outputUsdPerM: 10.00, contextK: 128, tier: 'flagship' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', inputUsdPerM: 0.15, outputUsdPerM: 0.60, contextK: 128, tier: 'fast' },
      { id: 'o3-mini', label: 'o3-mini', inputUsdPerM: 1.10, outputUsdPerM: 4.40, contextK: 200, tier: 'reasoning' }
    ],
    tokenSteps: [
      { label: 'Open OpenAI Platform', url: 'https://platform.openai.com/api-keys' },
      { label: 'Sign in (add a payment method if first time)' },
      { label: 'Click "+ Create new secret key"' },
      { label: 'Copy the key (starts with sk-…)' }
    ],
    tokenLabel: 'OpenAI API key (sk-…)',
    verifiedOn: '2026-05-28'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tagline: 'Cheapest serious model — 25× cheaper than GPT-4 for similar tasks.',
    strengths: [
      'Extremely cheap ($0.27 input / $1.10 output per M)',
      'Top-tier math + reasoning on DeepSeek-R1',
      'OpenAI-compatible API — drop-in replacement',
      'Off-peak discounts up to 75%'
    ],
    weaknesses: [
      'Hosted in China — latency higher from Europe/Americas',
      'No multimodal (text-only)',
      'No standing free tier (requires deposit)'
    ],
    flag: '🇨🇳',
    cover: 'from-violet-500 to-purple-700',
    hasFreeTier: false,
    freeTier: '$5 trial credit on signup',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek-V3.1 Chat', inputUsdPerM: 0.27, outputUsdPerM: 1.10, contextK: 128, tier: 'flagship' },
      { id: 'deepseek-reasoner', label: 'DeepSeek-R1', inputUsdPerM: 0.55, outputUsdPerM: 2.19, contextK: 64, tier: 'reasoning' }
    ],
    tokenSteps: [
      { label: 'Open DeepSeek Platform', url: 'https://platform.deepseek.com/api_keys' },
      { label: 'Sign up with email or GitHub' },
      { label: 'Top up $5 minimum to activate' },
      { label: 'Create API key and copy it' }
    ],
    tokenLabel: 'DeepSeek API key (sk-…)',
    verifiedOn: '2026-05-28'
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    tagline: 'Real-time X knowledge · longer responses · less censored.',
    strengths: [
      'Real-time information from X (Twitter) integration',
      'Grok-4 Heavy for very hard reasoning',
      'More relaxed content policy for adult learners'
    ],
    weaknesses: [
      'Expensive vs Gemini / DeepSeek',
      'No free API tier',
      'Less polished tooling'
    ],
    flag: '🇺🇸',
    cover: 'from-slate-500 to-slate-800',
    hasFreeTier: false,
    freeTier: '$25 free credit/mo if you opt-in to data sharing',
    models: [
      { id: 'grok-4', label: 'Grok 4', inputUsdPerM: 3.0, outputUsdPerM: 15.0, contextK: 256, tier: 'flagship' },
      { id: 'grok-4-fast', label: 'Grok 4 Fast', inputUsdPerM: 0.20, outputUsdPerM: 0.50, contextK: 256, tier: 'fast' }
    ],
    tokenSteps: [
      { label: 'Open xAI Console', url: 'https://console.x.ai/' },
      { label: 'Sign in with your X account' },
      { label: 'Buy credits (minimum $5) or enable free $25/mo data-sharing tier' },
      { label: 'Create an API key under Team → API Keys' }
    ],
    tokenLabel: 'xAI API key',
    verifiedOn: '2026-05-28'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    tagline: 'European cloud · multilingual focus · free open-weight models.',
    strengths: [
      'Strong on French, Spanish, German, Italian',
      'Free tier via La Plateforme (limited rate)',
      'GDPR compliant · EU data residency',
      'Open-weight models also runnable locally'
    ],
    weaknesses: [
      'Smaller models than GPT-4/Claude/Gemini at equivalent price',
      'Free tier rate-limited tightly'
    ],
    flag: '🇫🇷',
    cover: 'from-orange-500 to-rose-700',
    hasFreeTier: true,
    freeTier: 'Free experimental tier · ~1 req/sec on small models',
    models: [
      { id: 'mistral-large', label: 'Mistral Large 2', inputUsdPerM: 2.0, outputUsdPerM: 6.0, contextK: 128, tier: 'flagship' },
      { id: 'mistral-small', label: 'Mistral Small 3', inputUsdPerM: 0.20, outputUsdPerM: 0.60, contextK: 32, tier: 'fast' },
      { id: 'codestral', label: 'Codestral', inputUsdPerM: 0.30, outputUsdPerM: 0.90, contextK: 32, tier: 'fast' }
    ],
    tokenSteps: [
      { label: 'Open Mistral La Plateforme', url: 'https://console.mistral.ai/' },
      { label: 'Sign up · activate the free experimental tier' },
      { label: 'Go to API Keys → Create new' },
      { label: 'Copy the key' }
    ],
    tokenLabel: 'Mistral API key',
    verifiedOn: '2026-05-28'
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    tagline: 'Insanely fast inference — runs open models 10× faster than competitors.',
    strengths: [
      'Llama 3.3 / Qwen / DeepSeek-R1 distilled — all running at 500+ tok/s',
      'Free tier with rate limits but no card required',
      'OpenAI-compatible API',
      'Best for live voice latency'
    ],
    weaknesses: [
      'Hosts open models only — no GPT-4/Claude/Gemini',
      'Free tier rate-limited (30 req/min)',
      'Smaller models than the flagships'
    ],
    flag: '🇺🇸',
    cover: 'from-fuchsia-500 to-pink-700',
    hasFreeTier: true,
    freeTier: 'Free tier · 30 req/min · Llama 3.3 70B + Qwen-32B + others',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', inputUsdPerM: 0.59, outputUsdPerM: 0.79, contextK: 128, tier: 'flagship' },
      { id: 'qwen-2.5-32b', label: 'Qwen 2.5 32B', inputUsdPerM: 0.79, outputUsdPerM: 0.79, contextK: 128, tier: 'fast' },
      { id: 'deepseek-r1-distill', label: 'DeepSeek-R1 Distill', inputUsdPerM: 0.75, outputUsdPerM: 0.99, contextK: 128, tier: 'reasoning' }
    ],
    tokenSteps: [
      { label: 'Open Groq Cloud Console', url: 'https://console.groq.com/keys' },
      { label: 'Sign in with Google or GitHub' },
      { label: 'API Keys → Create API Key' },
      { label: 'Copy the key (starts with gsk_…)' }
    ],
    tokenLabel: 'Groq API key (gsk_…)',
    verifiedOn: '2026-05-28'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'One key, 200+ models — pay-as-you-go across all providers.',
    strengths: [
      'Single API key for Claude, GPT, Gemini, DeepSeek, Llama, etc.',
      'Some free routes (Llama 3.3, DeepSeek-R1)',
      'Auto-fallback if a provider is down',
      'No vendor lock-in'
    ],
    weaknesses: [
      'Small markup (~5%) vs going direct',
      'Free models throttled aggressively',
      'Less reliable for production'
    ],
    flag: '🌐',
    cover: 'from-indigo-500 to-violet-700',
    hasFreeTier: true,
    freeTier: 'Free models (Llama 3.3, DeepSeek-R1) · ~20 req/min',
    models: [
      { id: 'meta-llama/llama-3.3-70b:free', label: 'Llama 3.3 70B (Free)', inputUsdPerM: 0, outputUsdPerM: 0, contextK: 128, tier: 'free' },
      { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek-R1 (Free)', inputUsdPerM: 0, outputUsdPerM: 0, contextK: 128, tier: 'free' },
      { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (via OR)', inputUsdPerM: 3.0, outputUsdPerM: 15.0, contextK: 200, tier: 'flagship' }
    ],
    tokenSteps: [
      { label: 'Open OpenRouter', url: 'https://openrouter.ai/keys' },
      { label: 'Sign in with Google / GitHub' },
      { label: 'Create API key (no top-up needed for free routes)' },
      { label: 'Copy the key (starts with sk-or-v1-…)' }
    ],
    tokenLabel: 'OpenRouter key (sk-or-v1-…)',
    verifiedOn: '2026-05-28'
  }
]

export function getProvider(id: AIProviderId): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id)
}
