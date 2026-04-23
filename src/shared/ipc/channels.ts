export const HARDWARE_CHANNELS = {
  DETECT: 'hardware:detect',
  RECOMMEND: 'hardware:recommend'
} as const

export const OLLAMA_CHANNELS = {
  STATUS: 'ollama:status',
  PULL: 'ollama:pull',
  PULL_PROGRESS: 'ollama:pull-progress',
  CHAT_STREAM: 'ollama:chat-stream',
  CHAT_STREAM_CHUNK: 'ollama:chat-stream-chunk',
  CHAT_STREAM_ABORT: 'ollama:chat-stream-abort'
} as const

export const PROFILE_CHANNELS = {
  LOAD: 'profile:load',
  SAVE: 'profile:save',
  RESET: 'profile:reset'
} as const

export const PLACEMENT_CHANNELS = {
  GENERATE: 'placement:generate',
  EVALUATE: 'placement:evaluate'
} as const

export const GRAMMAR_CHANNELS = {
  CHECK: 'grammar:check'
} as const

export const STT_CHANNELS = {
  MODELS_LIST: 'stt:models-list',
  MODEL_DOWNLOAD: 'stt:model-download',
  MODEL_DOWNLOAD_PROGRESS: 'stt:model-download-progress',
  TRANSCRIBE: 'stt:transcribe'
} as const

export const SIDECAR_CHANNELS = {
  LIST: 'sidecar:list',
  START: 'sidecar:start',
  STOP: 'sidecar:stop',
  RESTART: 'sidecar:restart',
  STATE_CHANGED: 'sidecar:state-changed',
  LOG: 'sidecar:log'
} as const

export const IPC = {
  hardware: HARDWARE_CHANNELS,
  ollama: OLLAMA_CHANNELS,
  profile: PROFILE_CHANNELS,
  placement: PLACEMENT_CHANNELS,
  grammar: GRAMMAR_CHANNELS,
  stt: STT_CHANNELS,
  sidecar: SIDECAR_CHANNELS
} as const
