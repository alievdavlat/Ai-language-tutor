import { useCallback, useRef, useState } from 'react'
import type { ChatMessage, CorrectionStyle, GrammarMatch, UserProfile } from '@shared/types'
import { buildCorrectionFeedback, buildSystemPrompt } from '../../../services/prompts'
import { createId } from '../../../lib/ids'
import { useStreamingSpeaker } from '../../../hooks/useStreamingSpeaker'
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
  /** Cancels any in-flight streaming speech — use for barge-in / route leave. */
  cancelCurrent: () => void
}

function firstMatch(matches: GrammarMatch[] | undefined): GrammarMatch | null {
  if (!matches || matches.length === 0) return null
  return matches[0]
}

async function appendCorrectionSpeech(
  style: CorrectionStyle,
  feedback: string | null,
  speak: (text: string) => Promise<void>
): Promise<void> {
  if (!feedback || style === 'silent' || style === 'inline') return
  if (style === 'strict') {
    // "Strict" meant "say the correction before the reply." With streaming
    // the main reply already started, so we say it right after — still
    // clearly correction-flavoured.
    await speak(`Quick correction: ${feedback}`)
    return
  }
  // gentle
  await speak(`By the way — ${feedback}`)
}

export function useTurnHandler(opts: UseTurnHandlerOptions): TurnHandler {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const historyRef = useRef<ChatMessage[]>([])
  const optsRef = useRef(opts)
  optsRef.current = opts

  // Streaming speaker — chunks LLM output into sentences so TTS starts
  // playing before the model finishes generating. One shared queue per page
  // so cancel() wipes everything (main reply AND correction follow-up).
  const streamer = useStreamingSpeaker({
    speak: (text) => optsRef.current.speak(text),
    cancel: () => optsRef.current.cancelSpeak()
  })

  const pushTurn = useCallback((turn: ChatTurn) => {
    setTurns((prev) => [...prev, turn])
  }, [])

  const updateTurn = useCallback((id: string, patch: Partial<ChatTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const handleUserTurn = useCallback(
    async (userText: string): Promise<void> => {
      const { profile, topic, sendChat } = optsRef.current
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

      // Cancel any leftover speech from the previous turn before starting.
      streamer.cancel()

      let fullReply = ''
      try {
        fullReply = await sendChat(messages, (delta, full) => {
          updateTurn(assistantId, { text: full, pending: false })
          streamer.feedDelta(delta)
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

      // Wait for the streamed main reply to finish speaking before the
      // correction follow-up.
      await streamer.flushAndWait()

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
        await appendCorrectionSpeech(
          profile.settings.correctionStyle,
          feedback,
          optsRef.current.speak
        )
      } else {
        updateTurn(userId, { pending: false })
      }
    },
    [pushTurn, updateTurn, streamer]
  )

  return { turns, handleUserTurn, cancelCurrent: streamer.cancel }
}
