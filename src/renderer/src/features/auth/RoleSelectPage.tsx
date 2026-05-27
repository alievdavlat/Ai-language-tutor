import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { IconBook, IconUsers } from '../../components/icons'

export default function RoleSelectPage(): JSX.Element {
  const navigate = useNavigate()
  const setRole = useAppStore((s) => s.setRole)

  const pick = (role: 'student' | 'teacher'): void => {
    setRole(role)
    navigate(role === 'teacher' ? '/teacher' : '/home')
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold tracking-tight">How will you use SpeakAI?</h1>
      <p className="text-slate-400 mt-2">You can switch any time from the sidebar.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full">
        <button
          onClick={() => pick('student')}
          className="rounded-card border border-white/10 bg-white/[0.03] p-6 text-left hover:bg-white/[0.06] hover:-translate-y-0.5 transition"
        >
          <span className="w-12 h-12 rounded-2xl bg-grad-brand flex items-center justify-center shadow-glow-sm"><IconBook className="w-6 h-6 text-white" /></span>
          <p className="text-lg font-bold text-white mt-4">I'm a learner</p>
          <p className="text-sm text-slate-400 mt-1">Take courses, practice speaking, sit mock exams and join the community.</p>
        </button>

        <button
          onClick={() => pick('teacher')}
          className="rounded-card border border-white/10 bg-white/[0.03] p-6 text-left hover:bg-white/[0.06] hover:-translate-y-0.5 transition"
        >
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-glow-sm"><IconUsers className="w-6 h-6 text-white" /></span>
          <p className="text-lg font-bold text-white mt-4">I'm a teacher</p>
          <p className="text-sm text-slate-400 mt-1">Open a channel, publish courses, go live and grow your audience.</p>
        </button>
      </div>
    </div>
  )
}
