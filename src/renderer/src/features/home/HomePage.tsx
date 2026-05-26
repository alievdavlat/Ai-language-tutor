import { useAppStore } from '../../store/useAppStore'
import GreetingHeader from './sections/GreetingHeader'
import StatsRow from './sections/StatsRow'
import ModuleGrid from './sections/ModuleGrid'

export default function HomePage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const ollama = useAppStore((s) => s.ollama)

  const speakingEnabled = !!ollama?.running && (ollama?.models.length ?? 0) > 0
  const speakingDisabledReason = !ollama?.running ? 'Setting up AI…' : 'Loading AI model…'

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
        <StatsRow profile={profile} />
        <ModuleGrid
          speakingEnabled={speakingEnabled}
          speakingDisabledReason={speakingDisabledReason}
        />
      </div>
    </div>
  )
}
