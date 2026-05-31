export type OnboardingStep =
  | 'welcome'
  | 'language'
  | 'nativeLanguage'
  | 'modelCheck'
  | 'goals'
  | 'interests'
  | 'placement'
  | 'complete'

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  'welcome',
  'language',
  'nativeLanguage',
  'modelCheck',
  'goals',
  'interests',
  'placement',
  'complete'
] as const
