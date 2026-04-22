import { useCallback, useMemo, useState } from 'react'
import { ONBOARDING_STEPS, type OnboardingStep } from '../constants/steps'

interface OnboardingFlow {
  step: OnboardingStep
  index: number
  total: number
  progressPct: number
  next: () => void
  back: () => void
  goTo: (step: OnboardingStep) => void
}

export function useOnboardingFlow(initial: OnboardingStep = 'welcome'): OnboardingFlow {
  const [step, setStep] = useState<OnboardingStep>(initial)
  const index = ONBOARDING_STEPS.indexOf(step)
  const total = ONBOARDING_STEPS.length

  const next = useCallback(() => {
    const current = ONBOARDING_STEPS.indexOf(step)
    if (current < total - 1) setStep(ONBOARDING_STEPS[current + 1])
  }, [step, total])

  const back = useCallback(() => {
    const current = ONBOARDING_STEPS.indexOf(step)
    if (current > 0) setStep(ONBOARDING_STEPS[current - 1])
  }, [step])

  const goTo = useCallback((target: OnboardingStep) => setStep(target), [])

  const progressPct = useMemo(() => Math.round(((index + 1) / total) * 100), [index, total])

  return { step, index, total, progressPct, next, back, goTo }
}
