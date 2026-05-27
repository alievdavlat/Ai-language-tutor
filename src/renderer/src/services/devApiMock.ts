import type { AppApi } from '../../../preload/bridges/index.js'
import type {
  ChatStreamChunk,
  HardwareProfile,
  ModelRecommendation,
  OllamaStatus,
  UserProfile
} from '@shared/types'

/**
 * Standalone browser preview only. When the renderer runs outside Electron
 * (plain `vite` for visual iteration), `window.api` does not exist because no
 * preload script ran. This installs a faithful in-memory mock so the app boots
 * straight to /home with a realistic profile and a "ready" Ollama.
 *
 * Never used in the packaged app or in `electron-vite dev` — the real preload
 * bridge always defines `window.api` there, and we gate install on its absence.
 */

const MOCK_HW: HardwareProfile = {
  totalRamGB: 16,
  freeRamGB: 9.2,
  cpuModel: 'Intel Core i5-1135G7',
  cpuCores: 8,
  cpuSpeedGHz: 2.4,
  gpuVendor: 'Intel',
  gpuModel: 'Iris Xe Graphics',
  gpuVramMB: 2048,
  platform: 'win32',
  recommendedMode: 'balanced'
}

const MOCK_REC: ModelRecommendation = {
  mode: 'balanced',
  llm: { name: 'Qwen2.5 1.5B', tag: 'qwen2.5:1.5b-instruct-q4_K_M', approxRamGB: 1.6 },
  stt: { name: 'Whisper base.en', size: '142 MB' },
  tts: { name: 'Web Speech (SAPI)', accentsSupported: ['us', 'uk', 'au', 'in'] }
}

const MOCK_OLLAMA: OllamaStatus = {
  installed: true,
  running: true,
  version: '0.5.9',
  models: ['qwen2.5:1.5b-instruct-q4_K_M']
}

function buildMockProfile(): UserProfile {
  const now = new Date().toISOString()
  return {
    createdAt: now,
    updatedAt: now,
    name: 'Aziz',
    nativeLanguage: 'uz',
    targetLanguage: 'english',
    goals: ['work', 'ielts'],
    interests: ['tech', 'travel', 'movies'],
    level: 'B1',
    weakAreas: ['articles', 'prepositions'],
    customCharacters: [],
    settings: {
      accent: 'us',
      correctionStyle: 'gentle',
      micMode: 'push-to-talk',
      performanceMode: 'balanced',
      characterId: 'emma',
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

const noopUnsub = (): void => {}

/** A canned assistant reply streamed word-by-word so the chat UI feels alive. */
function simulateChatStream(
  id: string,
  listeners: Set<(c: ChatStreamChunk) => void>
): void {
  const reply =
    "That's a great question! Let's practice together. " +
    'Tell me about your day — what did you do this morning?'
  const words = reply.split(' ')
  let i = 0
  const tick = (): void => {
    if (i >= words.length) {
      listeners.forEach((fn) => fn({ id, delta: '', done: true }))
      return
    }
    const delta = (i === 0 ? '' : ' ') + words[i]
    listeners.forEach((fn) => fn({ id, delta, done: false }))
    i += 1
    setTimeout(tick, 60)
  }
  setTimeout(tick, 200)
}

export function installDevApiMock(): void {
  if (typeof window === 'undefined') return
  if (window.api) return

  const chatListeners = new Set<(c: ChatStreamChunk) => void>()
  let storedProfile = buildMockProfile()

  const mock: AppApi = {
    hardware: {
      detect: async () => MOCK_HW,
      recommend: async () => ({ hw: MOCK_HW, rec: MOCK_REC })
    },
    ollama: {
      status: async () => MOCK_OLLAMA,
      start: async () => ({ running: true, status: MOCK_OLLAMA }),
      pull: async () => ({ ok: true }),
      autoPull: async () => ({ ok: true }),
      onPullProgress: () => noopUnsub,
      onAutoPullProgress: () => noopUnsub,
      chatStream: async (payload) => {
        simulateChatStream(payload.id, chatListeners)
        return { ok: true }
      },
      chatStreamAbort: async () => ({ aborted: true }),
      onChatStreamChunk: (listener) => {
        chatListeners.add(listener)
        return () => chatListeners.delete(listener)
      }
    },
    profile: {
      load: async () => storedProfile,
      save: async (profile) => {
        storedProfile = profile
        return { ok: true }
      },
      reset: async () => {
        storedProfile = buildMockProfile()
        return storedProfile
      }
    },
    placement: {
      generate: async () => [],
      evaluate: async () => ({ level: 'B1', score: 72, breakdown: {} } as never)
    },
    grammar: {
      check: async () => ({ matches: [] } as never)
    },
    stt: {
      listModels: async () => [],
      downloadModel: async () => ({ ok: true }),
      onDownloadProgress: () => noopUnsub,
      transcribe: async () => ({ ok: false, error: 'STT not available in preview' })
    },
    sidecars: {
      list: async () => [],
      start: async () => ({ ok: true }),
      stop: async () => ({ ok: true }),
      restart: async () => ({ ok: true }),
      onStateChange: () => noopUnsub,
      onLog: () => noopUnsub
    }
  }

  window.api = mock
  // eslint-disable-next-line no-console
  console.info('[devApiMock] standalone preview — window.api mocked')
}
