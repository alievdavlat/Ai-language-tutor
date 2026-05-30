export * from './cefr.types'
export * from './learning.types'
export * from './hardware.types'
export * from './voice.types'
export * from './settings.types'
export * from './user.types'
export * from './character.types'
export * from './ollama.types'
export * from './chat.types'
export * from './placement.types'
export * from './grammar.types'
export * from './sidecar.types'
export * from './update.types'
export * from './platform.types'
export * from './platform-ext.types'
export * from './social.types'
export * from './library.types'
// NOTE: study.types.ts is consumed directly by the study subsystem (not via this
// barrel) and re-declares ActivityEvent/ExamAttempt/ExamKind with study-specific
// shapes. It is intentionally NOT re-exported here to avoid clashing with the
// backend-contract versions in platform-ext.types. Import it by path if needed.
