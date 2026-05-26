import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/classnames'

// ─── Module definitions ───────────────────────────────────────────────────────

interface ModuleDef {
  id: string
  icon: string
  title: string
  description: string
  cta: string
  to: string
  badge: string | null
  gradient: string
  border: string
  glow: string
}

const ACTIVE_MODULES: ModuleDef[] = [
  {
    id: 'call',
    icon: '📞',
    title: 'Voice Call',
    description: 'Fullscreen immersive conversation — just talk. Real-time AI, pulsing orb, zero distractions.',
    cta: 'Start call',
    to: '/speaking/call',
    badge: 'LIVE',
    gradient: 'from-violet-600/30 via-fuchsia-600/20 to-transparent',
    border: 'border-violet-500/25',
    glow: 'hover:shadow-[0_8px_30px_rgba(139,92,246,0.25)]'
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'Chat + Voice',
    description: 'Text bubbles with live grammar corrections and AI feedback. Type or speak.',
    cta: 'Open chat',
    to: '/speaking',
    badge: null,
    gradient: 'from-blue-600/25 via-cyan-600/15 to-transparent',
    border: 'border-blue-500/20',
    glow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.2)]'
  }
]

const COMING_SOON = [
  { title: 'Vocabulary', icon: '📚' },
  { title: 'Grammar', icon: '✍️' },
  { title: 'Listening', icon: '🎧' },
  { title: 'Reading', icon: '📖' },
  { title: 'Writing', icon: '✏️' }
]

// ─── Module card ──────────────────────────────────────────────────────────────

interface ModuleCardProps extends ModuleDef {
  disabled: boolean
  disabledReason: string
}

function ModuleCard({
  icon,
  title,
  description,
  cta,
  to,
  badge,
  gradient,
  border,
  glow,
  disabled,
  disabledReason
}: ModuleCardProps): JSX.Element {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-gradient-to-br p-5 flex flex-col gap-4 min-h-[210px] transition-all duration-200',
        gradient,
        border,
        !disabled && cn('cursor-pointer hover:-translate-y-0.5', glow),
        disabled && 'opacity-70'
      )}
      onClick={() => { if (!disabled) navigate(to) }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) navigate(to) }}
    >
      {/* Live badge */}
      {badge && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur text-white rounded-full px-2.5 py-1">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className="text-4xl leading-none">{icon}</div>

      {/* Body */}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
        <p className="text-sm text-white/65 leading-relaxed">{description}</p>
      </div>

      {/* CTA */}
      <div
        className={cn(
          'rounded-xl py-2.5 px-4 text-sm font-semibold text-center transition-all duration-150',
          disabled
            ? 'bg-white/10 text-white/35 cursor-not-allowed'
            : 'bg-white/20 hover:bg-white/30 text-white'
        )}
      >
        {disabled && disabledReason ? `⚠ ${disabledReason}` : `${cta} →`}
      </div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ModuleGridProps {
  speakingEnabled: boolean
  speakingDisabledReason: string
}

export default function ModuleGrid({
  speakingEnabled,
  speakingDisabledReason
}: ModuleGridProps): JSX.Element {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
        Continue learning
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACTIVE_MODULES.map((m) => (
          <ModuleCard
            key={m.id}
            {...m}
            disabled={!speakingEnabled}
            disabledReason={speakingDisabledReason}
          />
        ))}
      </div>

      {/* Coming soon */}
      <div className="mt-1">
        <p className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-3">
          More modules coming soon
        </p>
        <div className="flex flex-wrap gap-2">
          {COMING_SOON.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-600 text-sm"
            >
              <span className="opacity-50">{item.icon}</span>
              <span className="font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
