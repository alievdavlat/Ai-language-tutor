import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/classnames'
import { IconBolt, IconCheck } from '../../../components/icons'
import { useQuests, type QuestView } from '../../../services/progress'

function QuestRow({ q }: { q: QuestView }): JSX.Element {
  const done = q.done
  const pct = Math.min(100, (q.progress / q.target) * 100)
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-slate-500'
        )}
      >
        {done ? <IconCheck className="w-4 h-4" /> : <IconBolt className="w-3.5 h-3.5" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-medium truncate', done ? 'text-slate-400 line-through' : 'text-slate-200')}>
            {q.title}
          </span>
          <span className="text-[10px] font-bold text-amber-300 shrink-0 ml-2">+{q.reward}</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-1.5">
          <div
            className={cn('h-full rounded-full', done ? 'bg-emerald-400' : 'bg-brand-500')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function DailyQuestCard(): JSX.Element {
  const navigate = useNavigate()
  const { quests } = useQuests()
  const daily = quests.filter((q) => q.scope === 'daily')
  const claimable = daily.filter((q) => q.done && !q.claimed).reduce((a, q) => a + q.reward, 0)

  return (
    <button
      onClick={() => navigate('/quests')}
      className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5 text-left transition hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Daily quests</p>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 rounded-full px-2 py-0.5">
          <IconBolt className="w-3 h-3" /> {claimable > 0 ? `+${claimable} ready` : `${daily.filter((q) => q.done).length}/${daily.length}`}
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        {daily.map((q) => (
          <QuestRow key={q.id} q={q} />
        ))}
      </div>
    </button>
  )
}
