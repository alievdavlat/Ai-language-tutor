import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Tabs, type TabItem } from '../../components/ui'
import { useSettingsPatch } from './hooks/useSettingsPatch'
import AccentSection from './sections/AccentSection'
import MicModeSection from './sections/MicModeSection'
import CorrectionSection from './sections/CorrectionSection'
import SpeakingRateSection from './sections/SpeakingRateSection'
import CharacterSection from './sections/CharacterSection'
import VoiceSection from './sections/VoiceSection'
import LLMModelSection from './sections/LLMModelSection'
import STTEngineSection from './sections/STTEngineSection'
import SidecarsSection from './sections/SidecarsSection'
import SystemInfoSection from './sections/SystemInfoSection'
import DangerZoneSection from './sections/DangerZoneSection'

type SettingsTab = 'conversation' | 'voice' | 'ai' | 'system'

const TABS: readonly TabItem<SettingsTab>[] = [
  { id: 'conversation', label: '🗣️ Conversation' },
  { id: 'voice', label: '🎙️ Voice' },
  { id: 'ai', label: '🧠 AI' },
  { id: 'system', label: '⚙️ System' }
] as const

export default function SettingsPage(): JSX.Element {
  const hw = useAppStore((s) => s.hw)
  const rec = useAppStore((s) => s.rec)
  const ollama = useAppStore((s) => s.ollama)
  const { profile, saving, patch } = useSettingsPatch()
  const [tab, setTab] = useState<SettingsTab>('conversation')

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No profile.
      </div>
    )
  }

  const s = profile.settings

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
              Tune your conversation partner, voice engine, AI model and system services.
            </p>
          </div>
          {saving && <span className="text-xs text-brand-300">● saving…</span>}
        </header>

        <div className="mb-6">
          <Tabs items={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === 'conversation' && (
          <div className="grid grid-cols-1 gap-4">
            <CharacterSection
              currentId={s.characterId}
              currentAccent={s.accent}
              onPick={(characterId, accent) => void patch({ characterId, accent })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AccentSection current={s.accent} onChange={(accent) => void patch({ accent })} />
              <CorrectionSection
                current={s.correctionStyle}
                onChange={(correctionStyle) => void patch({ correctionStyle })}
              />
              <MicModeSection
                current={s.micMode}
                onChange={(micMode) => void patch({ micMode })}
              />
              <SpeakingRateSection
                current={s.ttsSpeed}
                onChange={(ttsSpeed) => void patch({ ttsSpeed })}
              />
            </div>
          </div>
        )}

        {tab === 'voice' && (
          <div className="grid grid-cols-1 gap-4">
            <VoiceSection
              accent={s.accent}
              currentVoiceURI={s.voiceURI}
              onPick={(voiceURI) => void patch({ voiceURI })}
            />
            <STTEngineSection
              engine={s.sttEngine}
              currentModel={s.whisperModel}
              onEngineChange={(sttEngine) => void patch({ sttEngine })}
              onModelChange={(whisperModel) => void patch({ whisperModel })}
            />
          </div>
        )}

        {tab === 'ai' && (
          <div className="grid grid-cols-1 gap-4">
            <LLMModelSection
              currentTag={s.llmModel}
              recommendedTag={rec?.llm.tag ?? ''}
              freeRamGB={hw?.freeRamGB ?? 0}
              onPick={(llmModel) => void patch({ llmModel })}
            />
          </div>
        )}

        {tab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SidecarsSection />
            <SystemInfoSection hw={hw} rec={rec} ollama={ollama} />
            <DangerZoneSection />
          </div>
        )}
      </div>
    </div>
  )
}
