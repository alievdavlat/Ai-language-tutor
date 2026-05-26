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
import MicProcessingSection from './sections/MicProcessingSection'
import STTEngineSection from './sections/STTEngineSection'
import DangerZoneSection from './sections/DangerZoneSection'

type SettingsTab = 'companion' | 'conversation' | 'microphone'

const TABS: readonly TabItem<SettingsTab>[] = [
  { id: 'companion', label: 'Companion' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'microphone', label: 'Microphone' }
] as const

export default function SettingsPage(): JSX.Element {
  const { profile, saving, patch, patchProfile } = useSettingsPatch()
  const [tab, setTab] = useState<SettingsTab>('companion')

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Loading…
      </div>
    )
  }

  const s = profile.settings

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8 animate-fade-in">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
              Personalise your AI conversation partner and speaking experience.
            </p>
          </div>
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-brand-300">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Saving…
            </span>
          )}
        </header>

        <div className="mb-6">
          <Tabs items={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Companion ─────────────────────────────────────────────────── */}
        {tab === 'companion' && (
          <div className="grid grid-cols-1 gap-4">
            <CharacterSection
              profile={profile}
              onPick={(characterId, accent) => void patch({ characterId, accent })}
              onCustomsChange={(customCharacters) => void patchProfile({ customCharacters })}
            />
            <VoiceSection
              accent={s.accent}
              currentVoiceURI={s.voiceURI}
              onPick={(voiceURI) => void patch({ voiceURI })}
            />
            <SpeakingRateSection
              current={s.ttsSpeed}
              onChange={(ttsSpeed) => void patch({ ttsSpeed })}
            />
          </div>
        )}

        {/* ── Conversation ──────────────────────────────────────────────── */}
        {tab === 'conversation' && (
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
            <div className="md:col-span-2">
              <DangerZoneSection />
            </div>
          </div>
        )}

        {/* ── Microphone ────────────────────────────────────────────────── */}
        {tab === 'microphone' && (
          <div className="grid grid-cols-1 gap-4">
            <MicProcessingSection
              noiseSuppression={s.noiseSuppression ?? true}
              echoCancellation={s.echoCancellation ?? true}
              autoGainControl={s.autoGainControl ?? true}
              onChange={(p) => void patch(p)}
            />
            <STTEngineSection
              engine={s.sttEngine}
              currentModel={s.whisperModel}
              onEngineChange={(sttEngine) => void patch({ sttEngine })}
              onModelChange={(whisperModel) => void patch({ whisperModel })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
