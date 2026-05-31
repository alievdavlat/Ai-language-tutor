import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { useAppStore } from '../../store/useAppStore'
import { useProgressStore } from '../../services/progress'
import { usePresence } from '../../services/social/presence'
import { loadAudience, type AudienceMember } from '../../services/social/liveFeed'
import { IconPlus, IconUsers, IconHeart } from '../../components/icons'

/** Initials from a name, for the avatar rings (no emoji — Instagram-style). */
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

const MATCH_GRADIENTS = [
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-fuchsia-600'
]

function Ring({
  children,
  ringCls,
  label,
  sub,
  badge,
  onClick
}: {
  children: React.ReactNode
  ringCls: string
  label: string
  sub?: string
  badge?: React.ReactNode
  onClick: () => void
}): JSX.Element {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] group">
      <div className={cn('relative p-[2.5px] rounded-full', ringCls)}>
        <div className="w-[58px] h-[58px] rounded-full ring-2 ring-canvas overflow-hidden transition group-hover:scale-[1.04]">{children}</div>
        {badge}
      </div>
      <span className="text-[11px] text-slate-300 truncate w-full text-center leading-tight">{label}</span>
      {sub && <span className="text-[9px] uppercase tracking-wide text-slate-500 -mt-1">{sub}</span>}
    </button>
  )
}

/** Avatar fill — real photo when present, else initials over a gradient. */
function Fill({ user, gradient }: { user: AudienceMember['user']; gradient: string }): JSX.Element {
  const avatarUrl = (user as { avatarUrl?: string }).avatarUrl
  return (
    <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center text-white font-bold relative overflow-hidden', gradient)}>
      {avatarUrl ? <img src={avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : initials(user.name)}
    </div>
  )
}

/**
 * Instagram-style "Now" bar — live rooms + a *meaningful* audience (study buddy,
 * people you follow, recent partners, then level/language matches as fill).
 * Online dots come from REAL presence; people who aren't actually using the app
 * don't get a green dot. Empty → Go-live + Find-buddy CTA.
 */
export default function NowBar(): JSX.Element {
  const navigate = useNavigate()
  const me = backend.currentUserId()
  const profile = useAppStore((s) => s.profile)
  const buddyId = useProgressStore((s) => s.buddyId)
  const { online } = usePresence()

  const { data: live } = useBackendQuery(() => backend.listLiveNow(), [], [])
  const { data: audience } = useBackendQuery(
    () => loadAudience(me, { buddyId, level: profile?.level, targetLanguage: profile?.targetLanguage }, 12),
    [me, buddyId, profile?.level, profile?.targetLanguage],
    []
  )

  // Online people sort to the front (within their reason priority order).
  const sorted = [...audience].sort((a, b) => Number(online(b.user.id)) - Number(online(a.user.id)))
  const onlineCount = sorted.filter((m) => online(m.user.id)).length
  const isEmpty = live.length === 0 && sorted.length === 0
  const hasBuddy = sorted.some((m) => m.reason === 'buddy')

  const openMember = (m: AudienceMember): void =>
    navigate(m.canMessage ? `/inbox?user=${m.user.id}&greet=1` : `/profile?user=${m.user.id}`)

  return (
    <div className="px-6 pb-3 border-b border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Now</span>
        <button onClick={() => navigate('/live')} className="text-[11px] font-bold inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition">
          {live.length > 0 && <span className="inline-flex items-center gap-1 text-rose-400"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {live.length} live</span>}
          {onlineCount > 0 && <span className="inline-flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {onlineCount} online</span>}
          <span>See all</span>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {isEmpty ? (
        <div className="flex items-center gap-3 py-1">
          <button onClick={() => navigate('/live/room?host=1')} className="flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/15 to-violet-500/10 px-4 py-3 text-left transition hover:border-brand-400/40">
            <p className="text-sm font-bold text-white inline-flex items-center gap-2"><IconPlus className="w-4 h-4 text-brand-300" /> Go live</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Start a room and invite the community</p>
          </button>
          <button onClick={() => navigate('/buddy')} className="flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 px-4 py-3 text-left transition hover:border-emerald-400/40">
            <p className="text-sm font-bold text-white inline-flex items-center gap-2"><IconUsers className="w-4 h-4 text-emerald-300" /> Find a study buddy</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Match by level &amp; language, practise together</p>
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {/* Go live */}
          <Ring ringCls="bg-gradient-to-tr from-brand-500 to-violet-500" label="Go live" onClick={() => navigate('/live/room?host=1')}>
            <div className="w-full h-full bg-canvas-soft flex items-center justify-center"><IconPlus className="w-6 h-6 text-brand-300" /></div>
          </Ring>

          {/* Live rooms now */}
          {live.map((s) => (
            <Ring
              key={s.id}
              ringCls="bg-gradient-to-tr from-rose-500 to-amber-500 animate-pulse"
              label={s.title}
              badge={<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black bg-rose-600 text-white px-1.5 py-px rounded">LIVE</span>}
              onClick={() => navigate(`/live/room?id=${s.id}`)}
            >
              <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center text-white font-bold relative overflow-hidden', s.cover)}>
                {s.imageUrl ? <img src={s.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : initials(s.title)}
              </div>
            </Ring>
          ))}

          {/* Meaningful audience: buddy → following → recent → matches */}
          {sorted.map((m, i) => {
            const isOnline = online(m.user.id)
            const isBuddy = m.reason === 'buddy'
            return (
              <Ring
                key={m.user.id}
                ringCls={cn(
                  'bg-gradient-to-tr',
                  isBuddy ? 'from-amber-400 to-rose-500' : isOnline ? 'from-emerald-400 to-teal-500' : 'from-white/15 to-white/10'
                )}
                label={m.user.name.split(' ')[0]}
                sub={isBuddy ? 'Buddy' : m.reason === 'match' ? 'Suggested' : undefined}
                badge={
                  isBuddy ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 ring-2 ring-canvas flex items-center justify-center">
                      <IconHeart className="w-2.5 h-2.5 text-white" />
                    </span>
                  ) : isOnline ? (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-canvas" />
                  ) : undefined
                }
                onClick={() => openMember(m)}
              >
                <Fill user={m.user} gradient={MATCH_GRADIENTS[i % MATCH_GRADIENTS.length]} />
              </Ring>
            )
          })}

          {/* Find a buddy (only if not already paired) */}
          {!hasBuddy && (
            <Ring ringCls="bg-gradient-to-tr from-emerald-400/60 to-teal-500/60" label="Find buddy" onClick={() => navigate('/buddy')}>
              <div className="w-full h-full bg-canvas-soft flex items-center justify-center"><IconUsers className="w-5 h-5 text-emerald-300" /></div>
            </Ring>
          )}
        </div>
      )}
    </div>
  )
}
