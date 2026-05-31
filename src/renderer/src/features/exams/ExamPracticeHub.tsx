import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExamAttempt } from '@shared/types'
import { cn } from '../../lib/classnames'
import { PageHeader, StatCard, Tabs, type TabItem } from '../../components/ui'
import { backend } from '../../services/backend'
import { useBackendQuery } from '../../services/backend/useBackend'
import { BANKS, type ExamSection } from './banks'
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconHeadphones,
  IconMic,
  IconPencilEdit,
  IconPlay,
  IconStar,
  type IconProps
} from '../../components/icons'

type ExamId = 'ielts' | 'toefl'
type SkillTab = 'listening' | 'reading' | 'writing' | 'speaking'
type Tab = 'tests' | SkillTab | 'vocab'

const TABS: TabItem<Tab>[] = [
  { id: 'tests', label: 'Full tests' },
  { id: 'listening', label: 'Listening' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'speaking', label: 'Speaking' },
  { id: 'vocab', label: 'Vocabulary' }
]

const SKILL_ICON: Record<SkillTab, (p: IconProps) => JSX.Element> = {
  listening: IconHeadphones,
  reading: IconBook,
  writing: IconPencilEdit,
  speaking: IconMic
}

const SCALE: Record<ExamId, string> = {
  ielts: 'Band 0–9',
  toefl: 'Score 0–120'
}

/** Format a stored numeric score back into the exam family's display scale. */
function fmtScore(examId: ExamId, numeric: number): string {
  return examId === 'ielts' ? numeric.toFixed(1) : String(Math.round(numeric))
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

/** One-line meta for a section practice row. */
function sectionMeta(section: ExamSection): string {
  if (section.kind === 'mcq') return `${section.items.length} questions · ${section.minutes} min`
  return `AI examiner · ${section.minutes} min`
}

export default function ExamPracticeHub({ examId }: { examId: ExamId }): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('tests')
  const bank = BANKS[examId]
  const mock = `/exams/${examId}/mock`

  // Real attempt history for this exam, persisted by the mock engine.
  const { data: attempts } = useBackendQuery(
    () => backend.listExamAttempts(backend.currentUserId() ?? 'u_local', examId),
    [examId],
    []
  )
  const sorted: ExamAttempt[] = [...attempts].sort((a, b) => b.takenAt.localeCompare(a.takenAt))

  // Stats derived from real attempts.
  const taken = attempts.length
  const best = taken ? fmtScore(examId, Math.max(...attempts.map((a) => a.overall))) : '—'
  const studyTime = fmtStudyTime(attempts.reduce((sum, a) => sum + (a.durationMin ?? 0), 0))

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        <PageHeader
          eyebrow={`${bank.title} · Practice`}
          title={`${bank.title} practice`}
          subtitle={`Full mock tests and skill-by-skill practice with an AI examiner — ${SCALE[examId]}.`}
          back="/exams"
          crumbs={[{ label: 'Exams', to: '/exams' }, { label: bank.title }]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500">Free practice from</span>
          {['British Council', 'IDP', 'Cambridge', 'Recent actual'].map((p) => (
            <span key={p} className="text-[11px] font-medium rounded-full bg-white/[0.05] border border-white/10 px-2.5 py-1 text-slate-300">{p}</span>
          ))}
        </div>

        {/* Stats — real values from the user's attempt history */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={best} label="Best score" tone="brand" />
          <StatCard value={String(taken)} label="Tests taken" tone="emerald" />
          <StatCard value={studyTime} label="Study time" tone="amber" />
          <StatCard value="AI" label="Examiner feedback" tone="violet" />
        </div>

        {/* Start full mock */}
        <button onClick={() => navigate(mock)} className="rounded-card bg-grad-brand text-white p-5 flex items-center gap-4 text-left shadow-glow-sm">
          <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><IconPlay className="w-6 h-6" /></span>
          <div className="flex-1">
            <p className="text-base font-bold">Take a full mock test</p>
            <p className="text-sm text-white/80">{bank.sections.length} sections · timed · band-score result with feedback</p>
          </div>
          <IconArrowRight className="w-5 h-5" />
        </button>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {/* Full tests — the real mock + your attempt history */}
        {tab === 'tests' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Your attempts</p>
            {sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400">
                No attempts yet. Take the full mock above and your scored result appears here.
              </div>
            ) : (
              sorted.map((a) => (
                <button key={a.id} onClick={() => navigate(mock)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                  <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconBook className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{bank.title}</p>
                    <p className="text-xs text-slate-500">{fmtDate(a.takenAt)}{a.durationMin ? ` · ${a.durationMin} min` : ''}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-300 shrink-0">{fmtScore(examId, a.overall)}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Skill practice — runs the matching section of the real bank as focused practice */}
        {(['listening', 'reading', 'writing', 'speaking'] as const).map((skill) => {
          if (tab !== skill) return null
          const section = bank.sections.find((s) => s.id === skill)
          const Icon = SKILL_ICON[skill]
          return (
            <div key={skill} className="flex flex-col gap-2">
              {(skill === 'writing' || skill === 'speaking') && (
                <div className="rounded-xl bg-brand-500/10 border border-brand-400/20 px-4 py-2.5 text-xs text-brand-200 inline-flex items-center gap-2">
                  <IconBolt className="w-4 h-4" /> Graded by the AI examiner — band + criterion feedback in under a minute.
                </div>
              )}
              {section ? (
                <button onClick={() => navigate(`${mock}?section=${skill}`)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                  <span className="w-10 h-10 rounded-xl bg-white/[0.06] text-slate-300 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{section.label} practice</p>
                    <p className="text-xs text-slate-500">{sectionMeta(section)}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-300 shrink-0">Practice →</span>
                </button>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400">
                  No {skill} section in this exam.
                </div>
              )}
            </div>
          )
        })}

        {tab === 'vocab' && (
          <button onClick={() => navigate('/vocabulary')} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4 text-left hover:bg-white/[0.06] transition">
            <span className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><IconStar className="w-5 h-5" /></span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{bank.title} vocabulary</p>
              <p className="text-xs text-slate-400">Academic word list + spaced-repetition review</p>
            </div>
            <IconArrowRight className="w-5 h-5 text-brand-300" />
          </button>
        )}
      </div>
    </div>
  )
}
