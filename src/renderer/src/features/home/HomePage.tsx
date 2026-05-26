import type { OllamaStatus } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import type { AutoSetupState } from '../../store/useAppStore'
import GreetingHeader from './sections/GreetingHeader'
import ModuleGrid from './sections/ModuleGrid'
import DailyProgressCard from './sections/DailyProgressCard'
import WeekStreakCard from './sections/WeekStreakCard'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function deriveDisabledReason(autoSetup: AutoSetupState, ollama: OllamaStatus | null): string {
  if (autoSetup.phase === 'starting') return 'AI is starting…'
  if (autoSetup.phase === 'pulling') return `Downloading AI (${autoSetup.pullPct}%)`
  if (autoSetup.phase === 'failed') return 'AI could not start'
  if (!ollama?.installed) return 'AI not installed'
  if (!ollama?.running) return 'AI is starting…'
  return 'AI model loading…'
}

// ─── AI setup status banner ───────────────────────────────────────────────────

function AISetupBanner(): JSX.Element | null {
  const autoSetup = useAppStore((s) => s.autoSetup)

  if (!autoSetup.phase || autoSetup.phase === 'ready') return null

  const messages: Record<string, string> = {
    starting: 'Starting your AI coach…',
    pulling: `Downloading AI model — ${autoSetup.pullPct}% complete`,
    failed: 'AI could not start automatically. Visit Settings → AI Setup.'
  }

  const msg = messages[autoSetup.phase] ?? ''
  const isFailed = autoSetup.phase === 'failed'

  return (
    <div
      className={[
        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs',
        isFailed
          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
          : 'bg-brand-500/10 border border-brand-400/20 text-brand-200'
      ].join(' ')}
    >
      {!isFailed && (
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shrink-0" />
      )}
      {isFailed && <span className="shrink-0">⚠</span>}
      <span>{msg}</span>
      {autoSetup.phase === 'pulling' && (
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden ml-2">
          <div
            className="h-full rounded-full bg-brand-400 transition-all duration-500"
            style={{ width: `${autoSetup.pullPct}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const ollama = useAppStore((s) => s.ollama)
  const autoSetup = useAppStore((s) => s.autoSetup)

  const ollamaReady = !!ollama?.running && (ollama?.models.length ?? 0) > 0
  const speakingEnabled = ollamaReady || autoSetup.phase === 'ready'
  const speakingDisabledReason = deriveDisabledReason(autoSetup, ollama)

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 flex flex-col gap-5">
        <GreetingHeader profile={profile} />
        <AISetupBanner />

        {/* Main content — modules (left) + progress widgets (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5">
          <ModuleGrid
            speakingEnabled={speakingEnabled}
            speakingDisabledReason={speakingDisabledReason}
          />
          <div className="flex flex-col gap-4">
            <DailyProgressCard current={0} goal={10} />
            <WeekStreakCard streak={0} />
          </div>
        </div>
      </div>
    </div>
  )
}
