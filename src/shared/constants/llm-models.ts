export type LLMTier = 'tiny' | 'fast' | 'balanced' | 'quality'

export interface LLMModelInfo {
  tag: string
  name: string
  sizeLabel: string
  /** RAM needed to actually run inference, NOT on-disk size. */
  approxRamGB: number
  tier: LLMTier
  description: string
}

export const LLM_MODELS: Record<string, LLMModelInfo> = {
  'qwen2.5:0.5b-instruct-q4_K_M': {
    tag: 'qwen2.5:0.5b-instruct-q4_K_M',
    name: 'Qwen2.5 0.5B',
    sizeLabel: '~400 MB',
    approxRamGB: 0.7,
    tier: 'tiny',
    description: 'Rescue model — fits in <1 GB free RAM. Limited fluency.'
  },
  'llama3.2:1b-instruct-q4_K_M': {
    tag: 'llama3.2:1b-instruct-q4_K_M',
    name: 'Llama 3.2 1B',
    sizeLabel: '~0.8 GB',
    approxRamGB: 1.3,
    tier: 'tiny',
    description: 'Good small model. Works on tight 8 GB laptops.'
  },
  'qwen2.5:1.5b-instruct-q4_K_M': {
    tag: 'qwen2.5:1.5b-instruct-q4_K_M',
    name: 'Qwen2.5 1.5B',
    sizeLabel: '~1.0 GB',
    approxRamGB: 1.6,
    tier: 'fast',
    description: 'Best balance for 8 GB RAM laptops. Recommended for this system.'
  },
  'llama3.2:3b-instruct-q4_K_M': {
    tag: 'llama3.2:3b-instruct-q4_K_M',
    name: 'Llama 3.2 3B',
    sizeLabel: '~2.0 GB',
    approxRamGB: 2.7,
    tier: 'fast',
    description: 'Needs ~3 GB free RAM. Close other apps first.'
  },
  'qwen2.5:3b-instruct-q4_K_M': {
    tag: 'qwen2.5:3b-instruct-q4_K_M',
    name: 'Qwen2.5 3B',
    sizeLabel: '~2.2 GB',
    approxRamGB: 2.9,
    tier: 'fast',
    description: 'Needs ~3 GB free RAM. Won\'t fit on most 8 GB laptops while Chrome is open.'
  },
  'llama3.1:8b-instruct-q4_K_M': {
    tag: 'llama3.1:8b-instruct-q4_K_M',
    name: 'Llama 3.1 8B',
    sizeLabel: '~4.9 GB',
    approxRamGB: 6,
    tier: 'quality',
    description: 'Top quality. Needs 16+ GB total RAM.'
  }
}

export function listLLMModels(): LLMModelInfo[] {
  return Object.values(LLM_MODELS).sort((a, b) => a.approxRamGB - b.approxRamGB)
}

export function findLLMModel(tag: string): LLMModelInfo | null {
  return LLM_MODELS[tag] ?? null
}

/**
 * Pick a model based on free RAM. Assumes the caller already checked totalRamGB.
 * Rule of thumb: model needs ~1 GB of headroom for Ollama + OS paging.
 */
export function recommendLLMByFreeRam(freeRamGB: number): LLMModelInfo {
  if (freeRamGB >= 7) return LLM_MODELS['llama3.1:8b-instruct-q4_K_M']
  if (freeRamGB >= 3.5) return LLM_MODELS['llama3.2:3b-instruct-q4_K_M']
  if (freeRamGB >= 2.2) return LLM_MODELS['qwen2.5:1.5b-instruct-q4_K_M']
  if (freeRamGB >= 1.5) return LLM_MODELS['llama3.2:1b-instruct-q4_K_M']
  return LLM_MODELS['qwen2.5:0.5b-instruct-q4_K_M']
}
