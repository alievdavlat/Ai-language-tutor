export interface TurnCorrection {
  message: string
  replacement: string | null
  mistake: string
}

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  pending?: boolean
  correction?: TurnCorrection | null
}
