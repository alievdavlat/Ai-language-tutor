import type { MicMode, STTEngine } from '@shared/types'

export interface STTState {
  listening: boolean
  interim: string
  supported: boolean
  error: string | null
}

export interface STTController {
  state: STTState
  start: () => void | Promise<void>
  stop: () => void | Promise<void>
}

export interface UseSTTOptions {
  engine: STTEngine
  lang?: string
  mode: MicMode
  enabled?: boolean
  onFinal: (transcript: string) => void
  onInterim?: (interim: string) => void
}
