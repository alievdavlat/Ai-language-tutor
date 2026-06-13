import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  CEFRLevel,
  Interest,
  LearningGoal,
  PlacementResult,
  TargetLanguage,
  UserProfile
} from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { homeForRole } from '@shared/constants'
import { ProgressBar } from '../../components/ui'
import { useOnboardingFlow } from './hooks/useOnboardingFlow'
import { buildEmptyProfile } from './constants/defaultProfile'
import { useUILanguage, type UILanguage } from '../../i18n'
import WelcomeStep from './sections/WelcomeStep'
import LanguageStep from './sections/LanguageStep'
import NativeLanguageStep from './sections/NativeLanguageStep'
import GoalsStep from './sections/GoalsStep'
import InterestsStep from './sections/InterestsStep'
import CompleteStep from './sections/CompleteStep'
import AdaptiveQuiz from '../leveltest/AdaptiveQuiz'
import type { LevelEstimate } from '../leveltest/engine'

export default function OnboardingPage(): JSX.Element {
  const navigate = useNavigate()
  const { rec, setProfile, profile } = useAppStore()
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)
  const role = useAppStore((s) => s.role)
  const flow = useOnboardingFlow('welcome')
  const [uiLang, setUILang] = useUILanguage()

  // Seed from existing profile so a returning user (e.g. coming back via
  // DangerZone reset → re-onboarding) doesn't have to re-pick everything.
  const [name, setName] = useState(profile?.name ?? '')
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(profile?.targetLanguage ?? 'en')
  // Native language can be ANY supported language (the app is global). The UI
  // text follows it only where a string table exists (en/uz/ru), else English.
  const [nativeLanguage, setNativeLanguage] = useState<string>(profile?.nativeLanguage ?? uiLang)
  const toUILang = (c: string): UILanguage => (c === 'uz' || c === 'ru' || c === 'en' ? c : 'en')
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null)

  // The adaptive engine produces the level client-side (no LLM / no local model).
  const onPlacementComplete = (est: LevelEstimate): void => {
    setPlacementResult({
      level: est.level,
      score: est.correct,
      weakAreas: est.weakAreas,
      detail: est.blurb
    })
    flow.goTo('complete')
  }

  const saveAndEnter = async (finalLevel: CEFRLevel): Promise<void> => {
    const base = buildEmptyProfile()
    const profile: UserProfile = {
      ...base,
      name: name.trim() || undefined,
      targetLanguage,
      nativeLanguage,
      goals,
      interests,
      level: finalLevel,
      weakAreas: placementResult?.weakAreas ?? [],
      settings: {
        ...base.settings,
        performanceMode: rec?.mode ?? 'fast',
        characterId: 'emma'
      }
    }
    await window.api.profile.save(profile)
    setProfile(profile)
    setUILang(toUILang(nativeLanguage))
    setOnboardingComplete(true)
    navigate(homeForRole(role), { replace: true })
  }

  return (
    <div className="min-h-full p-8 flex flex-col">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <ProgressBar value={flow.progressPct} />
        </div>

        {flow.step === 'welcome' && (
          <WelcomeStep name={name} onNameChange={setName} onNext={flow.next} />
        )}
        {flow.step === 'language' && (
          <LanguageStep
            value={targetLanguage}
            onChange={setTargetLanguage}
            onNext={flow.next}
            onBack={flow.back}
          />
        )}
        {flow.step === 'nativeLanguage' && (
          <NativeLanguageStep
            value={nativeLanguage}
            onChange={(l) => { setNativeLanguage(l); setUILang(toUILang(l)) }}
            onNext={flow.next}
            onBack={flow.back}
          />
        )}
        {flow.step === 'goals' && (
          <GoalsStep
            goals={goals}
            onChange={setGoals}
            onNext={flow.next}
            onBack={flow.back}
          />
        )}
        {flow.step === 'interests' && (
          <InterestsStep
            interests={interests}
            onChange={setInterests}
            onNext={flow.next}
            onBack={flow.back}
          />
        )}
        {flow.step === 'placement' && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold">Let's find your level</h2>
              <p className="text-slate-400 text-sm mt-1">
                A few adaptive questions — they get easier or harder as you go.
              </p>
            </div>
            <AdaptiveQuiz onComplete={onPlacementComplete} onExit={flow.back} />
          </div>
        )}
        {flow.step === 'complete' && placementResult && (
          <CompleteStep
            result={placementResult}
            onConfirm={(lvl) => void saveAndEnter(lvl)}
          />
        )}
      </div>
    </div>
  )
}
