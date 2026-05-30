export const HARDWARE_CHANNELS = {
  DETECT: 'hardware:detect',
  RECOMMEND: 'hardware:recommend'
} as const

export const OLLAMA_CHANNELS = {
  STATUS: 'ollama:status',
  START: 'ollama:start',
  PULL: 'ollama:pull',
  PULL_PROGRESS: 'ollama:pull-progress',
  AUTO_PULL: 'ollama:auto-pull',
  AUTO_PULL_PROGRESS: 'ollama:auto-pull-progress',
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

// Productivity (#37): global quick-lookup hotkey + desktop widget window.
export const PRODUCTIVITY_CHANNELS = {
  /** Main → renderer: the global shortcut fired; open the quick-lookup overlay. */
  QUICK_LOOKUP: 'productivity:quick-lookup',
  /** Renderer → main: toggle the always-on-top desktop widget window. */
  TOGGLE_WIDGET: 'productivity:toggle-widget',
  /** Renderer → main: query whether the global shortcut registered OK. */
  SHORTCUT_STATUS: 'productivity:shortcut-status'
} as const

// Auto-update (#43): silent background updates via electron-updater + GitHub
// Releases. The renderer only ever reads status (Settings → About) — it never
// drives the install, which happens automatically on app quit.
export const UPDATE_CHANNELS = {
  /** Renderer → main: get the latest known UpdateStatus snapshot. */
  STATUS: 'update:status',
  /** Renderer → main: force an immediate check (also runs on launch + every 4h). */
  CHECK: 'update:check',
  /** Main → renderer: push a fresh UpdateStatus whenever it changes. */
  CHANGED: 'update:changed'
} as const

export const IPC = {
  hardware: HARDWARE_CHANNELS,
  ollama: OLLAMA_CHANNELS,
  profile: PROFILE_CHANNELS,
  placement: PLACEMENT_CHANNELS,
  grammar: GRAMMAR_CHANNELS,
  stt: STT_CHANNELS,
  sidecar: SIDECAR_CHANNELS,
  productivity: PRODUCTIVITY_CHANNELS,
  update: UPDATE_CHANNELS
} as const
