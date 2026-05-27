import { useNavigate } from 'react-router-dom'
import { AvatarCircle } from '../../components/ui'
import { IconLive, IconUsers } from '../../components/icons'

const UPCOMING = [
  { title: 'Mastering Past Tenses', teacher: 'Emma Carter', when: 'Today · 7:00 PM', level: 'B1' },
  { title: 'IELTS Speaking Q&A', teacher: 'James Lee', when: 'Tomorrow · 6:00 PM', level: 'B2' },
  { title: 'Pronunciation Clinic', teacher: 'Sara Kim', when: 'Sat · 5:00 PM', level: 'A2–B1' }
]

export default function LivePage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live</h1>
            <p className="text-sm text-slate-400 mt-1">Join open lessons, or go live yourself.</p>
          </div>
          <button className="btn-primary px-5 py-2.5 inline-flex items-center gap-2">
            <IconLive className="w-4 h-4" /> Go live
          </button>
        </div>

        {/* Live now */}
        <button
          onClick={() => navigate('/live/room')}
          className="relative overflow-hidden rounded-card bg-gradient-to-br from-rose-600 via-red-700 to-slate-950 p-6 text-left ring-1 ring-white/10"
        >
          <div aria-hidden className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-white text-rose-700 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" /> Live now
          </span>
          <h2 className="text-2xl font-bold text-white mt-3">Everyday English: Small Talk</h2>
          <div className="flex items-center gap-3 mt-2">
            <AvatarCircle name="Emma Carter" size="sm" />
            <span className="text-sm text-white/90">Emma Carter</span>
            <span className="inline-flex items-center gap-1 text-xs text-white/70"><IconUsers className="w-3.5 h-3.5" /> 342 watching</span>
          </div>
          <span className="inline-block mt-4 rounded-full bg-white text-slate-900 font-semibold text-sm px-5 py-2.5">Join live →</span>
        </button>

        {/* Upcoming */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Upcoming</p>
          <div className="flex flex-col gap-2">
            {UPCOMING.map((u) => (
              <div key={u.title} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <AvatarCircle name={u.teacher} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.title}</p>
                  <p className="text-xs text-slate-400">{u.teacher} · {u.when} · {u.level}</p>
                </div>
                <button className="text-xs font-semibold text-brand-300 hover:text-brand-200 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 shrink-0">
                  Remind me
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
