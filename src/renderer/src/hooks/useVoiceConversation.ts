import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@shared/types'
import { ACCENT_TO_LANG } from '@shared/constants'
import { useAppStore } from '../store/useAppStore'
import { useSTT } from './stt'
import { useTTS } from './tts'
import { useChatStream } from './useChatStream'
import { useStreamingSpeaker } from './useStreamingSpeaker'
import { micPrefsFromSettings } from '../lib/audio'

export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking'
export interface VoiceTurn {
  role: 'user' | 'assistant'
  text: string
}

interface UseVoiceConversationOptions {
  /** System prompt that defines the persona (tutor, examiner, …). */
  systemPrompt: string
  /** Spoken + shown as the first assistant turn when the conversation starts. */
  greeting?: string
  /** When false, STT stays off (e.g. while a prep timer is running). */
  enabled?: boolean
  /** Fired after each assistant reply finishes streaming + speaking. */
  onAssistantDone?: (text: string, turns: VoiceTurn[]) => void
}

export interface VoiceConversation {
  phase: VoicePhase
  turns: VoiceTurn[]
  interim: string
  listening: boolean
  /** True while the LLM stream is in flight. */
  thinking: boolean
  /** True while TTS is playing. */
  speaking: boolean
  error: string | null
  /** Begin the conversation — speaks the greeting (call once). */
  begin: () => void
  /** Toggle the mic on/off (push-to-talk style). */
  toggleMic: () => void
  startMic: () => void
  stopMic: () => void
  /** Inject a typed/forced user turn (text fallback, demo answers). */
  sendUserText: (text: string) => void
  /** Inject an examiner/scripted line without hitting the LLM. */
  pushAssistantLine: (text: string, speakIt?: boolean) => void
  /** Hard stop — cancels TTS, aborts the stream, stops the mic. */
  teardown: () => void
}

/**
 * Drives a full spoken back-and-forth (STT → LLM stream → sentence-by-sentence
 * TTS) behind a single persona. Used by the AI tutor call and the IELTS
 * Speaking simulator so neither has to re-implement the pipeline.
 *
 * Routing is automatic: `useChatStream` sends to the configured cloud provider
 * when one is set up, else falls back to local Ollama. Barge-in is wired —
 * the moment the user speaks we cancel TTS and abort the LLM.
 */
export function useVoiceConversation(opts: UseVoiceConversationOptions): VoiceConversation {
  const profile = useAppStore((s) => s.profile)
  const settings = profile?.settings
  const accent = settings?.accent ?? 'us'
  const model = settings?.llmModel ?? ''

  const [phase, setPhase] = useState<VoicePhase>('idle')
  const [turns, setTurns] = useState<VoiceTurn[]>([])
  const turnsRef = useRef<VoiceTurn[]>([])
  turnsRef.current = turns

  const { speak, cancel: cancelTTS, speaking } = useTTS({
    accent,
    rate: settings?.ttsSpeed,
    voiceURI: settings?.voiceURI
  })
  const streamer = useStreamingSpeaker({ speak, cancel: cancelTTS })
  const { send, abort: abortChat, streaming, error } = useChatStream(model)

  const buildMessages = (history: VoiceTurn[]): ChatMessage[] => [
    { role: 'system', content: opts.systemPrompt },
    ...history.map((t) => ({ role: t.role, content: t.text }) as ChatMessage)
  ]

  const respond = useCallback(
    async (history: VoiceTurn[]): Promise<void> => {
      setPhase('thinking')
      streamer.cancel()
      let acc = ''
      const full = await send(buildMessages(history), (delta) => {
        acc += delta
        setPhase('speaking')
        streamer.feedDelta(delta)
      })
      await streamer.flushAndWait()
      const text = (full || acc).trim()
      if (!text) {
        setPhase('listening')
        return
      }
      const next = [...history, { role: 'assistant', text } as VoiceTurn]
      setTurns(next)
      setPhase('listening')
      opts.onAssistantDone?.(text, next)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [send]
  )

  const sendUserText = useCallback(
    (text: string): void => {
      const clean = text.trim()
      if (!clean) return
      const history = [...turnsRef.current, { role: 'user', text: clean } as VoiceTurn]
      setTurns(history)
      void respond(history)
    },
    [respond]
  )

  const stt = useSTT({
    engine: settings?.sttEngine ?? 'whisper-local',
    mode: settings?.micMode ?? 'push-to-talk',
    lang: ACCENT_TO_LANG[accent],
    whisperModel: settings?.whisperModel,
    micPrefs: settings ? micPrefsFromSettings(settings) : undefined,
    enabled: opts.enabled ?? true,
    onSpeechStart: () => {
      if (speaking) cancelTTS()
      streamer.cancel()
      abortChat()
    },
    onFinal: (t) => {
      if (speaking) cancelTTS()
      sendUserText(t)
    }
  })

  // Keep the public phase in sync with the underlying pipeline flags.
  useEffect(() => {
    if (speaking) setPhase('speaking')
    else if (streaming) setPhase('thinking')
    else if (stt.state.listening) setPhase('listening')
  }, [speaking, streaming, stt.state.listening])

  const pushAssistantLine = useCallback(
    (text: string, speakIt = true): void => {
      setTurns((cur) => [...cur, { role: 'assistant', text }])
      if (speakIt) {
        setPhase('speaking')
        void speak(text).then(() => setPhase('listening'))
      }
    },
    [speak]
  )

  const begunRef = useRef(false)
  const begin = useCallback((): void => {
    if (begunRef.current) return
    begunRef.current = true
    if (opts.greeting) pushAssistantLine(opts.greeting, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.greeting, pushAssistantLine])

  const startMic = useCallback(() => {
    if (speaking) cancelTTS()
    void stt.start()
  }, [speaking, cancelTTS, stt])
  const stopMic = useCallback(() => void stt.stop(), [stt])
  const toggleMic = useCallback(() => {
    if (stt.state.listening) stopMic()
    else startMic()
  }, [stt.state.listening, startMic, stopMic])

  const teardown = useCallback(() => {
    void stt.stop()
    streamer.cancel()
    cancelTTS()
    abortChat()
  }, [stt, streamer, cancelTTS, abortChat])

  useEffect(() => {
    return () => teardown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    phase,
    turns,
    interim: stt.state.interim,
    listening: stt.state.listening,
    thinking: streaming,
    speaking,
    error,
    begin,
    toggleMic,
    startMic,
    stopMic,
    sendUserText,
    pushAssistantLine,
    teardown
  }
}
