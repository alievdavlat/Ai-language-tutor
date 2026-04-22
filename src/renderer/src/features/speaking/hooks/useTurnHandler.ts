import { useCallback, useRef, useState } from 'react'
import type { ChatMessage, CorrectionStyle, GrammarMatch, UserProfile } from '@shared/types'
import { buildCorrectionFeedback, buildSystemPrompt } from '../../../services/prompts'
import { createId } from '../../../lib/ids'
import type { ChatTurn } from '../types'

const HISTORY_WINDOW = 20

interface UseTurnHandlerOptions {
  profile: UserProfile
  topic: string
  sendChat: (
    messages: ChatMessage[],
    onDelta?: (delta: string, full: string) => void
  ) => Promise<string>
  speak: (text: string) => Promise<void>
  cancelSpeak: () => void
}

interface TurnHandler {
  turns: ChatTurn[]
  handleUserTurn: (text: string) => Promise<void>
}

function firstMatch(matches: GrammarMatch[] | undefined): GrammarMatch | null {
  if (!matches || matches.length === 0) return null
  return matches[0]
}

async function speakCorrection(
  style: CorrectionStyle,
  reply: string,
  feedback: string | null,
  speak: (text: string) => Promise<void>
): Promise<void> {
  if (style === 'silent' || !feedback) {
    await speak(reply)
    return
  }
  if (style === 'strict') {
    await speak(`Quick correction first. ${feedback}. Now, ${reply}`)
    return
  }
  if (style === 'inline') {
    await speak(reply)
    return
  }
  // gentle
  await speak(reply)
  await speak(`By the way — ${feedback}`)
}

export function useTurnHandler(opts: UseTurnHandlerOptions): TurnHandler {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const historyRef = useRef<ChatMessage[]>([])
  const optsRef = useRef(opts)
  optsRef.current = opts

  const pushTurn = useCallback((turn: ChatTurn) => {
    setTurns((prev) => [...prev, turn])
  }, [])

  const updateTurn = useCallback((id: string, patch: Partial<ChatTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const handleUserTurn = useCallback(
    async (userText: string): Promise<void> => {
      const { profile, topic, sendChat, speak } = optsRef.current
      const userId = createId('user')
      const assistantId = createId('assistant')

      pushTurn({ id: userId, role: 'user', text: userText, pending: true })
      pushTurn({ id: assistantId, role: 'assistant', text: '', pending: true })

      const grammarPromise = window.api.grammar.check(userText).catch(() => null)

      const systemPrompt = buildSystemPrompt(profile, {
        topic: topic || undefined
      })
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyRef.current,
        { role: 'user', content: userText }
      ]

      let fullReply = ''
      try {
        fullReply = await sendChat(messages, (_d, full) => {
          updateTurn(assistantId, { text: full, pending: false })
        })
      } catch {
        fullReply = ''
      }

      if (!fullReply) {
        updateTurn(assistantId, {
          text:
            '⚠️ No response from the local model. Check the red banner above — if it mentions memory, switch to a smaller LLM in Settings → Language model.',
          pending: false
        })
        updateTurn(userId, { pending: false })
        return
      }

      updateTurn(assistantId, { text: fullReply, pending: false })
      const newHistory: ChatMessage[] = [
        ...historyRef.current,
        { role: 'user', content: userText },
        { role: 'assistant', content: fullReply }
      ]
      historyRef.current = newHistory.slice(-HISTORY_WINDOW)

      const grammar = await grammarPromise
      const match = firstMatch(grammar?.matches)

      if (grammar?.ok && match) {
        const mistake = userText.slice(match.offset, match.offset + match.length)
        updateTurn(userId, {
          pending: false,
          correction: {
            message: match.message,
            replacement: match.replacement,
            mistake
          }
        })

        const feedback = buildCorrectionFeedback(userText, grammar.matches)
        await speakCorrection(profile.settings.correctionStyle, fullReply, feedback, speak)
      } else {
        updateTurn(userId, { pending: false })
        await speak(fullReply)
      }
    },
    [pushTurn, updateTurn]
  )

  return { turns, handleUserTurn }
}
