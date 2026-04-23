import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage, UserProfile } from '@shared/types'
import { ACCENT_TO_LANG, ACCENT_TO_PERSONA_NAME, resolveCharacter } from '@shared/constants'
import { useAppStore } from '../../store/useAppStore'
import { useAudioLevel } from '../../hooks/useAudioLevel'
import { useChatStream } from '../../hooks/useChatStream'
import { useStreamingSpeaker } from '../../hooks/useStreamingSpeaker'
import { useSTT } from '../../hooks/stt'
import { useTTS } from '../../hooks/tts'
import { useWhisperModelLoader } from '../../hooks/useWhisperModelLoader'
import { buildSystemPrompt } from '../../services/prompts'
import { cn } from '../../lib/classnames'
import { ProgressBar } from '../../components/ui'
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

function sublabelFor(state: CallState, interim: string): string {
  // Interim transcription text wins over state defaults — this is what tells
  // the user "your speech actually made it to the pipeline."
  if (interim) return interim
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
  const setProfile = useAppStore((s) => s.setProfile)

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No profile loaded.
      </div>
    )
  }

  return (
    <CallPageInner profile={profile} rec={rec} ollama={ollama} setProfile={setProfile} />
  )
}

interface InnerProps {
  profile: UserProfile
  rec: ReturnType<typeof useAppStore.getState>['rec']
  ollama: ReturnType<typeof useAppStore.getState>['ollama']
  setProfile: (p: UserProfile | null) => void
}

function CallPageInner({ profile, rec, ollama, setProfile }: InnerProps): JSX.Element {
  const navigate = useNavigate()
  const model = profile.settings.llmModel || rec?.llm.tag || ''

  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [engineNotice, setEngineNotice] = useState<string | null>(null)

  // Whisper progress — so the user actually sees the first-time download
  // happening instead of staring at a silent "Listening…" orb.
  const whisperLoader = useWhisperModelLoader(profile.settings.whisperModel)
  const whisperEngine = profile.settings.sttEngine === 'whisper-local'
  const whisperWarming = whisperEngine && !whisperLoader.loaded

  // Auto-fallback: if Whisper can't load (timeout, 404, offline, etc.) flip
  // the user's engine to Web Speech and tell them why. This is the one real
  // recovery path on an 8 GB laptop with flaky internet.
  const switchToWebSpeech = useCallback(
    async (reason: string): Promise<void> => {
      if (profile.settings.sttEngine === 'web-speech') return
      const next: UserProfile = {
        ...profile,
        settings: { ...profile.settings, sttEngine: 'web-speech' }
      }
      try {
        await window.api.profile.save(next)
      } catch (err) {
        console.error('[call] profile save failed during fallback', err)
      }
      setProfile(next)
      setEngineNotice(
        `Switched to online Web Speech — Whisper couldn't load (${reason}). You can switch back in Settings once you're online.`
      )
    },
    [profile, setProfile]
  )

  // TTS — drives the orb pulse when the character is talking.
  const { speaking, currentVisemeWeight, speak, cancel } = useTTS({
    accent: profile.settings.accent,
    rate: profile.settings.ttsSpeed,
    voiceURI: profile.settings.voiceURI
  })

  const { streaming, send, abort: abortChat } = useChatStream(model)

  // Streaming speaker — chunks the LLM output into sentences so audio starts
  // ~3× sooner. The same cancel() wipes queue + current utterance for barge-in.
  const streamer = useStreamingSpeaker({
    speak: (text) => speak(text),
    cancel: () => cancel()
  })

  const historyRef = useRef<ChatMessage[]>([])

  const handleTurn = useCallback(
    async (transcript: string): Promise<void> => {
      if (!transcript.trim()) return
      // New turn — drop any leftover speech from the previous AI reply.
      streamer.cancel()

      const systemPrompt = buildSystemPrompt(profile)
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyRef.current,
        { role: 'user', content: transcript }
      ]
      let reply = ''
      try {
        reply = await send(messages, (delta) => {
          streamer.feedDelta(delta)
        })
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
      await streamer.flushAndWait()
    },
    [profile, send, streamer]
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
    onSpeechStart: () => {
      // Barge-in — drop the AI's queued speech AND abort the Ollama stream
      // so the model doesn't keep generating a reply the user interrupted.
      if (speaking) streamer.cancel()
      abortChat()
    },
    onFinal: (text) => {
      void handleTurn(text)
    },
    onEngineFallback: (reason) => {
      void switchToWebSpeech(reason)
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
    streamer.cancel()
    abortChat()
    void stt.stop()
    navigate('/speaking')
  }, [streamer, abortChat, stt, navigate])

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
      streamer.cancel()
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
      <div className="relative z-10 text-center w-full max-w-lg px-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
          {ollamaReady ? 'Live call' : 'Waiting for Ollama'}
        </div>
        <div className="text-sm text-slate-400">
          {profile.settings.accent.toUpperCase()} accent · Level {profile.level}
        </div>

        {whisperWarming && (
          <div className="mt-4 rounded-xl bg-brand-500/15 border border-brand-400/30 px-4 py-3 text-left">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs text-brand-100">
                🎧 Loading Whisper <code className="text-brand-200">
                  {profile.settings.whisperModel}
                </code> — first time only.
              </span>
              <span className="shrink-0 text-xs font-semibold text-brand-100">
                {Math.round(whisperLoader.progress * 100)}%
              </span>
            </div>
            <ProgressBar value={Math.round(whisperLoader.progress * 100)} />
            {whisperLoader.error && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-red-300">
                  ⚠️ {whisperLoader.error}
                </span>
                <button
                  onClick={() => void switchToWebSpeech(whisperLoader.error ?? 'load failed')}
                  className="text-[11px] text-brand-200 underline hover:text-brand-100 shrink-0"
                >
                  Use Web Speech
                </button>
              </div>
            )}
          </div>
        )}

        {engineNotice && (
          <div className="mt-3 rounded-xl bg-amber-500/15 border border-amber-400/30 px-4 py-2 text-[11px] text-amber-100">
            {engineNotice}
          </div>
        )}
      </div>

      {/* Middle — orb */}
      <div className="relative z-10 flex flex-col items-center">
        <VoiceOrb
          state={callState}
          intensity={orbIntensity}
          label={displayName}
          sublabel={sublabelFor(callState, stt.state.interim)}
        />

        {stt.state.error && (
          <div className="mt-24 max-w-sm text-center">
            <p className="text-xs text-red-300">⚠️ {stt.state.error}</p>
            {whisperEngine && (
              <button
                onClick={() => void switchToWebSpeech(stt.state.error ?? 'manual switch')}
                className="mt-2 text-xs text-brand-300 underline hover:text-brand-200"
              >
                Switch to Web Speech
              </button>
            )}
          </div>
        )}

        {error && !stt.state.error && (
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
