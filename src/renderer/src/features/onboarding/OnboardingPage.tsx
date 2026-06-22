import { useMemo, useState } from 'react'
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
import { homeForRole, canAuthorContent } from '@shared/constants'
import { ONBOARDING_STEPS } from './constants/steps'
import { ProgressBar } from '../../components/ui'
import { useOnboardingFlow } from './hooks/useOnboardingFlow'
import { buildEmptyProfile } from './constants/defaultProfile'
import { useUILanguage, useT, type UILanguage } from '../../i18n'
import WelcomeStep from './sections/WelcomeStep'
import LanguageStep from './sections/LanguageStep'
import NativeLanguageStep from './sections/NativeLanguageStep'
import GoalsStep from './sections/GoalsStep'
import InterestsStep from './sections/InterestsStep'
import DailyGoalStep from './sections/DailyGoalStep'
import CompleteStep from './sections/CompleteStep'
import { useProgressStore } from '../../services/progress/store'
import { DEFAULT_GOAL_ID } from '../../services/progress/catalog'
import type { DailyGoalId } from '../../services/progress/types'
import AdaptiveQuiz from '../leveltest/AdaptiveQuiz'
import type { LevelEstimate } from '../leveltest/engine'

export default function OnboardingPage(): JSX.Element {
  const navigate = useNavigate()
  const { rec, setProfile, profile } = useAppStore()
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)
  const role = useAppStore((s) => s.role)
  // Teachers/admins author content — the learner CEFR placement test makes no
  // sense for them, so drop it from their onboarding flow.
  const skipsPlacement = canAuthorContent(role)
  const steps = useMemo(
    () =>
      skipsPlacement
        ? ONBOARDING_STEPS.filter((s) => s !== 'placement' && s !== 'dailyGoal')
        : ONBOARDING_STEPS,
    [skipsPlacement]
  )
  const flow = useOnboardingFlow('welcome', steps)
  const [uiLang, setUILang] = useUILanguage()
  const t = useT()

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
  const [dailyGoal, setDailyGoal] = useState<DailyGoalId>(DEFAULT_GOAL_ID)
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

  const saveAndEnter = async (finalLevel?: CEFRLevel): Promise<void> => {
    const base = buildEmptyProfile()
    const profile: UserProfile = {
      ...base,
      name: name.trim() || undefined,
      targetLanguage,
      nativeLanguage,
      goals,
      interests,
      level: finalLevel ?? base.level,
      weakAreas: placementResult?.weakAreas ?? [],
      settings: {
        ...base.settings,
        performanceMode: rec?.mode ?? 'fast',
        characterId: 'emma'
      }
    }
    await window.api.profile.save(profile)
    setProfile(profile)
    // Learners pick a daily goal; persisting it also honestly grants the
    // "Committed" (goal_set) achievement instead of leaving it to be discovered.
    if (!skipsPlacement) useProgressStore.getState().setDailyGoal(dailyGoal)
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
        {flow.step === 'dailyGoal' && (
          <DailyGoalStep
            value={dailyGoal}
            onChange={setDailyGoal}
            onNext={flow.next}
            onBack={flow.back}
          />
        )}
        {flow.step === 'placement' && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold">{t('ob.placement.title')}</h2>
              <p className="text-slate-400 text-sm mt-1">
                {t('ob.placement.subtitle')}
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
        {flow.step === 'complete' && !placementResult && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold">{t('ob.teacher.title')}</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
              {t('ob.teacher.subtitle')}
            </p>
            <button
              className="mt-6 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium"
              onClick={() => void saveAndEnter()}
            >
              {t('ob.teacher.toDashboard')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
