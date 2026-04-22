import type { Accent } from './learning.types'

export type PerformanceMode = 'fast' | 'balanced' | 'quality'

export interface HardwareProfile {
  totalRamGB: number
  freeRamGB: number
  cpuModel: string
  cpuCores: number
  cpuSpeedGHz: number
  gpuVendor: string
  gpuModel: string
  gpuVramMB: number
  platform: string
  recommendedMode: PerformanceMode
}

export interface ModelRecommendation {
  mode: PerformanceMode
  llm: LLMModelInfo
  stt: STTModelInfo
  tts: TTSModelInfo
}

export interface LLMModelInfo {
  name: string
  tag: string
  approxRamGB: number
}

export interface STTModelInfo {
  name: string
  size: string
}

export interface TTSModelInfo {
  name: string
  accentsSupported: Accent[]
}
