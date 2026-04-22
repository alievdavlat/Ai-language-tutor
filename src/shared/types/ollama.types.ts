export interface OllamaStatus {
  installed: boolean
  running: boolean
  version?: string
  models: string[]
  error?: string
}
