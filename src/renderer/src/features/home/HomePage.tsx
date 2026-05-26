import { useAppStore } from '../../store/useAppStore'
import GreetingHeader from './sections/GreetingHeader'
import StatsRow from './sections/StatsRow'
import ModuleGrid from './sections/ModuleGrid'

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
    <div className={[
      'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs mb-4',
      isFailed
        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
        : 'bg-brand-500/10 border border-brand-400/20 text-brand-200'
    ].join(' ')}>
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

export default function HomePage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const ollama = useAppStore((s) => s.ollama)
  const autoSetup = useAppStore((s) => s.autoSetup)

  const aiReady = (!!ollama?.running && (ollama?.models.length ?? 0) > 0) ||
    autoSetup.phase === 'ready'
  const speakingEnabled = aiReady
  const speakingDisabledReason = 'AI is starting up…'

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-7 flex flex-col min-h-full max-w-5xl">
        <GreetingHeader profile={profile} />
        <AISetupBanner />
        <StatsRow profile={profile} />
        <ModuleGrid
          speakingEnabled={speakingEnabled}
          speakingDisabledReason={speakingDisabledReason}
        />
      </div>
    </div>
  )
}
