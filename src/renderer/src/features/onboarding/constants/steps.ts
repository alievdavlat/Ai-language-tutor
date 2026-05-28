export type OnboardingStep =
  | 'welcome'
  | 'language'
  | 'modelCheck'
  | 'goals'
  | 'interests'
  | 'placement'
  | 'complete'

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  'welcome',
  'language',
  'modelCheck',
  'goals',
  'interests',
  'placement',
  'complete'
] as const
