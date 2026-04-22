export type GrammarMatchSource = 'local' | 'public'

export interface GrammarMatch {
  message: string
  shortMessage?: string
  offset: number
  length: number
  replacement: string | null
  ruleId: string
  category: string
}

export interface GrammarResult {
  ok: boolean
  matches: GrammarMatch[]
  error?: string
  source: GrammarMatchSource
}
