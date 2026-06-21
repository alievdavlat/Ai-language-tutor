import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ExamAttempt } from '@shared/types'
import { cn } from '../../lib/classnames'
import { PageHeader, StatCard, Tabs, type TabItem } from '../../components/ui'
import { backend } from '../../services/backend'
import { useBackendQuery } from '../../services/backend/useBackend'
import { useAppStore } from '../../store/useAppStore'
import { exams } from '../../services/exams/store'
import { BANKS, type ExamSection } from './banks'
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconChart,
  IconClipboard,
  IconHeadphones,
  IconMic,
  IconPencilEdit,
  IconPlay,
  IconStar,
  IconTrophy,
  type IconProps
} from '../../components/icons'

type ExamId = 'ielts' | 'toefl'
type SkillTab = 'listening' | 'reading' | 'writing' | 'speaking'
type Tab = 'tests' | 'library' | SkillTab | 'vocab'

const TABS: TabItem<Tab>[] = [
  { id: 'tests', label: 'Full tests' },
  { id: 'library', label: 'Test library' },
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

function sectionMeta(section: ExamSection): string {
  if (section.kind === 'mcq') return `${section.items.length} questions · ${section.minutes} min`
  return `AI examiner · ${section.minutes} min`
}

export default function ExamPracticeHub({ examId }: { examId: ExamId }): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Deep-link a tab from the study plan (e.g. ?skill=reading).
  const skillParam = params.get('skill') as Tab | null
  const initialTab: Tab = skillParam && TABS.some((t) => t.id === skillParam) ? skillParam : 'tests'
  const [tab, setTab] = useState<Tab>(initialTab)
  // Section / exam-mode toggle: exam = timed, hold feedback; practice = reveal
  // answers + explanations inline. Carried into the engine via ?mode=.
  const [mode, setMode] = useState<'exam' | 'practice'>('exam')
  const bank = BANKS[examId]
  // Surface the weak areas the placement test found — previously saved to the
  // profile and never shown anywhere.
  const weakAreas = useAppStore((s) => s.profile?.weakAreas ?? [])

  // Append the current mode to a run route.
  const withMode = (base: string): string => {
    if (mode !== 'practice') return base
    return base.includes('?') ? `${base}&mode=practice` : `${base}?mode=practice`
  }
  const mock = `/exams/${examId}/mock`

  // Every test for this family (canonical + authored library + community).
  const familyTests = exams.byFamily(examId)

  // Real attempt history for this exam.
  const { data: attempts } = useBackendQuery(
    () => backend.listExamAttempts(backend.currentUserId() ?? 'u_local', examId),
    [examId],
    []
  )
  const sorted: ExamAttempt[] = [...attempts].sort((a, b) => b.takenAt.localeCompare(a.takenAt))

  const taken = attempts.length
  const best = taken ? fmtScore(examId, Math.max(...attempts.map((a) => a.overall))) : '—'
  const studyTime = fmtStudyTime(attempts.reduce((sum, a) => sum + (a.durationMin ?? 0), 0))

  // Resolve a stored test to its run route (canonical id has a dedicated mock route).
  const runRoute = (id: string): string => (id === examId ? mock : `/exams/run/${id}`)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow={`${bank.title} · Practice`}
          title={`${bank.title} practice`}
          subtitle={`Full mock tests and skill-by-skill practice with an AI examiner — ${SCALE[examId]}.`}
          back="/exams"
          crumbs={[{ label: 'Exams', to: '/exams' }, { label: bank.title }]}
          action={
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/exams/dashboard')} className="btn-ghost px-3 py-2 text-sm inline-flex items-center gap-1.5"><IconChart className="w-4 h-4" /> Progress</button>
              <button onClick={() => navigate('/exams/leaderboard')} className="btn-ghost px-3 py-2 text-sm inline-flex items-center gap-1.5"><IconTrophy className="w-4 h-4" /> Leaderboard</button>
            </div>
          }
        />
        {/* Stats — real values from the user's attempt history */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={best} label="Best score" tone="brand" />
          <StatCard value={String(taken)} label="Tests taken" tone="emerald" />
          <StatCard value={studyTime} label="Study time" tone="amber" />
          <StatCard value="AI" label="Examiner feedback" tone="violet" />
        </div>

        {/* Focus areas — the weak spots the level test identified */}
        {weakAreas.length > 0 && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3">
            <p className="text-[11px] uppercase tracking-widest text-amber-300/80 font-semibold mb-1.5">
              Focus areas — from your level test
            </p>
            <div className="flex flex-wrap gap-2">
              {weakAreas.map((a) => (
                <span key={a} className="text-xs rounded-full bg-amber-500/15 text-amber-200 px-2.5 py-1 capitalize">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Section / exam-mode toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(['exam', 'practice'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn('px-4 py-1.5 rounded-lg text-sm font-semibold transition', mode === m ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white')}
              >
                {m === 'exam' ? 'Exam mode' : 'Practice mode'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {mode === 'exam' ? 'Timed; results held until the end.' : 'Relaxed; answers & explanations revealed as you go.'}
          </p>
        </div>

        {/* Start full mock */}
        <button onClick={() => navigate(withMode(mock))} className="rounded-card bg-grad-brand text-white p-5 flex items-center gap-4 text-left shadow-glow-sm">
          <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><IconPlay className="w-6 h-6" /></span>
          <div className="flex-1">
            <p className="text-base font-bold">Take a full mock test</p>
            <p className="text-sm text-white/80">{bank.sections.length} sections · {mode === 'exam' ? 'timed' : 'practice'} · band-score result with feedback</p>
          </div>
          <IconArrowRight className="w-5 h-5" />
        </button>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {/* Full tests — your attempt history */}
        {tab === 'tests' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Your attempts</p>
            {sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400">
                No attempts yet. Take the full mock above and your scored result appears here.
              </div>
            ) : (
              sorted.map((a) => (
                <button key={a.id} onClick={() => navigate(withMode(mock))} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                  <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconClipboard className="w-5 h-5" /></span>
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

        {/* Test library — every test variant for this family */}
        {tab === 'library' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">{familyTests.length} test{familyTests.length === 1 ? '' : 's'} available</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {familyTests.map((t) => (
                <button key={t.id} onClick={() => navigate(withMode(runRoute(t.id)))} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white truncate">{t.title}</p>
                    {t.featured && <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 rounded-full px-2 py-0.5 shrink-0">Featured</span>}
                    {!t.builtIn && <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 rounded-full px-2 py-0.5 shrink-0">Community</span>}
                  </div>
                  {t.blurb && <p className="text-[11px] text-slate-400">{t.blurb}</p>}
                  <p className="text-[11px] text-slate-500">{t.sections.length} sections{t.band ? ` · ${t.band}` : ''}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skill practice — runs the matching section as focused practice */}
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
                <button onClick={() => navigate(withMode(`${mock}?section=${skill}`))} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
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
