import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import { IconBolt, IconCheck } from '../../components/icons'
import { iconByName } from '../../lib/iconByName'
import { useQuests, useStats, type QuestView } from '../../services/progress'
import { useT } from '../../i18n'

function QuestRow({ q, onClaim }: { q: QuestView; onClaim: () => void }): JSX.Element {
  const t = useT()
  const pct = Math.min(100, Math.round((q.progress / q.target) * 100))
  const Icon = iconByName(q.icon)
  const claimable = q.done && !q.claimed
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 flex items-center gap-4 transition',
        q.claimed
          ? 'border-white/10 bg-white/[0.02] opacity-70'
          : claimable
            ? 'border-amber-400/40 bg-amber-500/[0.07]'
            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
      )}
    >
      <span className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', q.tint)}>
        <Icon className="w-6 h-6" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">{q.title}</p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-200 shrink-0">
            <IconBolt className="w-3.5 h-3.5 text-amber-300" /> +{q.reward}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1">
            <ProgressBar value={pct} color={q.done ? 'green' : 'brand'} />
          </div>
          {q.claimed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 shrink-0">
              <IconCheck className="w-3.5 h-3.5" /> {t('gamification.claimed')}
            </span>
          ) : claimable ? (
            <button
              onClick={onClaim}
              className="rounded-pill bg-amber-500/90 hover:bg-amber-400 text-black text-[11px] font-bold px-3 py-1 shrink-0 transition"
            >
              {t('gamification.claim')} +{q.reward}
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">
              {q.progress}/{q.target} {q.unit}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QuestsPage(): JSX.Element {
  const t = useT()
  const { quests, claim } = useQuests()
  const stats = useStats()

  const daily = quests.filter((q) => q.scope === 'daily')
  const weekly = quests.filter((q) => q.scope === 'weekly')
  const monthly = quests.filter((q) => q.scope === 'monthly')

  const weeklyDone = weekly.filter((q) => q.done).length
  const chestPct = Math.round((weeklyDone / weekly.length) * 100)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          title={t('progress.quests')}
          subtitle={t('gamification.questsSubtitle')}
          back="/home"
          crumbs={[{ label: t('nav.home'), to: '/home' }, { label: t('progress.quests') }]}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-200 text-xs font-bold px-3 py-1.5">
              <IconBolt className="w-3.5 h-3.5" /> {stats.totalXp.toLocaleString()} XP
            </span>
          }
        />

        {/* Weekly chest */}
        <div className="rounded-card p-5 bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-400/20 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/30 flex items-center justify-center text-3xl">
            {chestPct >= 100 ? '🎁' : '📦'}
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-amber-200/80 font-bold">{t('gamification.weeklyChest')}</p>
            <h3 className="text-base font-bold text-white">
              {t('gamification.completeWeekly', { n: weekly.length, total: weekly.length })}
            </h3>
            <ProgressBar value={chestPct} color="amber" className="mt-2" />
          </div>
          <span className="text-xs font-bold text-amber-200 shrink-0">
            {weeklyDone}/{weekly.length}
          </span>
        </div>

        <div>
          <SectionHeading title={t('gamification.today')} subtitle={t('gamification.resetsMidnight')} />
          <div className="flex flex-col gap-2.5">
            {daily.map((q) => (
              <QuestRow key={q.id} q={q} onClaim={() => claim(q.claimKey, q.reward)} />
            ))}
          </div>
        </div>

        <div>
          <SectionHeading title={t('progress.thisWeek')} subtitle={t('gamification.resetsSunday')} />
          <div className="flex flex-col gap-2.5">
            {weekly.map((q) => (
              <QuestRow key={q.id} q={q} onClaim={() => claim(q.claimKey, q.reward)} />
            ))}
          </div>
        </div>

        <div>
          <SectionHeading title={t('gamification.longTerm')} subtitle={t('gamification.bigRewards')} />
          <div className="flex flex-col gap-2.5">
            {monthly.map((q) => (
              <QuestRow key={q.id} q={q} onClaim={() => claim(q.claimKey, q.reward)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
