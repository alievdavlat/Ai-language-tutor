import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MicMode, UserProfile } from '@shared/types'
import { ACCENT_TO_LANG, ACCENT_TO_PERSONA_NAME } from '@shared/constants'
import { useAppStore } from '../../../store/useAppStore'
import { useSTT } from '../../../hooks/stt'
import { useTTS } from '../../../hooks/tts'
import { useChatStream } from '../../../hooks/useChatStream'
import { useWhisperModelLoader } from '../../../hooks/useWhisperModelLoader'
import { micPrefsFromSettings } from '../../../lib/audio'
import type { AvatarEmotion, AvatarMode } from '../../../components/avatar'
import AINotReadyBanner from '../../../components/speaking/AINotReadyBanner'
import WhisperLoadingBanner from '../../../components/speaking/WhisperLoadingBanner'
import SpeakingHeader from '../sections/SpeakingHeader'
import AvatarPanel from '../sections/AvatarPanel'
import ChatPanel from '../sections/ChatPanel'
import { useTurnHandler } from '../hooks/useTurnHandler'

function statusLabel(speaking: boolean, streaming: boolean, listening: boolean): string {
  if (speaking) return 'Speaking…'
  if (streaming) return 'Thinking…'
  if (listening) return 'Listening…'
  return 'Ready'
}

function emotionFor(speaking: boolean, streaming: boolean): AvatarEmotion {
  if (speaking) return 'happy'
  if (streaming) return 'thinking'
  return 'neutral'
}

interface ConversationModeProps {
  topic: string
  onTopicChange: (t: string) => void
}

export default function ConversationMode({ topic, onTopicChange }: ConversationModeProps): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const rec = useAppStore((s) => s.rec)
  const ollama = useAppStore((s) => s.ollama)
  const setProfile = useAppStore((s) => s.setProfile)
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('2d')

  // profile is guaranteed by the hub guard, but keep TS happy.
  if (!profile) {
    return <div className="h-full flex items-center justify-center text-slate-400">Loading…</div>
  }

  const model = profile.settings.llmModel || rec?.llm.tag || ''
  const accent = profile.settings.accent
  const micMode: MicMode = profile.settings.micMode

  const { speaking, currentVisemeWeight, speak, cancel } = useTTS({
    accent,
    rate: profile.settings.ttsSpeed,
    voiceURI: profile.settings.voiceURI
  })

  const { streaming, error: chatError, send, abort: abortChat } = useChatStream(model)

  const { turns, handleUserTurn, cancelCurrent } = useTurnHandler({
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
    micPrefs: micPrefsFromSettings(profile.settings),
    onSpeechStart: () => {
      if (speaking) cancelCurrent()
      abortChat()
    },
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

  const whisperLoader = useWhisperModelLoader(profile.settings.whisperModel)
  const whisperWarming = profile.settings.sttEngine === 'whisper-local' && !whisperLoader.loaded

  const ollamaReady = !!ollama?.running && ollama.models.length > 0
  const disabled = !ollamaReady || streaming
  const avatarName = useMemo(() => ACCENT_TO_PERSONA_NAME[accent], [accent])

  useEffect(() => {
    return () => {
      void stt.stop()
      cancelCurrent()
      abortChat()
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
        onAvatarModeChange={setAvatarMode}
        callEnabled={ollamaReady}
      />

      {!ollamaReady && <AINotReadyBanner />}

      {whisperWarming && (
        <WhisperLoadingBanner progress={Math.round(whisperLoader.progress * 100)} error={whisperLoader.error} />
      )}

      {chatError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 text-xs text-red-200 flex items-center justify-between gap-3">
          <span>Something went wrong with the AI response.</span>
          <button onClick={() => navigate('/settings')} className="text-xs underline hover:text-white shrink-0">
            Settings →
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 p-5 overflow-hidden">
        <AvatarPanel
          mode={avatarMode}
          mouthOpen={speaking ? currentVisemeWeight : 0}
          emotion={emotionFor(speaking, streaming)}
          name={avatarName}
          topic={topic}
          onTopicChange={onTopicChange}
          statusLabel={statusLabel(speaking, streaming, stt.state.listening)}
          listening={stt.state.listening}
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
