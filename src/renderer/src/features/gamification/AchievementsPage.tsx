import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import {
  IconBolt,
  IconBook,
  IconBookmark,
  IconChat,
  IconFlame,
  IconHeart,
  IconLive,
  IconMedal,
  IconMic,
  IconStar,
  IconTarget,
  IconTrophy,
  IconUsers,
  type IconProps
} from '../../components/icons'

interface Badge {
  name: string
  desc: string
  Icon: (p: IconProps) => JSX.Element
  unlocked: boolean
  progress?: number
  target?: number
  tint: string
}

const CATEGORIES: Record<string, Badge[]> = {
  Speaking: [
    { name: 'First chat', desc: 'Send your first message', Icon: IconChat, unlocked: true, tint: 'bg-brand-500/15 text-brand-300' },
    { name: 'Smooth talker', desc: 'Complete 10 chats', Icon: IconMic, unlocked: true, tint: 'bg-emerald-500/15 text-emerald-300' },
    { name: 'Conversation pro', desc: 'Complete 100 chats', Icon: IconStar, unlocked: false, progress: 41, target: 100, tint: 'bg-violet-500/15 text-violet-300' },
    { name: 'Native flow', desc: 'Hit 95% fluency on 5 turns', Icon: IconBolt, unlocked: false, progress: 2, target: 5, tint: 'bg-amber-500/15 text-amber-300' }
  ],
  Streak: [
    { name: 'On fire', desc: '7-day streak', Icon: IconFlame, unlocked: true, tint: 'bg-orange-500/15 text-orange-300' },
    { name: 'Wildfire', desc: '30-day streak', Icon: IconFlame, unlocked: false, progress: 7, target: 30, tint: 'bg-rose-500/15 text-rose-300' },
    { name: 'Eternal flame', desc: '100-day streak', Icon: IconFlame, unlocked: false, progress: 7, target: 100, tint: 'bg-red-500/20 text-red-300' },
    { name: 'Year of fire', desc: '365-day streak', Icon: IconTrophy, unlocked: false, progress: 7, target: 365, tint: 'bg-yellow-500/20 text-yellow-300' }
  ],
  Learning: [
    { name: '100 words', desc: 'Save 100 vocabulary items', Icon: IconBookmark, unlocked: true, tint: 'bg-emerald-500/15 text-emerald-300' },
    { name: 'Lexicon', desc: 'Save 1000 vocabulary items', Icon: IconBook, unlocked: false, progress: 342, target: 1000, tint: 'bg-sky-500/15 text-sky-300' },
    { name: 'First lesson', desc: 'Complete a lesson', Icon: IconStar, unlocked: true, tint: 'bg-amber-500/15 text-amber-300' },
    { name: '1000 XP', desc: 'Earn 1000 XP total', Icon: IconBolt, unlocked: true, tint: 'bg-violet-500/15 text-violet-300' },
    { name: '10,000 XP', desc: 'Earn 10,000 XP total', Icon: IconBolt, unlocked: false, progress: 2410, target: 10000, tint: 'bg-fuchsia-500/15 text-fuchsia-300' },
    { name: 'Sharp tongue', desc: 'Get 50 corrections', Icon: IconTarget, unlocked: false, progress: 28, target: 50, tint: 'bg-rose-500/15 text-rose-300' }
  ],
  Social: [
    { name: 'Heart giver', desc: 'Like 10 posts', Icon: IconHeart, unlocked: true, tint: 'bg-pink-500/15 text-pink-300' },
    { name: 'Connected', desc: 'Follow 5 teachers', Icon: IconUsers, unlocked: true, tint: 'bg-sky-500/15 text-sky-300' },
    { name: 'Showtime', desc: 'Watch a live lesson', Icon: IconLive, unlocked: false, tint: 'bg-red-500/15 text-red-300' },
    { name: 'World traveler', desc: 'Speak with 10 partners', Icon: IconUsers, unlocked: false, progress: 3, target: 10, tint: 'bg-teal-500/15 text-teal-300' }
  ],
  Mastery: [
    { name: 'Bronze league', desc: 'Reach Bronze', Icon: IconMedal, unlocked: true, tint: 'bg-amber-700/30 text-amber-300' },
    { name: 'Silver league', desc: 'Reach Silver', Icon: IconMedal, unlocked: true, tint: 'bg-slate-300/20 text-slate-200' },
    { name: 'Gold league', desc: 'Reach Gold', Icon: IconMedal, unlocked: false, tint: 'bg-amber-400/20 text-amber-200' },
    { name: 'Diamond league', desc: 'Reach Diamond', Icon: IconTrophy, unlocked: false, tint: 'bg-cyan-300/20 text-cyan-200' }
  ]
}

type Cat = string

function BadgeCard({ b }: { b: Badge }): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 flex flex-col items-center text-center gap-2 transition',
        b.unlocked
          ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
          : 'border-white/[0.05] bg-white/[0.015] opacity-60'
      )}
    >
      <span className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', b.tint)}>
        <b.Icon className="w-7 h-7" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white leading-tight">{b.name}</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{b.desc}</p>
      </div>
      {!b.unlocked && b.target != null && (
        <div className="w-full">
          <ProgressBar value={Math.round(((b.progress ?? 0) / b.target) * 100)} color="brand" />
          <p className="text-[10px] text-slate-500 mt-1">{b.progress}/{b.target}</p>
        </div>
      )}
      {b.unlocked && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          ✓ Unlocked
        </span>
      )}
    </div>
  )
}

export default function AchievementsPage(): JSX.Element {
  const cats = Object.keys(CATEGORIES) as Cat[]
  const [filter, setFilter] = useState<Cat | 'All'>('All')

  const unlocked = cats.flatMap((c) => CATEGORIES[c]).filter((b) => b.unlocked).length
  const total = cats.flatMap((c) => CATEGORIES[c]).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        <PageHeader
          title="Achievements"
          subtitle={`${unlocked} of ${total} badges unlocked`}
          back="/progress"
          crumbs={[{ label: 'Progress', to: '/progress' }, { label: 'Achievements' }]}
        />

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {(['All', ...cats] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition border',
                filter === c
                  ? 'bg-brand-500/20 border-brand-400/40 text-brand-100'
                  : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.07]'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {(filter === 'All' ? cats : [filter]).map((c) => (
          <div key={c}>
            <SectionHeading
              title={c}
              subtitle={`${CATEGORIES[c].filter((b) => b.unlocked).length} / ${CATEGORIES[c].length} unlocked`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORIES[c].map((b) => <BadgeCard key={b.name} b={b} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
