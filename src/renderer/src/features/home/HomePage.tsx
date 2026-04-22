import { useAppStore } from '../../store/useAppStore'
import GreetingHeader from './sections/GreetingHeader'
import StatsRow from './sections/StatsRow'
import ModuleGrid from './sections/ModuleGrid'
import SystemStatusStrip from './sections/SystemStatusStrip'

export default function HomePage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const hw = useAppStore((s) => s.hw)
  const rec = useAppStore((s) => s.rec)
  const ollama = useAppStore((s) => s.ollama)

  const speakingEnabled = !!ollama?.running && (ollama?.models.length ?? 0) > 0
  const speakingDisabledReason = !ollama?.running ? 'Ollama not running' : 'No model loaded'

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <GreetingHeader profile={profile} />
        <StatsRow profile={profile} />
        <ModuleGrid
          speakingEnabled={speakingEnabled}
          speakingDisabledReason={speakingDisabledReason}
        />
        <SystemStatusStrip hw={hw} rec={rec} ollama={ollama} />
      </div>
    </div>
  )
}
