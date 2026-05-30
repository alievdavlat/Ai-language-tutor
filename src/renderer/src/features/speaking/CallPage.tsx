import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage, ModelRecommendation, OllamaStatus, UserProfile } from '@shared/types'
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
import { micPrefsFromSettings } from '../../lib/audio'
import { useActiveAI } from '../../lib/ai'
import AINotReadyBanner from '../../components/speaking/AINotReadyBanner'
import WhisperLoadingBanner from '../../components/speaking/WhisperLoadingBanner'
import VoiceOrb, { type CallState } from './components/VoiceOrb'
import WaveVisualizer from './components/WaveVisualizer'
import CallControls from './sections/CallControls'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum conversation turns kept in memory to bound context window usage. */
const HISTORY_CAP = 20

// ─── Derived state helpers ────────────────────────────────────────────────────

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
  if (interim) return interim
  const labels: Record<CallState, string> = {
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
    muted: 'Mic muted',
    idle: 'Say something to start'
  }
  return labels[state]
}

/** Format elapsed seconds as mm:ss */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface InnerProps {
  profile: UserProfile
  rec: ModelRecommendation | null
  ollama: OllamaStatus | null
  setProfile: (p: UserProfile | null) => void
}

// ─── Root component (profile guard) ──────────────────────────────────────────

export default function CallPage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const rec = useAppStore((s) => s.rec)
  const ollama = useAppStore((s) => s.ollama)
  const setProfile = useAppStore((s) => s.setProfile)

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Loading…
      </div>
    )
  }

  return <CallPageInner profile={profile} rec={rec} ollama={ollama} setProfile={setProfile} />
}

// ─── Inner component (all hooks, all logic) ───────────────────────────────────

function CallPageInner({ profile, rec, ollama, setProfile }: InnerProps): JSX.Element {
  const navigate = useNavigate()
  const model = profile.settings.llmModel || rec?.llm.tag || ''

  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [engineSwitched, setEngineSwitched] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Call timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1_000)
    return () => clearInterval(id)
  }, [])

  const whisperLoader = useWhisperModelLoader(profile.settings.whisperModel)
  const whisperEngine = profile.settings.sttEngine === 'whisper-local'
  const whisperWarming = whisperEngine && !whisperLoader.loaded

  const switchToWebSpeech = useCallback(
    async (reason: string): Promise<void> => {
      if (profile.settings.sttEngine === 'web-speech') return
      // Web Speech only has a chance of working with connectivity — offline it
      // would just trade Whisper's error for a `network` error, so we keep
      // Whisper (with its error surfaced) and let the user retry / go type.
      if (!navigator.onLine) return
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
      setEngineSwitched(true)
      console.info('[call] switched to web-speech:', reason)
    },
    [profile, setProfile]
  )

  const { speaking, currentVisemeWeight, speak, cancel } = useTTS({
    accent: profile.settings.accent,
    rate: profile.settings.ttsSpeed,
    voiceURI: profile.settings.voiceURI
  })

  const { streaming, send, abort: abortChat } = useChatStream(model)

  const streamer = useStreamingSpeaker({
    speak: (text) => speak(text),
    cancel: () => cancel()
  })

  const historyRef = useRef<ChatMessage[]>([])

  const handleTurn = useCallback(
    async (transcript: string): Promise<void> => {
      if (!transcript.trim()) return
      streamer.cancel()

      const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(profile) },
        ...historyRef.current,
        { role: 'user', content: transcript }
      ]

      let reply = ''
      try {
        reply = await send(messages, (delta) => streamer.feedDelta(delta))
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return
      }

      if (!reply) {
        setError('No response from the AI. Check your internet connection or settings.')
        return
      }

      const nextHistory: ChatMessage[] = [
        ...historyRef.current,
        { role: 'user', content: transcript },
        { role: 'assistant', content: reply }
      ]
      historyRef.current = nextHistory.slice(-HISTORY_CAP)
      await streamer.flushAndWait()
    },
    [profile, send, streamer]
  )

  const activeAI = useActiveAI()
  const ollamaReady = !!activeAI || (!!ollama?.running && ollama.models.length > 0)
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
      if (speaking) streamer.cancel()
      abortChat()
    },
    onFinal: (text) => void handleTurn(text),
    onEngineFallback: (reason) => void switchToWebSpeech(reason)
  })

  useEffect(() => {
    if (micEnabled) void stt.start()
    else void stt.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micEnabled])

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
    if (stt.state.listening) return micLevel
    return 0.05
  }, [speaking, currentVisemeWeight, stt.state.listening, micLevel])

  const character = resolveCharacter(profile, profile.settings.characterId)
  const displayName = character?.name ?? ACCENT_TO_PERSONA_NAME[profile.settings.accent]

  const endCall = useCallback((): void => {
    streamer.cancel()
    abortChat()
    void stt.stop()
    navigate('/speaking')
  }, [streamer, abortChat, stt, navigate])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') endCall()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [endCall])

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
        'flex flex-col items-center justify-between py-10'
      )}
    >
      <EmotionBackdrop state={callState} />

      <CallHeader
        displayName={displayName}
        level={profile.level}
        elapsed={elapsed}
        ollamaReady={ollamaReady}
        whisperWarming={whisperWarming}
        whisperProgress={Math.round(whisperLoader.progress * 100)}
        whisperError={whisperLoader.error}
        engineSwitched={engineSwitched}
        onSwitchToWebSpeech={() => void switchToWebSpeech(whisperLoader.error ?? 'manual')}
      />

      <OrbSection
        callState={callState}
        orbIntensity={orbIntensity}
        displayName={displayName}
        sublabel={sublabelFor(callState, stt.state.interim)}
        sttError={stt.state.error}
        chatError={error}
        onSwitchToWebSpeech={() => void switchToWebSpeech(stt.state.error ?? 'manual')}
        showWebSpeechSwitch={whisperEngine}
      />

      <CallFooter
        callState={callState}
        orbIntensity={orbIntensity}
        muted={muted}
        paused={paused}
        onToggleMute={() => setMuted((v) => !v)}
        onTogglePause={() => setPaused((v) => !v)}
        onEndCall={endCall}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CallHeaderProps {
  displayName: string
  level: string
  elapsed: number
  ollamaReady: boolean
  whisperWarming: boolean
  whisperProgress: number
  whisperError?: string | null
  engineSwitched: boolean
  onSwitchToWebSpeech: () => void
}

function CallHeader({
  displayName,
  level,
  elapsed,
  ollamaReady,
  whisperWarming,
  whisperProgress,
  whisperError,
  engineSwitched,
  onSwitchToWebSpeech
}: CallHeaderProps): JSX.Element {
  return (
    <div className="relative z-10 text-center w-full max-w-lg px-6">
      {/* Top row: name + timer */}
      <div className="flex items-center justify-center gap-3 mb-1">
        <div className="text-base font-semibold text-slate-200">{displayName}</div>
        <div className="text-slate-600 text-xs">·</div>
        <div className="text-xs text-slate-500">Level {level}</div>
      </div>

      {/* Call status + duration */}
      <div className="flex items-center justify-center gap-2 mb-1">
        {ollamaReady ? (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
        )}
        <span className="text-xs text-slate-500">
          {ollamaReady ? formatDuration(elapsed) : 'Starting up…'}
        </span>
      </div>

      {!ollamaReady && (
        <div className="mt-3">
          <AINotReadyBanner />
        </div>
      )}

      {whisperWarming && (
        <div className="mt-3">
          <WhisperLoadingBanner
            progress={whisperProgress}
            error={whisperError}
            onFallback={onSwitchToWebSpeech}
          />
        </div>
      )}

      {engineSwitched && (
        <div className="mt-3 rounded-xl bg-amber-500/15 border border-amber-400/30 px-4 py-2 text-[11px] text-amber-100">
          Switched to browser speech recognition for better compatibility.
        </div>
      )}
    </div>
  )
}

interface OrbSectionProps {
  callState: CallState
  orbIntensity: number
  displayName: string
  sublabel: string
  sttError?: string | null
  chatError?: string | null
  showWebSpeechSwitch: boolean
  onSwitchToWebSpeech: () => void
}

function OrbSection({
  callState,
  orbIntensity,
  displayName,
  sublabel,
  sttError,
  chatError,
  showWebSpeechSwitch,
  onSwitchToWebSpeech
}: OrbSectionProps): JSX.Element {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <VoiceOrb
        state={callState}
        intensity={orbIntensity}
        label={displayName}
        sublabel={sublabel}
      />

      {sttError && (
        <div className="mt-28 max-w-sm text-center">
          <p className="text-xs text-red-300">{sttError}</p>
          {showWebSpeechSwitch && (
            <button
              onClick={onSwitchToWebSpeech}
              className="mt-2 text-xs text-brand-300 underline hover:text-brand-200"
            >
              Use alternative speech recognition
            </button>
          )}
        </div>
      )}

      {chatError && !sttError && (
        <p className="mt-28 text-xs text-red-300 max-w-sm text-center">{chatError}</p>
      )}
    </div>
  )
}

interface CallFooterProps {
  callState: CallState
  orbIntensity: number
  muted: boolean
  paused: boolean
  onToggleMute: () => void
  onTogglePause: () => void
  onEndCall: () => void
}

function CallFooter({
  callState,
  orbIntensity,
  muted,
  paused,
  onToggleMute,
  onTogglePause,
  onEndCall
}: CallFooterProps): JSX.Element {
  return (
    <div className="relative z-10 w-full max-w-md flex flex-col gap-5">
      <WaveVisualizer
        intensity={orbIntensity}
        active={callState === 'listening' || callState === 'speaking'}
        color={callState === 'speaking' ? '#c084fc' : '#6ee7b7'}
      />

      <CallControls
        muted={muted}
        paused={paused}
        onToggleMute={onToggleMute}
        onTogglePause={onTogglePause}
        onEndCall={onEndCall}
      />

      <p className="text-[10px] text-slate-600 text-center">
        Press Esc or tap End call · Everything stays on this device
      </p>
    </div>
  )
}

function EmotionBackdrop({ state }: { state: CallState }): JSX.Element {
  const gradient: Record<CallState, string> = {
    idle: 'from-slate-900 via-slate-950 to-black',
    listening: 'from-emerald-950/60 via-slate-950 to-black',
    thinking: 'from-amber-950/50 via-slate-950 to-black',
    speaking: 'from-brand-950/65 via-slate-950 to-black',
    muted: 'from-rose-950/55 via-slate-950 to-black'
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
