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

export function useOnboardingFlow(
  initial: OnboardingStep = 'welcome',
  steps: readonly OnboardingStep[] = ONBOARDING_STEPS
): OnboardingFlow {
  const [step, setStep] = useState<OnboardingStep>(initial)
  const index = steps.indexOf(step)
  const total = steps.length

  const next = useCallback(() => {
    const current = steps.indexOf(step)
    if (current < total - 1) setStep(steps[current + 1])
  }, [step, total, steps])

  const back = useCallback(() => {
    const current = steps.indexOf(step)
    if (current > 0) setStep(steps[current - 1])
  }, [step, steps])

  const goTo = useCallback((target: OnboardingStep) => setStep(target), [])

  const progressPct = useMemo(() => Math.round(((index + 1) / total) * 100), [index, total])

  return { step, index, total, progressPct, next, back, goTo }
}
