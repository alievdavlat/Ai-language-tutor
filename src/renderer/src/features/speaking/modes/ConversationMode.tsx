import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MicMode, UserProfile } from '@shared/types'
import {
  ACCENT_TO_LANG,
  ACCENT_TO_PERSONA_NAME,
  bumpRelationshipScore,
  characterAppearance,
  relationshipScore,
  resolveCharacter
} from '@shared/constants'
import { characterAvatarUrl } from '@shared/utils/avatar'
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
import { useActiveAI } from '../../../lib/ai'
import { emotionFromText } from '../../../lib/emotion'

function statusLabel(speaking: boolean, streaming: boolean, listening: boolean): string {
  if (speaking) return 'Speaking…'
  if (streaming) return 'Thinking…'
  if (listening) return 'Listening…'
  return 'Ready'
}

/** Friendly hint for common Web Speech / mic errors so a silent failure is visible. */
function sttErrorHint(err: string): string {
  switch (err) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone is blocked. Allow mic access for the app, then tap the mic again.'
    case 'audio-capture':
      return 'No microphone found. Plug one in or check your input device.'
    case 'no-speech':
      return "Didn't catch anything — tap the mic and speak a little louder."
    case 'network':
      return 'Speech recognition needs internet (Web Speech). Check your connection, or you can still type.'
    case 'aborted':
      return 'Mic stopped. Tap to start again.'
    default:
      return `Microphone error: ${err}. You can type instead while we sort it out.`
  }
}

/**
 * Phase 13 — the avatar's face follows the conversation: thinking while the
 * model generates, then the emotion inferred from what it actually said
 * (smiling at good news, surprised at "wow!", etc.).
 */
function emotionFor(speaking: boolean, streaming: boolean, replyText: string): AvatarEmotion {
  if (streaming) return 'thinking'
  const fromText = emotionFromText(replyText)
  if (speaking && fromText === 'neutral') return 'happy'
  return fromText
}

interface ConversationModeProps {
  topic: string
  onTopicChange: (t: string) => void
}

export default function ConversationMode({ topic, onTopicChange }: ConversationModeProps): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)

  // profile is guaranteed by the hub guard, but keep TS happy.
  if (!profile) {
    return <div className="h-full flex items-center justify-center text-slate-400">Loading…</div>
  }

  const accent = profile.settings.accent
  const micMode: MicMode = profile.settings.micMode
  const activeCharacter = resolveCharacter(profile, profile.settings.characterId)
  // The avatar follows the selected companion's own type (set in Avatar Studio).
  const avatarKind = activeCharacter?.avatarKind ?? (profile.settings.avatarMode === '3d' ? '3d' : '2d')
  const avatarMode: AvatarMode = avatarKind === '2d' ? '2d' : '3d'

  const { speaking, currentVisemeWeight, speak, cancel } = useTTS({
    accent,
    rate: profile.settings.ttsSpeed,
    voiceURI: profile.settings.voiceURI
  })

  const { streaming, error: chatError, send, abort: abortChat } = useChatStream('')

  // Phase 8 — grow the bond a little after each completed exchange, persisting
  // to the profile (reads latest store state so repeated turns don't stale-out).
  const bumpRelationship = useCallback(() => {
    const current = useAppStore.getState().profile
    if (!current) return
    const id = current.settings.characterId
    if (!id || !resolveCharacter(current, id)) return
    const next: UserProfile = {
      ...current,
      relationships: {
        ...(current.relationships ?? {}),
        [id]: bumpRelationshipScore(relationshipScore(current.relationships, id))
      }
    }
    setProfile(next)
    void window.api.profile.save(next)
  }, [setProfile])

  const { turns, handleUserTurn, cancelCurrent } = useTurnHandler({
    profile,
    topic,
    sendChat: send,
    speak,
    cancelSpeak: cancel,
    greeting: activeCharacter?.greeting,
    onExchangeComplete: bumpRelationship
  })

  // First-run model warm-up status, so the mic isn't a silent "Ready" while the
  // bundled Whisper model is still compiling.
  const whisperEngine = profile.settings.sttEngine === 'whisper-local'
  const whisperLoader = useWhisperModelLoader(profile.settings.whisperModel)
  const whisperWarming = whisperEngine && whisperLoader.loading && !whisperLoader.loaded

  // Fallback chain: Whisper → Web Speech (only when online) → keep typing.
  const switchToWebSpeech = useCallback(async (): Promise<void> => {
    if (!navigator.onLine || profile.settings.sttEngine === 'web-speech') return
    const next: UserProfile = {
      ...profile,
      settings: { ...profile.settings, sttEngine: 'web-speech' }
    }
    await window.api.profile.save(next)
    setProfile(next)
  }, [profile, setProfile])

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
    },
    onEngineFallback: () => void switchToWebSpeech()
  })

  const setMicMode = async (m: MicMode): Promise<void> => {
    const next: UserProfile = { ...profile, settings: { ...profile.settings, micMode: m } }
    await window.api.profile.save(next)
    setProfile(next)
    void stt.stop()
  }

  const activeAI = useActiveAI()
  const aiReady = !!activeAI
  const disabled = !aiReady || streaming
  const avatarName = useMemo(
    () => activeCharacter?.name ?? ACCENT_TO_PERSONA_NAME[accent],
    [activeCharacter, accent]
  )
  const avatarAppearance = useMemo(() => characterAppearance(activeCharacter), [activeCharacter])
  const avatarPortrait = useMemo(
    () => (activeCharacter?.avatarSeed ? characterAvatarUrl(activeCharacter, 320) : undefined),
    [activeCharacter]
  )
  // Phase 13 — latest assistant line drives the avatar's expression.
  const lastReply = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].role === 'assistant' && turns[i].text) return turns[i].text
    }
    return ''
  }, [turns])

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
        profile={profile}
        level={profile.level}
        correctionStyle={profile.settings.correctionStyle}
        callEnabled={aiReady}
      />

      {!aiReady && <AINotReadyBanner />}

      {whisperWarming && (
        <WhisperLoadingBanner
          progress={Math.round(whisperLoader.progress * 100)}
          error={whisperLoader.error}
          onFallback={() => void switchToWebSpeech()}
        />
      )}

      {chatError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 text-xs text-red-200 flex items-center justify-between gap-3">
          <span className="min-w-0">{chatError}</span>
          <button onClick={() => navigate('/settings')} className="text-xs underline hover:text-white shrink-0">
            Settings →
          </button>
        </div>
      )}

      {stt.state.error && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-200">
          🎙 {sttErrorHint(stt.state.error)}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 p-5 overflow-hidden">
        <AvatarPanel
          mode={avatarMode}
          mouthOpen={speaking ? currentVisemeWeight : 0}
          emotion={emotionFor(speaking, streaming, lastReply)}
          name={avatarName}
          topic={topic}
          onTopicChange={onTopicChange}
          statusLabel={statusLabel(speaking, streaming, stt.state.listening)}
          listening={stt.state.listening}
          vrmUrl={avatarKind === 'vrm' ? activeCharacter?.vrmUrl || profile.settings.vrmModelUrl || undefined : undefined}
          appearance={avatarAppearance}
          portraitUrl={avatarPortrait}
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
          companionName={avatarName}
          companionAvatarUrl={avatarPortrait}
        />
      </div>
    </div>
  )
}
