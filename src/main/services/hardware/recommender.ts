import type { HardwareProfile, ModelRecommendation } from '@shared/types'
import { recommendLLMByFreeRam } from '@shared/constants'

/**
 * Picks models the system can actually run. We key off FREE RAM instead of
 * total — on 8 GB laptops the OS already eats 2–3 GB, so a 3B model that
 * "should fit" in 8 GB won't actually fit once Chrome/Ollama/Electron pile on.
 */
export function recommendModels(hw: HardwareProfile): ModelRecommendation {
  const llm = recommendLLMByFreeRam(hw.freeRamGB)

  switch (hw.recommendedMode) {
    case 'quality':
      return {
        mode: 'quality',
        llm: { name: llm.name, tag: llm.tag, approxRamGB: llm.approxRamGB },
        stt: { name: 'whisper small.en', size: '~488 MB' },
        tts: { name: 'MeloTTS', accentsSupported: ['us', 'uk', 'au', 'in'] }
      }
    case 'balanced':
      return {
        mode: 'balanced',
        llm: { name: llm.name, tag: llm.tag, approxRamGB: llm.approxRamGB },
        stt: { name: 'whisper base.en', size: '~148 MB' },
        tts: { name: 'MeloTTS', accentsSupported: ['us', 'uk'] }
      }
    case 'fast':
    default:
      return {
        mode: 'fast',
        llm: { name: llm.name, tag: llm.tag, approxRamGB: llm.approxRamGB },
        stt: { name: 'whisper base.en', size: '~148 MB' },
        tts: { name: 'System voices', accentsSupported: ['us'] }
      }
  }
}
