// The local-AI (Ollama) "Setting up your AI coach" step was removed — SpeakAI
// uses online AI APIs (configured in Settings → AI), not a local model, so the
// onboarding no longer asks the user to install anything.
export type OnboardingStep =
  | 'welcome'
  | 'language'
  | 'nativeLanguage'
  | 'goals'
  | 'interests'
  | 'placement'
  | 'complete'

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  'welcome',
  'language',
  'nativeLanguage',
  'goals',
  'interests',
  'placement',
  'complete'
] as const
