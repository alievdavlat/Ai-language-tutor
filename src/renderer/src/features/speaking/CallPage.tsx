import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage, UserProfile } from '@shared/types'
import { ACCENT_TO_LANG, ACCENT_TO_PERSONA_NAME, resolveCharacter } from '@shared/constants'
import { useAppStore } from '../../store/useAppStore'
import { useAudioLevel } from '../../hooks/useAudioLevel'
import { useChatStream } from '../../hooks/useChatStream'
import { useSTT } from '../../hooks/stt'
import { useTTS } from '../../hooks/tts'
import { buildSystemPrompt } from '../../services/prompts'
import { cn } from '../../lib/classnames'
import { micPrefsFromSettings } from '../../lib/audio'
import VoiceOrb, { type CallState } from './components/VoiceOrb'
import WaveVisualizer from './components/WaveVisualizer'
import CallControls from './sections/CallControls'

function deriveCallState(params: {
  muted: boolean
  paused: boolean
  listening: boolean
  streaming: boolean
  speaking: boolean
}): CallState {
  if (params.muted) return 'muted'
  if (params.paused) return 'idle'
  if (params.speaking) return 'speaking'
  if (params.streaming) return 'thinking'
  if (params.listening) return 'listening'
  return 'idle'
}

function sublabelFor(state: CallState): string {
  switch (state) {
    case 'listening':
      return 'Listening…'
    case 'thinking':
      return 'Thinking…'
    case 'speaking':
      return 'Speaking…'
    case 'muted':
      return 'Mic muted'
    case 'idle':
    default:
      return 'Say something to start'
  }
}

export default function CallPage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const rec = useAppStore((s) => s.rec)
  const ollama = useAppStore((s) => s.ollama)

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No profile loaded.
      </div>
    )
  }

  return <CallPageInner profile={profile} rec={rec} ollama={ollama} />
}

interface InnerProps {
  profile: UserProfile
  rec: ReturnType<typeof useAppStore.getState>['rec']
  ollama: ReturnType<typeof useAppStore.getState>['ollama']
}

function CallPageInner({ profile, rec, ollama }: InnerProps): JSX.Element {
  const navigate = useNavigate()
  const model = profile.settings.llmModel || rec?.llm.tag || ''

  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TTS — drives the orb pulse when the character is talking.
  const { speaking, currentVisemeWeight, speak, cancel } = useTTS({
    accent: profile.settings.accent,
    rate: profile.settings.ttsSpeed,
    voiceURI: profile.settings.voiceURI
  })

  const { streaming, send, abort: abortChat } = useChatStream(model)

  // Barge-in: the instant STT picks up speech, silence the AI and stop the
  // LLM from burning CPU finishing a turn the user has already interrupted.
  const handleBargeIn = useCallback((): void => {
    cancel()
    abortChat()
  }, [cancel, abortChat])

  const historyRef = useRef<ChatMessage[]>([])

  const handleTurn = useCallback(
    async (transcript: string): Promise<void> => {
      if (!transcript.trim()) return
      if (speaking) cancel()
      const systemPrompt = buildSystemPrompt(profile)
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyRef.current,
        { role: 'user', content: transcript }
      ]
      let reply = ''
      try {
        reply = await send(messages)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return
      }
      if (!reply) {
        setError('No response from the local model — check Settings → AI.')
        return
      }
      const nextHistory: ChatMessage[] = [
        ...historyRef.current,
        { role: 'user', content: transcript },
        { role: 'assistant', content: reply }
      ]
      historyRef.current = nextHistory.slice(-20)
      await speak(reply)
    },
    [profile, send, speak, speaking, cancel]
  )

  // Mic is only live when the user hasn't muted/paused and Ollama is ready.
  const ollamaReady = !!ollama?.running && ollama.models.length > 0
  const micEnabled = !muted && !paused && ollamaReady

  const micPrefs = micPrefsFromSettings(profile.settings)

  const stt = useSTT({
    engine: profile.settings.sttEngine,
    mode: 'always-on',
    lang: ACCENT_TO_LANG[profile.settings.accent],
    whisperModel: profile.settings.whisperModel,
    enabled: micEnabled,
    micPrefs,
    onSpeechStart: handleBargeIn,
    onFinal: (text) => {
      void handleTurn(text)
    }
  })

  // Start/stop STT loop based on mic enable flag
  useEffect(() => {
    if (micEnabled) void stt.start()
    else void stt.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micEnabled])

  // Mic-level for the voice orb — only when mic is hot
  const micLevel = useAudioLevel({
    enabled: micEnabled && stt.state.listening,
    fps: 30,
    micPrefs
  })

  const callState = deriveCallState({
    muted,
    paused,
    listening: stt.state.listening,
    streaming,
    speaking
  })

  const orbIntensity = useMemo(() => {
    if (speaking) return 0.5 + currentVisemeWeight * 0.5
    if (streaming) return 0.3 + Math.abs(Math.sin(Date.now() / 250)) * 0.3
    if (stt.state.listening) return micLevel
    return 0.05
  }, [speaking, currentVisemeWeight, streaming, stt.state.listening, micLevel])

  const character = resolveCharacter(profile, profile.settings.characterId)
  const displayName = character?.name ?? ACCENT_TO_PERSONA_NAME[profile.settings.accent]

  const endCall = useCallback((): void => {
    cancel()
    abortChat()
    void stt.stop()
    navigate('/speaking')
  }, [cancel, abortChat, stt, navigate])

  // Esc to end the call
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') endCall()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [endCall])

  // Global teardown when leaving
  useEffect(() => {
    return () => {
      cancel()
      abortChat()
      void stt.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={cn(
        'h-full w-full relative overflow-hidden animate-fade-in',
        'flex flex-col items-center justify-between py-14'
      )}
    >
      {/* Emotional gradient backdrop — shifts with call state */}
      <EmotionBackdrop state={callState} />

      {/* Top — minimal call chrome */}
      <div className="relative z-10 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
          {ollamaReady ? 'Live call' : 'Waiting for Ollama'}
        </div>
        <div className="text-sm text-slate-400">
          {profile.settings.accent.toUpperCase()} accent · Level {profile.level}
        </div>
      </div>

      {/* Middle — orb */}
      <div className="relative z-10 flex flex-col items-center">
        <VoiceOrb
          state={callState}
          intensity={orbIntensity}
          label={displayName}
          sublabel={sublabelFor(callState)}
        />

        {error && (
          <p className="mt-28 text-xs text-red-300 max-w-sm text-center">
            ⚠️ {error}
          </p>
        )}
      </div>

      {/* Wave + controls */}
      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        <WaveVisualizer
          intensity={orbIntensity}
          active={callState === 'listening' || callState === 'speaking'}
          color={callState === 'speaking' ? '#c084fc' : '#6ee7b7'}
        />

        <CallControls
          muted={muted}
          paused={paused}
          onToggleMute={() => setMuted((v) => !v)}
          onTogglePause={() => setPaused((v) => !v)}
          onEndCall={endCall}
        />

        <p className="text-[10px] text-slate-500 text-center">
          Press Esc or tap End-call to return · This call stays fully on this device
        </p>
      </div>
    </div>
  )
}

function EmotionBackdrop({ state }: { state: CallState }): JSX.Element {
  const gradient: Record<CallState, string> = {
    idle: 'from-slate-900 via-slate-950 to-black',
    listening: 'from-emerald-950/70 via-slate-950 to-black',
    thinking: 'from-amber-950/60 via-slate-950 to-black',
    speaking: 'from-violet-950/70 via-slate-950 to-black',
    muted: 'from-rose-950/60 via-slate-950 to-black'
  }
  return (
    <div
      aria-hidden
      className={cn(
        'absolute inset-0 bg-gradient-to-b transition-colors duration-700 ease-out',
        gradient[state]
      )}
    />
  )
}
