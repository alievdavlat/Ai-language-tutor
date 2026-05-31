import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { IconPlus } from '../../components/icons'

/** Initials from a name, for the avatar rings (no emoji — Instagram-style). */
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

const BUDDY_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-fuchsia-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600'
]

function Ring({
  children,
  ringCls,
  label,
  badge,
  onClick
}: {
  children: React.ReactNode
  ringCls: string
  label: string
  badge?: React.ReactNode
  onClick: () => void
}): JSX.Element {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] group">
      <div className={cn('relative p-[2.5px] rounded-full', ringCls)}>
        <div className="w-[58px] h-[58px] rounded-full ring-2 ring-canvas overflow-hidden transition group-hover:scale-[1.04]">{children}</div>
        {badge}
      </div>
      <span className="text-[11px] text-slate-300 truncate w-full text-center">{label}</span>
    </button>
  )
}

/**
 * Instagram-style "Now" bar — live rooms + online study-buddies as story rings.
 * Real data: backend.listLiveNow() for live, backend.listUsers() for buddies.
 * Folds the old Live + Study-Buddy surfaces into the social hub.
 */
export default function NowBar(): JSX.Element {
  const navigate = useNavigate()
  const me = backend.currentUserId()
  const { data: live } = useBackendQuery(() => backend.listLiveNow(), [], [])
  const { data: users } = useBackendQuery(() => backend.listUsers({ role: 'student', limit: 12 }), [], [])
  const buddies = users.filter((u) => u.id !== me).slice(0, 8)

  return (
    <div className="px-6 pb-3 border-b border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Now</span>
        <button onClick={() => navigate('/live')} className="text-[11px] font-bold inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition">
          {live.length > 0 && <span className="inline-flex items-center gap-1 text-rose-400"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {live.length} live</span>}
          <span>See all</span>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {/* Go live */}
        <Ring
          ringCls="bg-gradient-to-tr from-brand-500 to-violet-500"
          label="Go live"
          onClick={() => navigate('/live/room?host=1')}
        >
          <div className="w-full h-full bg-canvas-soft flex items-center justify-center"><IconPlus className="w-6 h-6 text-brand-300" /></div>
        </Ring>

        {/* Live rooms now */}
        {live.map((s) => (
          <Ring
            key={s.id}
            ringCls="bg-gradient-to-tr from-rose-500 to-amber-500 animate-pulse"
            label={s.title}
            badge={<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black bg-rose-600 text-white px-1.5 py-px rounded">LIVE</span>}
            onClick={() => navigate(`/live/room?room=${s.id}`)}
          >
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center text-white font-bold relative overflow-hidden', s.cover)}>
              {s.imageUrl ? <img src={s.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : initials(s.title)}
            </div>
          </Ring>
        ))}

        {/* Online study-buddies */}
        {buddies.map((u, i) => (
          <Ring
            key={u.id}
            ringCls="bg-gradient-to-tr from-emerald-400 to-teal-500"
            label={u.name.split(' ')[0]}
            badge={<span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-canvas" />}
            onClick={() => navigate(`/inbox?user=${u.id}&greet=1`)}
          >
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center text-white font-bold relative overflow-hidden', BUDDY_GRADIENTS[i % BUDDY_GRADIENTS.length])}>
              {(u as { avatarUrl?: string }).avatarUrl ? <img src={(u as { avatarUrl?: string }).avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : initials(u.name)}
            </div>
          </Ring>
        ))}
      </div>
    </div>
  )
}
