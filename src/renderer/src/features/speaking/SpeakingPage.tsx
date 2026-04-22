import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  MicMode,
  ModelRecommendation,
  OllamaStatus,
  UserProfile
} from '@shared/types'
import { ACCENT_TO_LANG, ACCENT_TO_PERSONA_NAME } from '@shared/constants'
import { useAppStore } from '../../store/useAppStore'
import { useSTT } from '../../hooks/stt'
import { useTTS } from '../../hooks/tts'
import { useChatStream } from '../../hooks/useChatStream'
import { useWhisperModelLoader } from '../../hooks/useWhisperModelLoader'
import { ProgressBar } from '../../components/ui'
import type { AvatarEmotion, AvatarMode } from '../../components/avatar'
import SpeakingHeader from './sections/SpeakingHeader'
import AvatarPanel from './sections/AvatarPanel'
import ChatPanel from './sections/ChatPanel'
import { useTurnHandler } from './hooks/useTurnHandler'

function statusLabel(
  speaking: boolean,
  streaming: boolean,
  listening: boolean
): string {
  if (speaking) return '🔊 Speaking…'
  if (streaming) return '💭 Thinking…'
  if (listening) return '🎤 Listening…'
  return '💤 Idle'
}

function emotionFor(speaking: boolean, streaming: boolean): AvatarEmotion {
  if (speaking) return 'happy'
  if (streaming) return 'thinking'
  return 'neutral'
}

export default function SpeakingPage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const rec = useAppStore((s) => s.rec)
  const ollama = useAppStore((s) => s.ollama)
  const setProfile = useAppStore((s) => s.setProfile)
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('2d')
  const [topic, setTopic] = useState('')

  if (!profile) {
    return <div className="h-full flex items-center justify-center text-slate-400">No profile.</div>
  }

  return (
    <SpeakingPageInner
      profile={profile}
      rec={rec}
      ollama={ollama}
      setProfile={setProfile}
      avatarMode={avatarMode}
      onAvatarModeChange={setAvatarMode}
      topic={topic}
      onTopicChange={setTopic}
    />
  )
}

interface InnerProps {
  profile: UserProfile
  rec: ModelRecommendation | null
  ollama: OllamaStatus | null
  setProfile: (p: UserProfile | null) => void
  avatarMode: AvatarMode
  onAvatarModeChange: (m: AvatarMode) => void
  topic: string
  onTopicChange: (t: string) => void
}

function SpeakingPageInner({
  profile,
  rec,
  ollama,
  setProfile,
  avatarMode,
  onAvatarModeChange,
  topic,
  onTopicChange
}: InnerProps): JSX.Element {
  const navigate = useNavigate()
  // User's explicit choice wins; fall back to the hardware recommendation.
  const model = profile.settings.llmModel || rec?.llm.tag || ''
  const accent = profile.settings.accent
  const micMode: MicMode = profile.settings.micMode

  const { speaking, currentVisemeWeight, speak, cancel } = useTTS({
    accent,
    rate: profile.settings.ttsSpeed,
    voiceURI: profile.settings.voiceURI
  })
  const { streaming, error: chatError, send } = useChatStream(model)

  const { turns, handleUserTurn } = useTurnHandler({
    profile,
    topic,
    sendChat: send,
    speak,
    cancelSpeak: cancel
  })

  const stt = useSTT({
    engine: profile.settings.sttEngine,
    mode: micMode,
    lang: ACCENT_TO_LANG[accent],
    whisperModel: profile.settings.whisperModel,
    onFinal: (transcript) => {
      if (speaking) cancel()
      void handleUserTurn(transcript)
    }
  })

  const setMicMode = async (m: MicMode): Promise<void> => {
    const next: UserProfile = { ...profile, settings: { ...profile.settings, micMode: m } }
    await window.api.profile.save(next)
    setProfile(next)
    void stt.stop()
  }

  const whisperEngine = profile.settings.sttEngine === 'whisper-local'
  const whisperLoader = useWhisperModelLoader(profile.settings.whisperModel)
  const whisperWarming = whisperEngine && !whisperLoader.loaded

  const ollamaReady = !!ollama?.running && ollama.models.length > 0
  const disabled = !ollamaReady || streaming

  const avatarName = useMemo(() => ACCENT_TO_PERSONA_NAME[accent], [accent])

  useEffect(() => {
    return () => {
      void stt.stop()
      cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-full flex flex-col">
      <SpeakingHeader
        accent={accent}
        level={profile.level}
        correctionStyle={profile.settings.correctionStyle}
        avatarMode={avatarMode}
        onAvatarModeChange={onAvatarModeChange}
        callEnabled={ollamaReady}
      />

      {!ollamaReady && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-2 text-xs text-amber-100">
          ⚠️ Ollama is not running or no model is loaded. Start Ollama and download{' '}
          <code>{model}</code> to chat.
        </div>
      )}
      {whisperWarming && (
        <div className="bg-brand-500/15 border-b border-brand-400/30 px-6 py-2 text-xs text-brand-100">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span>
              🎧 Loading Whisper model&nbsp;
              <code className="text-brand-200">{profile.settings.whisperModel}</code> — first
              time only, cached afterwards.
            </span>
            <span className="shrink-0 font-semibold">
              {Math.round(whisperLoader.progress * 100)}%
            </span>
          </div>
          <ProgressBar value={Math.round(whisperLoader.progress * 100)} />
        </div>
      )}
      {chatError && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-2 text-xs text-red-100 flex items-center justify-between gap-3">
          <span>
            ⚠️ {chatError}
            {/memory|RAM|out of memory/i.test(chatError) && (
              <span className="ml-1 text-red-200">
                Try a smaller LLM in Settings → Language model.
              </span>
            )}
          </span>
          <button
            onClick={() => navigate('/settings')}
            className="text-xs underline hover:text-white shrink-0"
          >
            Open Settings →
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 p-6 overflow-hidden max-w-[1400px] w-full mx-auto">
        <AvatarPanel
          mode={avatarMode}
          mouthOpen={speaking ? currentVisemeWeight : 0}
          emotion={emotionFor(speaking, streaming)}
          name={avatarName}
          topic={topic}
          onTopicChange={onTopicChange}
          statusLabel={statusLabel(speaking, streaming, stt.state.listening)}
        />
        <ChatPanel
          turns={turns}
          micMode={micMode}
          listening={stt.state.listening}
          interim={stt.state.interim}
          disabled={disabled}
          onMicModeChange={(m) => void setMicMode(m)}
          onStartMic={() => {
            if (speaking) cancel()
            void stt.start()
          }}
          onStopMic={() => void stt.stop()}
          onTextSubmit={(t) => void handleUserTurn(t)}
        />
      </div>
    </div>
  )
}
