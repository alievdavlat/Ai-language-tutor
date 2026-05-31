import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExamKind } from '@shared/types'
import { cn } from '../../lib/classnames'
import { PageHeader, Tabs, type TabItem } from '../../components/ui'
import { useBackendQuery } from '../../services/backend/useBackend'
import { examLeaderboard, type LeaderboardEntry } from '../../services/exams/leaderboard'
import { IconMedal, IconTrophy } from '../../components/icons'

const FAMILIES: TabItem<ExamKind>[] = [
  { id: 'ielts', label: 'IELTS' },
  { id: 'toefl', label: 'TOEFL' },
  { id: 'cefr', label: 'CEFR' },
  { id: 'sat', label: 'SAT' },
  { id: 'gmat', label: 'GMAT' }
]

const RANK_TONE = ['text-amber-300', 'text-slate-300', 'text-orange-300']

export default function ExamLeaderboardPage(): JSX.Element {
  const navigate = useNavigate()
  const [family, setFamily] = useState<ExamKind>('ielts')
  const { data: rows, loading } = useBackendQuery<LeaderboardEntry[]>(
    () => examLeaderboard(family),
    [family],
    []
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Exams · Leaderboard"
          title="Exam leaderboard"
          subtitle="Top scores from learners who've sat each test. Climb by beating your best."
          back="/exams"
          crumbs={[{ label: 'Exams', to: '/exams' }, { label: 'Leaderboard' }]}
          action={
            <button onClick={() => navigate('/exams/dashboard')} className="btn-ghost px-4 py-2 text-sm">My progress</button>
          }
        />

        <Tabs items={FAMILIES} active={family} onChange={setFamily} className="self-start" />

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-400">Loading rankings…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-card border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <span className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center mx-auto mb-3"><IconTrophy className="w-6 h-6" /></span>
            <p className="text-base font-bold text-white">No scores yet</p>
            <p className="text-sm text-slate-400 mt-1">Be the first on the board — take a full {FAMILIES.find((f) => f.id === family)?.label} mock.</p>
            <button onClick={() => navigate(family === 'ielts' || family === 'toefl' ? `/exams/${family}` : '/exams')} className="btn-primary mt-4 px-6 py-2">Take a mock</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <div
                key={r.userId}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3',
                  r.isMe ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/[0.07] bg-white/[0.03]'
                )}
              >
                <span className={cn('w-8 text-center font-bold tabular-nums', RANK_TONE[r.rank - 1] ?? 'text-slate-500')}>
                  {r.rank <= 3 ? <IconMedal className={cn('w-5 h-5 mx-auto', RANK_TONE[r.rank - 1])} /> : r.rank}
                </span>
                <span className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-base shrink-0">{r.avatarEmoji ?? '🎓'}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', r.isMe ? 'text-brand-200' : 'text-white')}>{r.name}</p>
                  <p className="text-[11px] text-slate-500">{r.attempts} attempt{r.attempts === 1 ? '' : 's'}</p>
                </div>
                <span className="text-base font-bold text-amber-300 shrink-0">{r.display}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
