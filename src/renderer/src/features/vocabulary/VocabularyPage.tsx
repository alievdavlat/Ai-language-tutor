import {
  Button,
  ListRow,
  ProgressRing,
  SectionHeading,
  StatCard
} from '../../components/ui'
import { IconBookmark, IconPlus, IconVolume } from '../../components/icons'

// Hardcoded preview data — wired to FSRS store in a later phase.
const STATS = [
  { value: 8, label: 'To review', tone: 'rose' as const },
  { value: 23, label: 'Learning', tone: 'amber' as const },
  { value: 142, label: 'Mastered', tone: 'emerald' as const }
]

const POPULAR = [
  { word: 'itinerary', meaning: 'a planned route or journey', tag: 'Travel' },
  { word: 'reservation', meaning: 'an arrangement to be kept', tag: 'Travel' },
  { word: 'spontaneous', meaning: 'done without planning ahead', tag: 'Daily life' },
  { word: 'negotiate', meaning: 'discuss to reach an agreement', tag: 'Business' },
  { word: 'deadline', meaning: 'the latest time to finish', tag: 'Work' }
]

function AudioButton(): JSX.Element {
  return (
    <button
      type="button"
      className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center hover:bg-brand-500/25 transition"
      title="Play pronunciation"
    >
      <IconVolume className="w-[18px] h-[18px]" />
    </button>
  )
}

export default function VocabularyPage(): JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vocabulary</h1>
          <p className="text-sm text-slate-400 mt-1">
            Words you collect from conversations, reviewed with spaced repetition.
          </p>
        </div>

        {/* Stat trio */}
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} tone={s.tone} />
          ))}
        </div>

        {/* Saved set + review ring */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex items-center gap-5">
          <ProgressRing value={62} size={104} tone="vocab">
            <span className="text-xl font-bold text-white">62%</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">retention</span>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white">Your saved vocabulary</h3>
            <p className="text-sm text-slate-400 mt-1">
              31 words are due for review today. A quick 5-minute session keeps them fresh.
            </p>
            <Button className="mt-3">Start review →</Button>
          </div>
        </div>

        {/* Popular vocabulary list */}
        <div>
          <SectionHeading
            title="Popular vocabulary"
            subtitle="Trending words other learners are studying"
            action={
              <button className="text-xs font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1">
                <IconPlus className="w-3.5 h-3.5" /> Add word
              </button>
            }
          />
          <div className="flex flex-col gap-2">
            {POPULAR.map((w) => (
              <ListRow
                key={w.word}
                title={
                  <span className="flex items-center gap-2">
                    {w.word}
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-white/5 rounded px-1.5 py-0.5">
                      {w.tag}
                    </span>
                  </span>
                }
                subtitle={w.meaning}
                trailing={
                  <>
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full text-slate-500 hover:text-brand-300 hover:bg-white/5 flex items-center justify-center transition"
                      title="Save word"
                    >
                      <IconBookmark className="w-[18px] h-[18px]" />
                    </button>
                    <AudioButton />
                  </>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
