import { useMemo, useState } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import { iconByName } from '../../lib/iconByName'
import { useAchievements, type AchievementView } from '../../services/progress'

type Cat = string

function BadgeCard({ b }: { b: AchievementView }): JSX.Element {
  const Icon = iconByName(b.icon)
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
        <Icon className="w-7 h-7" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white leading-tight">{b.name}</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{b.desc}</p>
      </div>
      {!b.unlocked && b.target != null && b.target > 1 && (
        <div className="w-full">
          <ProgressBar value={Math.round((b.progress / b.target) * 100)} color="brand" />
          <p className="text-[10px] text-slate-500 mt-1">
            {b.progress.toLocaleString()}/{b.target.toLocaleString()}
          </p>
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
  const achievements = useAchievements()
  const [filter, setFilter] = useState<Cat | 'All'>('All')

  const byCat = useMemo(() => {
    const map: Record<string, AchievementView[]> = {}
    for (const a of achievements) {
      ;(map[a.category] ??= []).push(a)
    }
    return map
  }, [achievements])

  const cats = Object.keys(byCat)
  const unlocked = achievements.filter((b) => b.unlocked).length
  const total = achievements.length

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
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
              subtitle={`${byCat[c].filter((b) => b.unlocked).length} / ${byCat[c].length} unlocked`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {byCat[c].map((b) => (
                <BadgeCard key={b.id} b={b} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
