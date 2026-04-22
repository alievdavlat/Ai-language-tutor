export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatStreamChunk {
  id: string
  delta: string
  done: boolean
  error?: string
}

export interface ChatStreamRequest {
  id: string
  model: string
  messages: ChatMessage[]
}
