import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, Tabs, type TabItem } from '../../components/ui'
import { IconBolt, IconFlame, IconTrophy } from '../../components/icons'

type Scope = 'global' | 'friends'
type League = 'Bronze' | 'Silver' | 'Gold' | 'Sapphire' | 'Ruby' | 'Diamond'

const SCOPES: TabItem<Scope>[] = [
  { id: 'global', label: 'Global' },
  { id: 'friends', label: 'Friends' }
]

const LEAGUES: { name: League; tint: string; rank: string }[] = [
  { name: 'Bronze', tint: 'from-amber-700 to-amber-900', rank: 'Top 30%' },
  { name: 'Silver', tint: 'from-slate-400 to-slate-600', rank: 'Top 20%' },
  { name: 'Gold', tint: 'from-amber-400 to-amber-600', rank: 'Top 10%' },
  { name: 'Sapphire', tint: 'from-blue-400 to-blue-700', rank: 'Top 5%' },
  { name: 'Ruby', tint: 'from-rose-400 to-rose-700', rank: 'Top 2%' },
  { name: 'Diamond', tint: 'from-sky-300 to-violet-500', rank: 'Top 0.5%' }
]

const ROW: { rank: number; name: string; xp: number; streak: number; me?: boolean }[] = [
  { rank: 1, name: 'Sasha K.', xp: 3420, streak: 42 },
  { rank: 2, name: 'Wei Lin', xp: 3105, streak: 21 },
  { rank: 3, name: 'Marco B.', xp: 2880, streak: 18 },
  { rank: 4, name: 'Priya S.', xp: 2610, streak: 30 },
  { rank: 5, name: 'Aziz', xp: 2410, streak: 7, me: true },
  { rank: 6, name: 'Emma W.', xp: 2200, streak: 14 },
  { rank: 7, name: 'James L.', xp: 1980, streak: 9 },
  { rank: 8, name: 'Yui T.', xp: 1740, streak: 12 },
  { rank: 9, name: 'Liam O.', xp: 1620, streak: 4 },
  { rank: 10, name: 'Nadia R.', xp: 1455, streak: 11 }
]

function MedalBadge({ rank }: { rank: number }): JSX.Element {
  const tone =
    rank === 1
      ? 'bg-amber-500/20 text-amber-300 ring-amber-400/30'
      : rank === 2
        ? 'bg-slate-300/15 text-slate-200 ring-slate-300/30'
        : rank === 3
          ? 'bg-orange-500/20 text-orange-300 ring-orange-400/30'
          : 'bg-white/5 text-slate-300 ring-white/10'
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-full ring-1 text-xs font-bold',
        tone
      )}
    >
      {rank}
    </span>
  )
}

export default function LeaderboardPage(): JSX.Element {
  const [scope, setScope] = useState<Scope>('global')
  const currentLeague = LEAGUES[3] // Sapphire — demo

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        <PageHeader
          title="Leaderboard"
          subtitle="Weekly XP race — resets Sunday at midnight."
          back="/progress"
          crumbs={[{ label: 'Progress', to: '/progress' }, { label: 'Leaderboard' }]}
          action={
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Resets in</p>
              <p className="text-sm font-bold text-white">2d 14h</p>
            </div>
          }
        />

        {/* Your league */}
        <div className={cn('rounded-card border border-white/10 p-5 bg-gradient-to-br', currentLeague.tint)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/70">Your league</p>
              <h2 className="text-2xl font-bold text-white">{currentLeague.name}</h2>
              <p className="text-xs text-white/80 mt-1">{currentLeague.rank} this week · keep going to promote</p>
            </div>
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/30">
              <IconTrophy className="w-7 h-7 text-white" />
            </span>
          </div>
        </div>

        {/* League ladder */}
        <div>
          <p className="section-title px-1">All leagues</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {LEAGUES.map((l, i) => {
              const active = l.name === currentLeague.name
              return (
                <div
                  key={l.name}
                  className={cn(
                    'rounded-xl p-2.5 flex flex-col items-center gap-1.5 ring-1 transition',
                    active ? 'ring-brand-400/60 bg-white/[0.06]' : 'ring-white/10 bg-white/[0.025] opacity-70'
                  )}
                >
                  <span className={cn('w-9 h-9 rounded-full bg-gradient-to-br ring-1 ring-white/15', l.tint)} />
                  <span className="text-[11px] font-bold text-white">{l.name}</span>
                  <span className="text-[10px] text-slate-500">Lv {i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Tabs items={SCOPES} active={scope} onChange={setScope} className="self-start" />

        {/* Ranking */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
          {ROW.map((r) => (
            <div
              key={r.rank}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition',
                r.me ? 'bg-brand-500/10 ring-1 ring-brand-400/30' : 'hover:bg-white/[0.03]'
              )}
            >
              <MedalBadge rank={r.rank} />
              <AvatarCircle name={r.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {r.name} {r.me && <span className="text-[10px] text-brand-300 font-bold ml-1">YOU</span>}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-amber-300"><IconFlame className="w-3 h-3" /> {r.streak}d</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-200">
                <IconBolt className="w-3.5 h-3.5 text-brand-300" /> {r.xp.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center">
          Top 3 each week promote · bottom 3 demote · stay top 30% to keep your league
        </p>
      </div>
    </div>
  )
}
