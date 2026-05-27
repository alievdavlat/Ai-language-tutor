import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useBootstrap } from '../hooks/useBootstrap'
import { useAdminShortcut } from '../hooks/useAdminShortcut'
import AppShell from '../components/layout/AppShell'
import BootPage from '../features/boot/BootPage'
import OnboardingPage from '../features/onboarding/OnboardingPage'
import HomePage from '../features/home/HomePage'
import SpeakingPage from '../features/speaking/SpeakingPage'
import CallPage from '../features/speaking/CallPage'
import SettingsPage from '../features/settings/SettingsPage'
import VocabularyPage from '../features/vocabulary/VocabularyPage'
import LessonsPage from '../features/lessons/LessonsPage'
import ProgressPage from '../features/progress/ProgressPage'
import PronunciationPage from '../features/pronunciation/PronunciationPage'
import ScenariosPage from '../features/scenarios/ScenariosPage'
import CoursebooksPage from '../features/coursebooks/CoursebooksPage'
import ExercisePlayer from '../features/exercise/ExercisePlayer'

/**
 * After bootstrap completes, send the user from the Boot splash into the app.
 * This MUST only run while the user is on "/" — if it fires from any other
 * route it kicks the user back to /home every time an unrelated store update
 * happens (ollama polling, sidecar state change, etc).
 */
function usePostBootRedirect(): void {
  const booted = useAppStore((s) => s.booted)
  const profile = useAppStore((s) => s.profile)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!booted) return
    if (location.pathname !== '/') return

    if (!profile || profile.goals.length === 0) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate('/home', { replace: true })
    }
  }, [booted, profile, location.pathname, navigate])
}

export default function AppRoutes(): JSX.Element {
  useBootstrap()
  usePostBootRedirect()
  useAdminShortcut()

  return (
    <Routes>
      <Route path="/" element={<BootPage />} />
      <Route path="/onboarding/*" element={<OnboardingPage />} />
      <Route
        path="/home"
        element={
          <AppShell>
            <HomePage />
          </AppShell>
        }
      />
      <Route
        path="/speaking"
        element={
          <AppShell>
            <SpeakingPage />
          </AppShell>
        }
      />
      <Route path="/speaking/call" element={<CallPage />} />
      <Route path="/learn/exercise" element={<ExercisePlayer />} />
      <Route
        path="/lessons"
        element={
          <AppShell>
            <LessonsPage />
          </AppShell>
        }
      />
      <Route
        path="/coursebooks"
        element={
          <AppShell>
            <CoursebooksPage />
          </AppShell>
        }
      />
      <Route
        path="/pronunciation"
        element={
          <AppShell>
            <PronunciationPage />
          </AppShell>
        }
      />
      <Route
        path="/scenarios"
        element={
          <AppShell>
            <ScenariosPage />
          </AppShell>
        }
      />
      <Route
        path="/vocabulary"
        element={
          <AppShell>
            <VocabularyPage />
          </AppShell>
        }
      />
      <Route
        path="/progress"
        element={
          <AppShell>
            <ProgressPage />
          </AppShell>
        }
      />
      <Route
        path="/settings"
        element={
          <AppShell>
            <SettingsPage />
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
