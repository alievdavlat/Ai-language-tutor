import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import {
  IconBolt,
  IconChat,
  IconFlame,
  IconHeart,
  IconMic,
  IconStar,
  IconTarget,
  IconTrophy,
  type IconProps
} from '../../components/icons'

interface Quest {
  title: string
  reward: number
  progress: number
  target: number
  unit: string
  Icon: (p: IconProps) => JSX.Element
  tint: string
  done?: boolean
}

const DAILY: Quest[] = [
  { title: 'Earn 30 XP', reward: 20, progress: 22, target: 30, unit: 'XP', Icon: IconBolt, tint: 'bg-brand-500/15 text-brand-300' },
  { title: 'Complete 1 speaking session', reward: 15, progress: 1, target: 1, unit: '', Icon: IconMic, tint: 'bg-emerald-500/15 text-emerald-300', done: true },
  { title: 'Get 5 perfect answers', reward: 25, progress: 3, target: 5, unit: '', Icon: IconStar, tint: 'bg-amber-500/15 text-amber-300' }
]

const WEEKLY: Quest[] = [
  { title: 'Study 5 days this week', reward: 100, progress: 3, target: 5, unit: 'days', Icon: IconFlame, tint: 'bg-orange-500/15 text-orange-300' },
  { title: 'Learn 50 new words', reward: 80, progress: 28, target: 50, unit: 'words', Icon: IconChat, tint: 'bg-violet-500/15 text-violet-300' },
  { title: 'Score 80%+ on 3 lessons', reward: 120, progress: 1, target: 3, unit: 'lessons', Icon: IconTarget, tint: 'bg-rose-500/15 text-rose-300' },
  { title: 'Hold a 7-day streak', reward: 150, progress: 7, target: 7, unit: 'days', Icon: IconHeart, tint: 'bg-pink-500/15 text-pink-300', done: true }
]

const MONTHLY: Quest[] = [
  { title: 'Complete 1 full course', reward: 500, progress: 0, target: 1, unit: 'course', Icon: IconTrophy, tint: 'bg-amber-400/20 text-amber-200' },
  { title: 'Reach Gold league', reward: 300, progress: 0, target: 1, unit: 'tier', Icon: IconStar, tint: 'bg-yellow-400/20 text-yellow-200' }
]

function QuestRow({ q }: { q: Quest }): JSX.Element {
  const pct = Math.min(100, Math.round((q.progress / q.target) * 100))
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 flex items-center gap-4 transition',
        q.done ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
      )}
    >
      <span className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', q.tint)}>
        <q.Icon className="w-6 h-6" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">{q.title}</p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-200 shrink-0">
            <IconBolt className="w-3.5 h-3.5 text-amber-300" /> +{q.reward}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1"><ProgressBar value={pct} color={q.done ? 'green' : 'brand'} /></div>
          <span className={cn('text-[11px] font-semibold shrink-0', q.done ? 'text-emerald-300' : 'text-slate-400')}>
            {q.done ? 'Claim ✓' : `${q.progress}/${q.target} ${q.unit}`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function QuestsPage(): JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <PageHeader
          title="Quests"
          subtitle="Daily, weekly and monthly challenges for bonus XP."
          back="/home"
          crumbs={[{ label: 'Home', to: '/home' }, { label: 'Quests' }]}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-200 text-xs font-bold px-3 py-1.5">
              <IconBolt className="w-3.5 h-3.5" /> 1,240 XP
            </span>
          }
        />

        {/* Treasure chest preview */}
        <div className="rounded-card p-5 bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-400/20 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/30 flex items-center justify-center text-3xl">📦</div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-amber-200/80 font-bold">Weekly chest</p>
            <h3 className="text-base font-bold text-white">Complete 4 of 4 weekly quests</h3>
            <ProgressBar value={50} color="amber" className="mt-2" />
          </div>
          <span className="text-xs font-bold text-amber-200 shrink-0">2/4</span>
        </div>

        <div>
          <SectionHeading title="Today" subtitle="Resets at midnight" />
          <div className="flex flex-col gap-2.5">
            {DAILY.map((q) => <QuestRow key={q.title} q={q} />)}
          </div>
        </div>

        <div>
          <SectionHeading title="This week" subtitle="Resets Sunday" />
          <div className="flex flex-col gap-2.5">
            {WEEKLY.map((q) => <QuestRow key={q.title} q={q} />)}
          </div>
        </div>

        <div>
          <SectionHeading title="Long-term" subtitle="Big rewards · monthly" />
          <div className="flex flex-col gap-2.5">
            {MONTHLY.map((q) => <QuestRow key={q.title} q={q} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
