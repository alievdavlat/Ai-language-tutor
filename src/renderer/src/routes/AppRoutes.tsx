import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { UserRole } from '../store/useAppStore'
import { useAppStore } from '../store/useAppStore'
import { useBootstrap } from '../hooks/useBootstrap'
import { useAdminShortcut } from '../hooks/useAdminShortcut'
import { useI18n, type UILanguage } from '../i18n'
import { backend } from '../services/backend'
import type { PlatformUser } from '@shared/types'
import AppShell from '../components/layout/AppShell'
import BootPage from '../features/boot/BootPage'
import OnboardingPage from '../features/onboarding/OnboardingPage'
import HomePage from '../features/home/HomePage'
import SpeakingPage from '../features/speaking/SpeakingPage'
import CallPage from '../features/speaking/CallPage'
import SettingsPage from '../features/settings/SettingsPage'
import VocabularyPage from '../features/vocabulary/VocabularyPage'
import VocabReviewPage from '../features/vocabulary/VocabReviewPage'
import ProgressPage from '../features/progress/ProgressPage'
import CoursesPage from '../features/courses/CoursesPage'
import ClassroomPage from '../features/courses/ClassroomPage'
import CourseDetailPage from '../features/courses/CourseDetailPage'
import BookReaderPage from '../features/courses/BookReaderPage'
import LibraryPage from '../features/library/LibraryPage'
import LibraryBookPage from '../features/library/LibraryBookPage'
import TeacherChannelPage from '../features/channel/TeacherChannelPage'
import SocialPage from '../features/social/SocialPage'
import LivePage from '../features/live/LivePage'
import LiveRoomPage from '../features/live/LiveRoomPage'
import MeetPage from '../features/meet/MeetPage'
import ExercisePlayer from '../features/exercise/ExercisePlayer'
import LevelTestPage from '../features/leveltest/LevelTestPage'
import ExamsHubPage from '../features/exams/ExamsHubPage'
import ExamEngine from '../features/exams/ExamEngine'
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
import StoryReaderPage from '../features/stories/StoryReaderPage'
import ShadowingPage from '../features/shadowing/ShadowingPage'
import WatchPage from '../features/watch/WatchPage'
import DictionaryPage from '../features/dictionary/DictionaryPage'
import ClipsPage from '../features/clips/ClipsPage'
import ClipSetupPage from '../features/clips/ClipSetupPage'
import ClipPlayPage from '../features/clips/ClipPlayPage'
import WritingCoachPage from '../features/writing/WritingCoachPage'
import FeedbackExchangePage from '../features/feedback/FeedbackExchangePage'
import FlashcardsPage from '../features/flashcards/FlashcardsPage'
import SignInPage from '../features/auth/SignInPage'
import GrammarPage from '../features/grammar/GrammarPage'
import GrammarGuidePage from '../features/grammar/GrammarGuidePage'
import GrammarChallengePage from '../features/grammar/GrammarChallengePage'
import RoleSelectPage from '../features/auth/RoleSelectPage'
import LeaderboardPage from '../features/gamification/LeaderboardPage'
import AdminConsole from '../features/admin/AdminConsole'
import IeltsSpeakingSimPage from '../features/ieltssim/IeltsSpeakingSimPage'
import CompanionGalleryPage from '../features/companions/CompanionGalleryPage'
import AvatarStudioPage from '../features/avatar/AvatarStudioPage'
import QuestsPage from '../features/gamification/QuestsPage'
import AchievementsPage from '../features/gamification/AchievementsPage'
import ProfilePage from '../features/profile/ProfilePage'
import NotificationsPage from '../features/notifications/NotificationsPage'
import InboxPage from '../features/inbox/InboxPage'
import RetentionPage from '../features/retention/RetentionPage'
import BuddyPage from '../features/buddy/BuddyPage'
import CreatorStudioPage from '../features/creator/CreatorStudioPage'
// [8/8] Teacher / monetization / admin / productivity slice
import LessonBuilderPage from '../features/teacher/lesson/LessonBuilderPage'
import LessonPlayerPage from '../features/teacher/lesson/LessonPlayerPage'
import ClipsComposerPage from '../features/teacher/clips/ClipsComposerPage'
import YouTubeConnectPage from '../features/teacher/youtube/YouTubeConnectPage'
import DownloadsPage from '../features/downloads/DownloadsPage'
import ProductivityPage from '../features/productivity/ProductivityPage'
import WidgetPage from '../features/widget/WidgetPage'
import QuickLookup from '../components/QuickLookup'
import UpdateToast from '../components/UpdateToast'

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
  // Admin/owner is a superset — can reach teacher authoring routes too (so the
  // admin CMS can create courses/lessons/clips/announcements). #A36/#A37.
  if (role !== required && role !== 'admin') return <Navigate to={role === 'teacher' ? '/teacher' : '/home'} replace />
  return <>{children}</>
}

/** Runs an authored/custom exam by id (from the exams store). */
function RunExam(): JSX.Element {
  const { examId } = useParams()
  return <ExamEngine bankId={examId ?? ''} />
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

/**
 * Mirror the saved native language into the i18n UI-language store once, when
 * the profile first loads. The native language picked at onboarding is the
 * source of truth for the whole-app UI text; later manual switches (Settings)
 * write back to the profile, so this one-shot sync never fights them.
 */
function useSyncUILanguage(): void {
  const nativeLanguage = useAppStore((s) => s.profile?.nativeLanguage)
  const setLang = useI18n((s) => s.setLang)
  const synced = useRef(false)
  useEffect(() => {
    if (synced.current || !nativeLanguage) return
    if (nativeLanguage === 'en' || nativeLanguage === 'uz' || nativeLanguage === 'ru') {
      setLang(nativeLanguage as UILanguage)
    }
    synced.current = true
  }, [nativeLanguage, setLang])
}

/**
 * Mirror the local profile into the backend `users` row so My Channel / Profile
 * / social show the REAL signed-in user (name, role, level, languages) instead
 * of a stale/empty backend row. Auth signUp only sets name/email/role; the
 * onboarding profile (level, languages, role switch) never reached the backend
 * — that's why a teacher's channel showed "Learner · A2". Fires whenever the
 * relevant profile fields change.
 */
function useSyncUserToBackend(): void {
  const profile = useAppStore((s) => s.profile)
  const role = useAppStore((s) => s.role)
  const last = useRef('')
  useEffect(() => {
    const me = backend.currentUserId()
    if (!me || !profile) return
    const patch: Partial<PlatformUser> = {
      name: profile.name ?? undefined,
      level: profile.level,
      nativeLanguage: profile.nativeLanguage,
      targetLanguage: profile.targetLanguage
    }
    if (role === 'teacher' || role === 'student') patch.role = role
    const fp = `${me}|${JSON.stringify(patch)}`
    if (fp === last.current) return
    last.current = fp
    void backend.updateUser(me, patch).catch(() => undefined)
  }, [profile, role])
}

export default function AppRoutes(): JSX.Element {
  const navigate = useNavigate()
  const setRole = useAppStore((s) => s.setRole)
  useBootstrap()
  usePostBootRedirect()
  useSyncUILanguage()
  useSyncUserToBackend()
  // Ctrl+Shift+A → elevate to Owner/Admin and open the admin panel.
  useAdminShortcut(() => { setRole('admin'); navigate('/admin') })

  return (
    <>
    <QuickLookup />
    <UpdateToast />
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
        path="/course/:courseId"
        element={
          <AppShell>
            <CourseDetailPage />
          </AppShell>
        }
      />
      <Route
        path="/learn/:courseId/:lessonId"
        element={
          <AppShell>
            <ClassroomPage />
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
      <Route
        path="/learn/book/:courseId/:lessonId"
        element={
          <AppShell>
            <BookReaderPage />
          </AppShell>
        }
      />
      <Route
        path="/dictionary"
        element={
          <AppShell>
            <DictionaryPage />
          </AppShell>
        }
      />
      <Route path="/level-test" element={<LevelTestPage />} />
      <Route path="/exams/ielts" element={<AppShell><ExamPracticeHub examId="ielts" /></AppShell>} />
      <Route path="/exams/toefl" element={<AppShell><ExamPracticeHub examId="toefl" /></AppShell>} />
      <Route path="/exams/ielts/mock" element={<ExamEngine bankId="ielts" />} />
      <Route path="/exams/ielts/speaking" element={<IeltsSpeakingSimPage />} />
      <Route path="/exams/toefl/mock" element={<ExamEngine bankId="toefl" />} />
      <Route path="/exams/cefr/mock" element={<ExamEngine bankId="cefr" />} />
      {/* Generic runner for authored / custom exams (#A30). */}
      <Route path="/exams/run/:examId" element={<RunExam />} />
      <Route path="/exams/sat/mock" element={<ExamEngine bankId="sat" />} />
      <Route path="/exams/gmat/mock" element={<ExamEngine bankId="gmat" />} />
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
        path="/library/book/:id"
        element={
          <AppShell>
            <LibraryBookPage />
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
            <SocialPage />
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
        path="/stories/:storyId"
        element={
          <AppShell>
            <StoryReaderPage />
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
        path="/watch/:videoId"
        element={
          <AppShell>
            <WatchPage />
          </AppShell>
        }
      />
      <Route
        path="/clips"
        element={
          <AppShell>
            <ClipsPage />
          </AppShell>
        }
      />
      <Route
        path="/clips/setup"
        element={
          <AppShell>
            <ClipSetupPage />
          </AppShell>
        }
      />
      <Route path="/clips/play" element={<ClipPlayPage />} />
      <Route
        path="/writing"
        element={
          <AppShell>
            <WritingCoachPage />
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
      {/* /teacher/new is now the TED-Ed interactive lesson builder (#3). */}
      <Route
        path="/teacher/new"
        element={
          <RequireRole role="teacher">
            <AppShell><LessonBuilderPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/lesson"
        element={
          <RequireRole role="teacher">
            <AppShell><LessonBuilderPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/course/new"
        element={
          <RequireRole role="teacher">
            <AppShell><CourseAuthoringPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/clips"
        element={
          <RequireRole role="teacher">
            <AppShell><ClipsComposerPage /></AppShell>
          </RequireRole>
        }
      />
      <Route
        path="/teacher/youtube"
        element={
          <RequireRole role="teacher">
            <AppShell><YouTubeConnectPage /></AppShell>
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
      {/* Admin = its OWN console shell (CMS+CRM), NOT the learner AppShell (#A56). */}
      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminConsole />
          </RequireRole>
        }
      />
      {/* Shareable interactive lesson player (#3). */}
      <Route path="/lesson" element={<AppShell><LessonPlayerPage /></AppShell>} />
      {/* Offline downloads + cross-device sync (#35). */}
      <Route path="/downloads" element={<AppShell><DownloadsPage /></AppShell>} />
      {/* Productivity hub: hotkey + widget + extension (#37). */}
      <Route path="/productivity" element={<AppShell><ProductivityPage /></AppShell>} />
      {/* Frameless desktop widget window (#37) — no shell. */}
      <Route path="/widget" element={<WidgetPage />} />
      <Route
        path="/explore"
        element={
          <AppShell><SocialPage initialTab="explore" /></AppShell>
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
      <Route path="/vocabulary/review" element={<VocabReviewPage />} />
      <Route
        path="/grammar"
        element={
          <AppShell>
            <GrammarPage />
          </AppShell>
        }
      />
      <Route path="/grammar/guide/:topic" element={<AppShell><GrammarGuidePage /></AppShell>} />
      <Route path="/grammar/challenge/:topic" element={<AppShell><GrammarChallengePage /></AppShell>} />
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
        path="/retention"
        element={
          <AppShell>
            <RetentionPage />
          </AppShell>
        }
      />
      <Route
        path="/buddy"
        element={
          <AppShell>
            <BuddyPage />
          </AppShell>
        }
      />
      <Route
        path="/studio"
        element={
          <AppShell>
            <CreatorStudioPage />
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
    </>
  )
}
