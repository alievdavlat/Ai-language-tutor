import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExamAttempt, ExamKind } from '@shared/types'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, StatCard } from '../../components/ui'
import { backend } from '../../services/backend'
import { useBackendQuery } from '../../services/backend/useBackend'
import { currentUserId } from '../../services/study/useStudy'
import { useExamInsights } from '../../services/exams/insights'
import { buildStudyPlan, type PlanStep } from '../../services/exams/studyPlan'
import { fmtFamilyScore } from '../../services/exams/leaderboard'
import {
  IconArrowRight,
  IconChart,
  IconClipboard,
  IconTarget,
  IconTrophy
} from '../../components/icons'

const FAMILY_LABEL: Record<string, string> = {
  ielts: 'IELTS Academic',
  toefl: 'TOEFL iBT',
  cefr: 'CEFR placement',
  sat: 'SAT',
  gmat: 'GMAT',
  duolingo: 'Duolingo',
  custom: 'Custom test'
}

const PLAN_TONE: Record<PlanStep['tone'], string> = {
  brand: 'border-brand-400/30 bg-brand-500/10 text-brand-200',
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  violet: 'border-violet-400/30 bg-violet-500/10 text-violet-200'
}

function fmtStudyTime(totalMin: number): string {
  if (totalMin <= 0) return '0m'
  if (totalMin < 60) return `${totalMin}m`
  const h = totalMin / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  } catch {
    return iso.slice(0, 10)
  }
}

export default function ExamDashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const userId = currentUserId()
  const { data: attempts } = useBackendQuery(() => backend.listExamAttempts(userId), [userId], [] as ExamAttempt[])
  const { weak, all } = useExamInsights(userId)

  // Best score + count per family that the learner has actually attempted.
  const byFamily = useMemo(() => {
    const map = new Map<ExamKind, ExamAttempt[]>()
    attempts.forEach((a) => {
      const arr = map.get(a.kind) ?? []
      arr.push(a)
      map.set(a.kind, arr)
    })
    return [...map.entries()].map(([kind, list]) => ({
      kind,
      count: list.length,
      best: Math.max(...list.map((a) => a.overall)),
      display: fmtFamilyScore(kind, Math.max(...list.map((a) => a.overall)))
    }))
  }, [attempts])

  // Study plan targets the most-practised family (or IELTS as a sensible start).
  const planFamily: ExamKind = byFamily.length
    ? [...byFamily].sort((a, b) => b.count - a.count)[0].kind
    : 'ielts'
  const plan = useMemo(
    () => buildStudyPlan(planFamily, attempts.filter((a) => a.kind === planFamily), weak),
    [planFamily, attempts, weak]
  )

  const totalMin = attempts.reduce((s, a) => s + (a.durationMin ?? 0), 0)
  const sorted = [...attempts].sort((a, b) => b.takenAt.localeCompare(a.takenAt))

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-7">
        <PageHeader
          eyebrow="Exams · Progress"
          title="Your exam progress"
          subtitle="Scores, weak question types and a study plan built from your real attempts."
          back="/exams"
          crumbs={[{ label: 'Exams', to: '/exams' }, { label: 'Progress' }]}
          action={
            <button onClick={() => navigate('/exams/leaderboard')} className="btn-ghost px-4 py-2 text-sm inline-flex items-center gap-1.5">
              <IconTrophy className="w-4 h-4" /> Leaderboard
            </button>
          }
        />

        {/* Top-line stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={String(attempts.length)} label="Tests taken" tone="brand" />
          <StatCard value={String(byFamily.length)} label="Exam families" tone="emerald" />
          <StatCard value={fmtStudyTime(totalMin)} label="Study time" tone="amber" />
          <StatCard value={weak.length ? String(weak.length) : '—'} label="Weak areas" tone="violet" />
        </div>

        {attempts.length === 0 ? (
          <div className="rounded-card border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <span className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-300 flex items-center justify-center mx-auto mb-3"><IconChart className="w-6 h-6" /></span>
            <p className="text-base font-bold text-white">No scored attempts yet</p>
            <p className="text-sm text-slate-400 mt-1">Take a full mock and your progress, weak question types and study plan appear here.</p>
            <button onClick={() => navigate('/exams')} className="btn-primary mt-4 px-6 py-2">Browse tests</button>
          </div>
        ) : (
          <>
            {/* Best score per family */}
            <section>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Best score by exam</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {byFamily.map((f) => (
                  <button
                    key={f.kind}
                    onClick={() => navigate(f.kind === 'ielts' || f.kind === 'toefl' ? `/exams/${f.kind}` : '/exams')}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition"
                  >
                    <p className="text-xs text-slate-400">{FAMILY_LABEL[f.kind] ?? f.kind.toUpperCase()}</p>
                    <p className="text-2xl font-bold text-amber-300 mt-1">{f.display}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.count} attempt{f.count === 1 ? '' : 's'}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Weak question types */}
            <section>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Weak question types</p>
              {weak.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
                  {all.length === 0
                    ? 'Answer more multiple-choice questions to see which question types trip you up.'
                    : 'No clear weak spots yet — you’re above 80% on every tracked question type. Nice.'}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {weak.map((w) => (
                    <div key={w.qtype} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-white">{w.label}</span>
                        <span className={cn('font-bold', w.accuracy < 50 ? 'text-rose-300' : 'text-amber-300')}>{w.accuracy}%</span>
                      </div>
                      <ProgressBar value={w.accuracy} />
                      <p className="text-[11px] text-slate-500 mt-1.5">{w.correct}/{w.total} correct across your attempts</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Personalized study plan */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <IconTarget className="w-4 h-4 text-brand-300" />
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Your study plan · {FAMILY_LABEL[planFamily] ?? planFamily}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {plan.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => navigate(step.to)}
                    className={cn('rounded-2xl border p-4 text-left flex items-start gap-3 hover:brightness-110 transition', PLAN_TONE[step.tone])}
                  >
                    <span className="w-7 h-7 rounded-lg bg-black/20 text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{step.title}</p>
                      <p className="text-xs text-slate-300/90 mt-0.5">{step.reason}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold mt-2">{step.cta} <IconArrowRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent attempts */}
            <section>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Recent attempts</p>
              <div className="flex flex-col gap-2">
                {sorted.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                    <span className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconClipboard className="w-4 h-4" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{FAMILY_LABEL[a.kind] ?? a.kind.toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{fmtDate(a.takenAt)}{a.durationMin ? ` · ${a.durationMin} min` : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-300 shrink-0">{a.cefr ?? fmtFamilyScore(a.kind, a.overall)}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
