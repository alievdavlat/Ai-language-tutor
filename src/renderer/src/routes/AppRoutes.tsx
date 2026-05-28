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
import RoleSelectPage from '../features/auth/RoleSelectPage'
import LeaderboardPage from '../features/gamification/LeaderboardPage'
import QuestsPage from '../features/gamification/QuestsPage'
import AchievementsPage from '../features/gamification/AchievementsPage'
import ProfilePage from '../features/profile/ProfilePage'
import NotificationsPage from '../features/notifications/NotificationsPage'
import InboxPage from '../features/inbox/InboxPage'

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
      <Route
        path="/teacher"
        element={
          <AppShell>
            <TeacherDashboardPage />
          </AppShell>
        }
      />
      <Route
        path="/teacher/new"
        element={
          <AppShell>
            <CourseAuthoringPage />
          </AppShell>
        }
      />
      <Route
        path="/teacher/analytics"
        element={
          <AppShell>
            <TeacherAnalyticsPage />
          </AppShell>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <AppShell>
            <TeacherStudentsPage />
          </AppShell>
        }
      />
      <Route
        path="/teacher/monetization"
        element={
          <AppShell>
            <TeacherMonetizationPage />
          </AppShell>
        }
      />
      <Route
        path="/teacher/live"
        element={
          <AppShell>
            <TeacherLiveHostPage />
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
