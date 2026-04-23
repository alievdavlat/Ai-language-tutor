import type { UserProfile } from '@shared/types'

export function buildEmptyProfile(): UserProfile {
  const now = new Date().toISOString()
  return {
    createdAt: now,
    updatedAt: now,
    nativeLanguage: 'uz',
    targetLanguage: 'english',
    goals: [],
    interests: [],
    level: 'A2',
    weakAreas: [],
    customCharacters: [],
    settings: {
      accent: 'us',
      correctionStyle: 'gentle',
      micMode: 'push-to-talk',
      performanceMode: 'fast',
      characterId: 'default',
      ttsSpeed: 1.0,
      vadSilenceMs: 1500,
      sttEngine: 'web-speech',
      ttsEngine: 'web-speech',
      whisperModel: 'base.en',
      llmModel: '',
      voiceURI: '',
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true
    }
  }
}
