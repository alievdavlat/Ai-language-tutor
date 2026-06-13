import { useEffect, useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, Tabs, type TabItem } from '../../components/ui'
import { IconBolt, IconFlame, IconTrophy } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { LEAGUES, buildLeaderboardReal, useStats, useProgressStore, weekKey, nextWeekStart, type LeaderRow } from '../../services/progress'
import { useT } from '../../i18n'

type Scope = 'global' | 'friends'

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
    <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full ring-1 text-xs font-bold', tone)}>
      {rank}
    </span>
  )
}

/** Time until the real reset — next Monday 00:00, matching the weekKey boundary (#B6). */
function resetCountdown(): string {
  const now = new Date()
  const ms = nextWeekStart(now).getTime() - now.getTime()
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  return `${d}d ${h}h`
}

export default function LeaderboardPage(): JSX.Element {
  const t = useT()
  const SCOPES: TabItem<Scope>[] = [
    { id: 'global', label: t('gamification.global') },
    { id: 'friends', label: t('gamification.friends') }
  ]
  const [scope, setScope] = useState<Scope>('global')
  const profile = useAppStore((s) => s.profile)
  const stats = useStats()

  const meName = profile?.name?.trim() || 'You'
  // #B6 — league is a STORED tier that moves by weekly rank, not lifetime XP.
  const leagueIdx = useProgressStore((s) => s.league)
  const noteWeeklyStanding = useProgressStore((s) => s.noteWeeklyStanding)
  const currentLeague = LEAGUES[Math.min(leagueIdx, LEAGUES.length - 1)]
  const [rows, setRows] = useState<LeaderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void buildLeaderboardReal(meName, stats.weekXp, stats.streak, scope).then((r) => {
      if (!cancelled) {
        setRows(r)
        setLoading(false)
        // Report this week's standing (global scope only) so the store can
        // settle promotion/demotion when the week rolls over.
        if (scope === 'global') {
          const mine = r.find((x) => x.me)
          if (mine) noteWeeklyStanding(weekKey(new Date()), mine.rank, r.length)
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [meName, stats.weekXp, stats.streak, scope, noteWeeklyStanding])

  const myRank = rows.find((r) => r.me)?.rank ?? rows.length

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          title={t('progress.leaderboard')}
          subtitle={t('gamification.leaderboardSubtitle')}
          back="/progress"
          crumbs={[{ label: t('nav.progress'), to: '/progress' }, { label: t('progress.leaderboard') }]}
          action={
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">{t('gamification.resetsIn')}</p>
              <p className="text-sm font-bold text-white">{resetCountdown()}</p>
            </div>
          }
        />

        {/* Your league */}
        <div className={cn('rounded-card border border-white/10 p-5 bg-gradient-to-br', currentLeague.tint)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/70">{t('gamification.yourLeague')}</p>
              <h2 className="text-2xl font-bold text-white">{currentLeague.id}</h2>
              <p className="text-xs text-white/80 mt-1">
                {t('gamification.rankLine', { rank: myRank, xp: stats.weekXp.toLocaleString() })}
              </p>
            </div>
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/30">
              <IconTrophy className="w-7 h-7 text-white" />
            </span>
          </div>
        </div>

        {/* League ladder */}
        <div>
          <p className="section-title px-1">{t('gamification.allLeagues')}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {LEAGUES.map((l, i) => {
              const active = l.id === currentLeague.id
              return (
                <div
                  key={l.id}
                  className={cn(
                    'rounded-xl p-2.5 flex flex-col items-center gap-1.5 ring-1 transition',
                    active ? 'ring-brand-400/60 bg-white/[0.06]' : 'ring-white/10 bg-white/[0.025] opacity-70'
                  )}
                  title={`${l.rank} · ${l.minXp.toLocaleString()}+ XP`}
                >
                  <span className={cn('w-9 h-9 rounded-full bg-gradient-to-br ring-1 ring-white/15', l.tint)} />
                  <span className="text-[11px] font-bold text-white">{l.id}</span>
                  <span className="text-[10px] text-slate-500">Lv {i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Tabs items={SCOPES} active={scope} onChange={setScope} className="self-start" />

        {/* Ranking */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
          {loading && rows.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">{t('gamification.loadingRankings')}</p>
          )}
          {!loading && rows.length <= 1 && scope === 'friends' && (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">
              {t('gamification.friendsEmpty')}
            </p>
          )}
          {rows.map((r) => (
            <div
              key={`${r.rank}-${r.name}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition',
                r.me ? 'bg-brand-500/10 ring-1 ring-brand-400/30' : 'hover:bg-white/[0.03]'
              )}
            >
              <MedalBadge rank={r.rank} />
              <AvatarCircle name={r.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {r.country && <span className="mr-1">{r.country}</span>}
                  {r.name} {r.me && <span className="text-[10px] text-brand-300 font-bold ml-1 uppercase">{t('common.you')}</span>}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <IconFlame className="w-3 h-3" /> {r.streak}d
                  </span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-200">
                <IconBolt className="w-3.5 h-3.5 text-brand-300" /> {r.xp.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center">
          {t('gamification.promoteRule')}
        </p>
      </div>
    </div>
  )
}
