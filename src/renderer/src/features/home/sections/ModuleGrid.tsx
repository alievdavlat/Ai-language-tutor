import { useNavigate } from 'react-router-dom'
import GradientCard, { type GradientTone } from '../../../components/ui/GradientCard'
import IconBubble from '../../../components/ui/IconBubble'
import { cn } from '../../../lib/classnames'

// ─── Active module card (large) ───────────────────────────────────────────────
interface ActiveCardProps {
  title: string
  description: string
  icon: string
  tone: GradientTone
  cta: string
  ctaTo: string
  disabled?: boolean
  disabledReason?: string
  badge?: string
}

function ActiveCard({
  title,
  description,
  icon,
  tone,
  cta,
  ctaTo,
  disabled,
  disabledReason,
  badge
}: ActiveCardProps): JSX.Element {
  const navigate = useNavigate()

  return (
    <GradientCard
      tone={tone}
      className={cn(
        'flex flex-col gap-4 min-h-[200px] transition-all duration-200',
        !disabled && 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:brightness-110',
        disabled && 'opacity-80'
      )}
      onClick={() => {
        if (disabled) return
        navigate(ctaTo)
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <IconBubble tone={tone} size="lg" className="ring-white/30">
          {icon}
        </IconBubble>
        {badge && (
          <span className="rounded-full bg-white/25 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
            {badge}
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold mb-1.5">{title}</h3>
        <p className="text-sm text-white/75 leading-relaxed">{description}</p>
      </div>

      <button
        className={cn(
          'rounded-xl text-sm font-semibold py-2.5 transition-all duration-150',
          disabled
            ? 'bg-white/10 text-white/50 cursor-not-allowed'
            : 'bg-white/20 hover:bg-white/30 text-white'
        )}
        disabled={disabled}
      >
        {disabled && disabledReason ? `⚠ ${disabledReason}` : cta}
      </button>
    </GradientCard>
  )
}

// ─── Coming-soon chip row ─────────────────────────────────────────────────────
interface ComingSoonItem {
  title: string
  icon: string
  phase: string
}

const COMING_SOON: ComingSoonItem[] = [
  { title: 'Vocabulary', icon: '📚', phase: 'Phase 4' },
  { title: 'Grammar', icon: '✍️', phase: 'Phase 5' },
  { title: 'Listening', icon: '🎧', phase: 'Phase 9' },
  { title: 'Reading', icon: '📖', phase: 'Phase 9' },
  { title: 'Writing', icon: '✏️', phase: 'Phase 9' }
]

function ComingSoonStrip(): JSX.Element {
  return (
    <div className="mt-2">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
        Coming soon
      </p>
      <div className="flex flex-wrap gap-2">
        {COMING_SOON.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-500 text-sm"
            title={item.phase}
          >
            <span className="text-base opacity-60">{item.icon}</span>
            <span className="font-medium">{item.title}</span>
            <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">
              {item.phase}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────
interface ModuleGridProps {
  speakingEnabled: boolean
  speakingDisabledReason: string
}

export default function ModuleGrid({
  speakingEnabled,
  speakingDisabledReason
}: ModuleGridProps): JSX.Element {
  return (
    <section className="mb-6">
      <h2 className="section-title mb-4">Continue learning</h2>

      {/* Active modules — 2 big cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ActiveCard
          title="Voice Call"
          description="Fullscreen conversation — just talk. Pulsing orb, real-time AI, zero distractions."
          icon="📞"
          tone="speak"
          cta="Start call →"
          ctaTo="/speaking/call"
          disabled={!speakingEnabled}
          disabledReason={speakingDisabledReason}
          badge="Live"
        />
        <ActiveCard
          title="Chat + Voice"
          description="Text bubbles with live grammar corrections and avatar lip-sync. Type or speak."
          icon="💬"
          tone="brand"
          cta="Open chat →"
          ctaTo="/speaking"
          disabled={!speakingEnabled}
          disabledReason={speakingDisabledReason}
        />
      </div>

      <ComingSoonStrip />
    </section>
  )
}
