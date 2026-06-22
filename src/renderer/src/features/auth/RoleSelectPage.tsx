import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { persistRole } from '../../services/auth'
import { homeForRole } from '@shared/constants'
import { IconBook, IconUsers } from '../../components/icons'
import { useT } from '../../i18n'

export default function RoleSelectPage(): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  const setRole = useAppStore((s) => s.setRole)
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  const authenticated = useAppStore((s) => s.authenticated)
  // Block unauthenticated direct access to /role (URL deep-link).
  if (!authenticated) return <Navigate to="/signin" replace />

  const pick = (role: 'student' | 'teacher'): void => {
    setRole(role)
    // Mirror the chosen role onto the backend user so it survives reloads and
    // returning sign-ins land in the right UI.
    void persistRole(role)
    // After role is selected, run the rest of onboarding (language, goals, placement).
    // If onboarding is already complete (e.g. user navigated back to /role manually),
    // jump straight to the right home.
    if (!onboardingComplete) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate(homeForRole(role), { replace: true })
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
      <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold mb-2">{t('auth.role.eyebrow')}</p>
      <h1 className="text-3xl font-black tracking-tight">{t('auth.role.title')}</h1>
      <p className="text-slate-400 mt-2">{t('auth.role.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full">
        <button
          onClick={() => pick('student')}
          className="rounded-card border border-white/10 bg-white/[0.03] p-6 text-left hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-brand-400/40 transition"
        >
          <span className="w-12 h-12 rounded-2xl bg-grad-brand flex items-center justify-center shadow-glow-sm"><IconBook className="w-6 h-6 text-white" /></span>
          <p className="text-lg font-bold text-white mt-4">{t('auth.role.learner')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('auth.role.learnerDesc')}</p>
        </button>

        <button
          onClick={() => pick('teacher')}
          className="rounded-card border border-white/10 bg-white/[0.03] p-6 text-left hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-emerald-400/40 transition"
        >
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-glow-sm"><IconUsers className="w-6 h-6 text-white" /></span>
          <p className="text-lg font-bold text-white mt-4">{t('auth.role.teacher')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('auth.role.teacherDesc')}</p>
        </button>
      </div>

      <p className="text-[10px] text-slate-500 mt-6">{t('auth.role.changeNote')}</p>
    </div>
  )
}
