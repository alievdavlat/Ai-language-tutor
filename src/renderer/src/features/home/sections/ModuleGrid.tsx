import { useNavigate } from 'react-router-dom'
import GradientCard, { type GradientTone } from '../../../components/ui/GradientCard'
import IconBubble from '../../../components/ui/IconBubble'
import { cn } from '../../../lib/classnames'

interface ModuleCardProps {
  title: string
  description: string
  icon: string
  tone: GradientTone
  cta: string
  ctaTo?: string
  disabled?: boolean
  badge?: string
  progress?: number // 0..1
}

function ModuleCard({
  title,
  description,
  icon,
  tone,
  cta,
  ctaTo,
  disabled,
  badge,
  progress
}: ModuleCardProps): JSX.Element {
  const navigate = useNavigate()
  const pct = progress !== undefined ? Math.round(progress * 100) : null

  return (
    <GradientCard
      tone={tone}
      className={cn(
        'flex flex-col gap-4 min-h-[220px] transition',
        !disabled && 'cursor-pointer hover:-translate-y-1 hover:brightness-110'
      )}
      onClick={() => {
        if (disabled || !ctaTo) return
        navigate(ctaTo)
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <IconBubble tone={tone} size="lg" className="ring-white/30">
          {icon}
        </IconBubble>
        {badge && (
          <span className="rounded-pill bg-white/20 text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
            {badge}
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-sm text-white/80 leading-relaxed">{description}</p>
      </div>

      {pct !== null && (
        <div>
          <div className="flex items-center justify-between text-xs text-white/80 mb-1">
            <span>Progress</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-pill bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-pill bg-white"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <button
        className={cn(
          'mt-auto rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2.5 transition',
          disabled && 'bg-white/10 text-white/60 cursor-not-allowed'
        )}
        disabled={disabled}
      >
        {cta}
      </button>
    </GradientCard>
  )
}

interface ModuleGridProps {
  speakingEnabled: boolean
  speakingDisabledReason: string
}

export default function ModuleGrid({
  speakingEnabled,
  speakingDisabledReason
}: ModuleGridProps): JSX.Element {
  return (
    <section className="mb-8">
      <h2 className="section-title">Your modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ModuleCard
          title="Voice call"
          description="Fullscreen voice conversation — like calling a friend. Pulsing orb, no chat, just talk."
          icon="📞"
          tone="speak"
          cta={speakingEnabled ? 'Start call →' : speakingDisabledReason}
          ctaTo="/speaking/call"
          disabled={!speakingEnabled}
          badge="NEW"
        />
        <ModuleCard
          title="Text + voice chat"
          description="Classic chat view with text bubbles, grammar corrections and avatar lip-sync."
          icon="💬"
          tone="brand"
          cta={speakingEnabled ? 'Open chat →' : speakingDisabledReason}
          ctaTo="/speaking"
          disabled={!speakingEnabled}
        />
        <ModuleCard
          title="Vocabulary"
          description="Review flashcards with spaced repetition and build a personal word list."
          icon="📚"
          tone="vocab"
          cta="Coming in Phase 4"
          disabled
          badge="Soon"
        />
        <ModuleCard
          title="Grammar"
          description="Structured lessons, Duolingo-style skill tree, Murphy-style units."
          icon="✍️"
          tone="grammar"
          cta="Coming in Phase 5"
          disabled
          badge="Soon"
        />
        <ModuleCard
          title="Listening"
          description="Podcasts + audio library with word-tap lookup and dictation mode."
          icon="🎧"
          tone="listen"
          cta="Coming in Phase 9"
          disabled
          badge="Soon"
        />
        <ModuleCard
          title="Reading"
          description="Graded articles, double-click word popups, AI-graded summaries."
          icon="📖"
          tone="read"
          cta="Coming in Phase 9"
          disabled
          badge="Soon"
        />
        <ModuleCard
          title="Writing"
          description="IELTS/TOEFL essay scoring with 4-criterion rubric."
          icon="✏️"
          tone="write"
          cta="Coming in Phase 9"
          disabled
          badge="Soon"
        />
      </div>
    </section>
  )
}
