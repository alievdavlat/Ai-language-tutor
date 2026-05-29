import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { UserRole } from '../store/useAppStore'
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
import ProgressPage from '../features/progress/ProgressPage'
import CoursesPage from '../features/courses/CoursesPage'
import ClassroomPage from '../features/courses/ClassroomPage'
import CourseDetailPage from '../features/courses/CourseDetailPage'
import BookReaderPage from '../features/courses/BookReaderPage'
import LibraryPage from '../features/library/LibraryPage'
import TeacherChannelPage from '../features/channel/TeacherChannelPage'
import CommunityPage from '../features/community/CommunityPage'
import LivePage from '../features/live/LivePage'
import LiveRoomPage from '../features/live/LiveRoomPage'
import MeetPage from '../features/meet/MeetPage'
import ExercisePlayer from '../features/exercise/ExercisePlayer'
import LevelTestPage from '../features/leveltest/LevelTestPage'
import ExamsHubPage from '../features/exams/ExamsHubPage'
import ExamMock from '../features/exams/ExamMock'
import ExamPracticeHub from '../features/exams/ExamPracticeHub'
import CefrHubPage from '../features/exams/CefrHubPage'
import AccountPage from '../features/account/AccountPage'
import TeacherDashboardPage from '../features/teacher/TeacherDashboardPage'
import CourseAuthoringPage from '../features/teacher/CourseAuthoringPage'
import TeacherAnalyticsPage from '../features/teacher/TeacherAnalyticsPage'
import TeacherStudentsPage from '../features/teacher/TeacherStudentsPage'
import TeacherMonetizationPage from '../features/teacher/TeacherMonetizationPage'
import TeacherLiveHostPage from '../features/teacher/TeacherLiveHostPage'
import AITutorPage from '../features/aitutor/AITutorPage'
import TutorsPage from '../features/tutors/TutorsPage'
import PathsPage from '../features/paths/PathsPage'
import LiveQuizPage from '../features/quizlive/LiveQuizPage'
import StoriesPage from '../features/stories/StoriesPage'
import ShadowingPage from '../features/shadowing/ShadowingPage'
import WatchPage from '../features/watch/WatchPage'
import FeedbackExchangePage from '../features/feedback/FeedbackExchangePage'
import FlashcardsPage from '../features/flashcards/FlashcardsPage'
import SignInPage from '../features/auth/SignInPage'
import GrammarPage from '../features/grammar/GrammarPage'
import RoleSelectPage from '../features/auth/RoleSelectPage'
import LeaderboardPage from '../features/gamification/LeaderboardPage'
import AdminPage from '../features/admin/AdminPage'
import ExplorePage from '../features/explore/ExplorePage'
import IeltsSpeakingSimPage from '../features/ieltssim/IeltsSpeakingSimPage'
import CompanionGalleryPage from '../features/companions/CompanionGalleryPage'
import AvatarStudioPage from '../features/avatar/AvatarStudioPage'
import QuestsPage from '../features/gamification/QuestsPage'
import AchievementsPage from '../features/gamification/AchievementsPage'
import ProfilePage from '../features/profile/ProfilePage'
import NotificationsPage from '../features/notifications/NotificationsPage'
import InboxPage from '../features/inbox/InboxPage'

/**
 * After bootstrap completes, send the user through the first-launch funnel:
 *   /  →  /signin  →  /role  →  /onboarding  →  /home (or /teacher)
 *
 * Only runs while the user is on "/" — if it fired from any other route it
 * would kick the user back every time an unrelated store update happened
 * (ollama polling, sidecar state, language switch, etc).
 */
/**
 * Wraps a route so only users with the matching role can render it. Students
 * who deep-link to a teacher URL (or vice-versa) are bounced to their own home.
 */
function RequireRole({ role: required, children }: { role: UserRole; children: ReactNode }): JSX.Element {
  const role = useAppStore((s) => s.role)
  const roleSelected = useAppStore((s) => s.roleSelected)
  if (!roleSelected) return <Navigate to="/role" replace />
  if (role !== required) return <Navigate to={role === 'teacher' ? '/teacher' : '/home'} replace />
  return <>{children}</>
}

function usePostBootRedirect(): void {
  const booted = useAppStore((s) => s.booted)
  const authenticated = useAppStore((s) => s.authenticated)
  const role = useAppStore((s) => s.role)
  const roleSelected = useAppStore((s) => s.roleSelected)
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!booted) return
    if (location.pathname !== '/') return

    if (!authenticated) {
      navigate('/signin', { replace: true })
      return
    }
    if (!roleSelected) {
      navigate('/role', { replace: true })
      return
    }
    if (!onboardingComplete) {
      navigate('/onboarding', { replace: true })
      return
    }
    navigate(role === 'teacher' ? '/teacher' : '/home', { replace: true })
  }, [booted, authenticated, roleSelected, onboardingComplete, role, location.pathname, navigate])
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
        path="/learn/lesson"
        element={
          <AppShell>
            <ClassroomPage />
          </AppShell>
        }
      />
      <Route
        path="/course"
        element={
          <AppShell>
            <CourseDetailPage />
          </AppShell>
        }
      />
      <Route
        path="/learn/book"
        element={
          <AppShell>
            <BookReaderPage />
          </AppShell>
        }
      />
      <Route path="/level-test" element={<LevelTestPage />} />
      <Route path="/exams/ielts" element={<AppShell><ExamPracticeHub examId="ielts" /></AppShell>} />
      <Route path="/exams/toefl" element={<AppShell><ExamPracticeHub examId="toefl" /></AppShell>} />
      <Route path="/exams/ielts/mock" element={<ExamMock kind="ielts" />} />
      <Route path="/exams/ielts/speaking" element={<IeltsSpeakingSimPage />} />
      <Route path="/exams/toefl/mock" element={<ExamMock kind="toefl" />} />
      <Route path="/exams/cefr" element={<AppShell><CefrHubPage /></AppShell>} />
      <Route
        path="/exams"
        element={
          <AppShell>
            <ExamsHubPage />
          </AppShell>
        }
      />
      <Route
        path="/courses"
        element={
          <AppShell>
            <CoursesPage />
          </AppShell>
        }
      />
      <Route
        path="/library"
        element={
          <AppShell>
            <LibraryPage />
          </AppShell>
        }
      />
      <Route
        path="/channel"
        element={
          <AppShell>
            <TeacherChannelPage />
          </AppShell>
        }
      />
      <Route
        path="/community"
        element={
          <AppShell>
            <CommunityPage />
          </AppShell>
        }
      />
      <Route
        path="/meet"
        element={
          <AppShell>
            <MeetPage />
          </AppShell>
        }
      />
      <Route
        path="/live"
        element={
          <AppShell>
            <LivePage />
          </AppShell>
        }
      />
      <Route path="/live/room" element={<LiveRoomPage />} />
      <Route path="/live/group" element={<LiveRoomPage group />} />
      <Route
        path="/account"
        element={
          <AppShell>
            <AccountPage />
          </AppShell>
        }
      />
      <Route path="/role" element={<RoleSelectPage />} />
      <Route path="/signin" element={<SignInPage mode="signin" />} />
      <Route path="/signup" element={<SignInPage mode="signup" />} />
      <Route path="/ai-tutor" element={<AITutorPage />} />
      <Route path="/companions" element={<CompanionGalleryPage />} />
      <Route path="/avatar-studio" element={<AppShell><AvatarStudioPage /></AppShell>} />
      <Route path="/quiz/live" element={<LiveQuizPage />} />
      <Route
        path="/paths"
        element={
          <AppShell>
            <PathsPage />
          </AppShell>
        }
      />
      <Route
        path="/stories"
        element={
          <AppShell>
            <StoriesPage />
          </AppShell>
        }
      />
      <Route
        path="/shadowing"
        element={
          <AppShell>
            <ShadowingPage />
          </AppShell>
        }
      />
      <Route
        path="/watch"
        element={
          <AppShell>
            <WatchPage />
          </AppShell>
        }
      />
      <Route
        path="/feedback"
        element={
          <AppShell>
            <FeedbackExchangePage />
          </AppShell>
        }
      />
      <Route
        path="/flashcards"
        element={
          <AppShell>
            <FlashcardsPage />
          </AppShell>
        }
      />
      <Route
        path="/tutors"
        element={
          <AppShell>
            <TutorsPage />
          </AppShell>
        }
      />
      <Route
        path="/teacher"
        element={
          <RequireRole role="teacher">
            <AppShell><TeacherDashboardPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/new"
        element={
          <RequireRole role="teacher">
            <AppShell><CourseAuthoringPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/analytics"
        element={
          <RequireRole role="teacher">
            <AppShell><TeacherAnalyticsPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <RequireRole role="teacher">
            <AppShell><TeacherStudentsPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/monetization"
        element={
          <RequireRole role="teacher">
            <AppShell><TeacherMonetizationPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/live"
        element={
          <RequireRole role="teacher">
            <AppShell><TeacherLiveHostPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AppShell><AdminPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/explore"
        element={
          <AppShell><ExplorePage /></AppShell>
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
        path="/grammar"
        element={
          <AppShell>
            <GrammarPage />
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
        path="/notifications"
        element={
          <AppShell>
            <NotificationsPage />
          </AppShell>
        }
      />
      <Route
        path="/inbox"
        element={
          <AppShell>
            <InboxPage />
          </AppShell>
        }
      />
      <Route
        path="/profile"
        element={
          <AppShell>
            <ProfilePage />
          </AppShell>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <AppShell>
            <LeaderboardPage />
          </AppShell>
        }
      />
      <Route
        path="/quests"
        element={
          <AppShell>
            <QuestsPage />
          </AppShell>
        }
      />
      <Route
        path="/achievements"
        element={
          <AppShell>
            <AchievementsPage />
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
