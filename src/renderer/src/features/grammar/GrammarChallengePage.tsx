import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar } from '../../components/ui'
import { IconCheck, IconLock } from '../../components/icons'
import { buildChallenge } from './curriculum'
import { getChallengeProgress, nextUnlockedDay } from '../../services/study/grammarProgress'

export default function GrammarChallengePage(): JSX.Element {
  const { topic } = useParams<{ topic: string }>()
  const navigate = useNavigate()
  const built = topic ? buildChallenge(topic) : undefined

  if (!built || !topic) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-6 w-full">
          <PageHeader eyebrow="Challenge" title="Challenge not found" back="/grammar" crumbs={[{ label: 'Grammar', to: '/grammar' }, { label: 'Challenge' }]} />
          <p className="text-sm text-slate-400 mt-4">That challenge doesn’t exist. Pick one from the Grammar page.</p>
        </div>
      </div>
    )
  }

  const progress = getChallengeProgress(topic)
  const completed = new Set(progress.completedDays)
  const unlocked = nextUnlockedDay(progress)
  const pct = Math.round((completed.size / 30) * 100)
  const todayDay = built.days.find((d) => d.day === Math.max(1, unlocked))

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="30-day challenge"
          title={`${built.unit.title} challenge`}
          subtitle="One short drill set each day. Affirmatives → negatives → questions → mixed review, on a 4-day cycle."
          back="/grammar"
          crumbs={[{ label: 'Grammar', to: '/grammar' }, { label: built.unit.title }]}
        />

        {/* Progress hero */}
        <div className="rounded-card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-brand-500/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-white">{completed.size}<span className="text-base text-slate-400 font-bold">/30 days</span></p>
              <p className="text-sm text-slate-300 mt-1">Keep your streak going — come back each day.</p>
            </div>
            {todayDay && (
              <button
                onClick={() => navigate(`/learn/exercise?challenge=${topic}&day=${todayDay.day}`)}
                className="btn-primary px-5 py-2.5 text-sm font-bold"
              >
                {completed.has(todayDay.day) ? `Replay day ${todayDay.day}` : `Start day ${unlocked} →`}
              </button>
            )}
          </div>
          <ProgressBar value={pct} color="amber" className="mt-4" />
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {built.days.map((d) => {
            const isDone = completed.has(d.day)
            const isUnlocked = d.day <= Math.max(1, unlocked) || isDone
            return (
              <button
                key={d.day}
                disabled={!isUnlocked}
                onClick={() => navigate(`/learn/exercise?challenge=${topic}&day=${d.day}`)}
                title={d.focus}
                className={cn(
                  'aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition',
                  isDone
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                    : isUnlocked
                      ? 'border-brand-400/50 bg-brand-500/10 text-white hover:bg-brand-500/20'
                      : 'border-white/10 bg-white/[0.03] text-slate-600 cursor-not-allowed'
                )}
              >
                {isDone ? <IconCheck className="w-4 h-4" /> : !isUnlocked ? <IconLock className="w-3.5 h-3.5" /> : <span className="text-sm font-black">{d.day}</span>}
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Day {d.day}</span>
              </button>
            )
          })}
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          One new day unlocks every 24 hours. Completed days stay replayable any time.
        </p>
      </div>
    </div>
  )
}
