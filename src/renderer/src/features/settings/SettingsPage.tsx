import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { Tabs, type TabItem } from '../../components/ui'
import { useSettingsPatch } from './hooks/useSettingsPatch'
import MicModeSection from './sections/MicModeSection'
import CompanionWorkshop from './sections/CompanionWorkshop'
import MicProcessingSection from './sections/MicProcessingSection'
import LanguageSection from './sections/LanguageSection'
import AISection from './sections/AISection'
import PrivacySection from './sections/PrivacySection'
import AboutSection from './sections/AboutSection'
import ProductivitySection from './sections/ProductivitySection'
import DesktopSection from './sections/DesktopSection'

type SettingsTab = 'ai' | 'language' | 'companion' | 'microphone' | 'productivity' | 'desktop' | 'privacy' | 'about'

const TABS: readonly TabItem<SettingsTab>[] = [
  { id: 'ai', label: 'AI' },
  { id: 'language', label: 'Language' },
  { id: 'companion', label: 'Companion' },
  { id: 'microphone', label: 'Microphone' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'about', label: 'About' }
] as const

const TAB_IDS: readonly SettingsTab[] = ['ai', 'language', 'companion', 'microphone', 'productivity', 'privacy', 'about']

export default function SettingsPage(): JSX.Element {
  const { profile, saving, patch, patchProfile } = useSettingsPatch()
  // Honor a deep-link like /settings?tab=productivity (e.g. the old /productivity
  // route now redirects here). Falls back to AI for unknown/missing values.
  const [params] = useSearchParams()
  const initialTab = TAB_IDS.find((t) => t === params.get('tab')) ?? 'ai'
  const [tab, setTab] = useState<SettingsTab>(initialTab)

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

        {/* ── AI providers ──────────────────────────────────────────────── */}
        {tab === 'ai' && (
          <AISection
            ai={s.ai}
            onChange={(ai) => void patch({ ai })}
          />
        )}

        {/* ── Language ──────────────────────────────────────────────────── */}
        {tab === 'language' && (
          <div className="grid grid-cols-1 gap-4">
            <LanguageSection
              current={profile.targetLanguage}
              onChange={(targetLanguage) => void patchProfile({ targetLanguage })}
            />
          </div>
        )}

        {/* ── Companion ─────────────────────────────────────────────────── */}
        {tab === 'companion' && (
          <CompanionWorkshop
            profile={profile}
            onPick={(characterId, accent) => void patch({ characterId, accent })}
            onCustomsChange={(customCharacters) => void patchProfile({ customCharacters })}
            onFavoritesChange={(favoriteCharacterIds) => void patchProfile({ favoriteCharacterIds })}
            onMemoryChange={(companionMemory) => void patchProfile({ companionMemory })}
            onPatch={(p) => void patch(p)}
          />
        )}

        {/* ── Microphone ────────────────────────────────────────────────── */}
        {tab === 'microphone' && (
          <div className="grid grid-cols-1 gap-4">
            <MicModeSection
              current={s.micMode}
              onChange={(micMode) => void patch({ micMode })}
            />
            <MicProcessingSection
              noiseSuppression={s.noiseSuppression ?? true}
              echoCancellation={s.echoCancellation ?? true}
              autoGainControl={s.autoGainControl ?? true}
              onChange={(p) => void patch(p)}
            />
            <p className="text-[11px] text-slate-500 px-1">
              Speech recognition is automatic — it uses your system's built-in recognizer. No setup needed.
            </p>
          </div>
        )}

        {/* ── Privacy ───────────────────────────────────────────────────── */}
        {tab === 'productivity' && <ProductivitySection />}

        {/* ── Desktop integration (#16) ─────────────────────────────────── */}
        {tab === 'desktop' && <DesktopSection />}

        {tab === 'privacy' && (
          <PrivacySection
            contentSafety={s.contentSafety ?? true}
            incognito={s.incognito ?? false}
            onChange={(p) => void patch(p)}
          />
        )}

        {/* ── About / auto-update ───────────────────────────────────────── */}
        {tab === 'about' && (
          <div className="grid grid-cols-1 gap-4">
            <AboutSection />
          </div>
        )}
      </div>
    </div>
  )
}
