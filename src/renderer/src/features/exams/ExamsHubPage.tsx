import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { Rail, SectionHeading } from '../../components/ui'
import { useAppStore } from '../../store/useAppStore'
import { canAuthorContent } from '@shared/constants'
import { exams as examStore, useExams } from '../../services/exams/store'
import ExamEditor from './ExamEditor'
import { useTargetLanguage } from '../../lib/language'
import { getExamsForLanguage } from '../../lib/contentByLanguage'
import { backend } from '../../services/backend'
import { useBackendQuery } from '../../services/backend/useBackend'
import { useT } from '../../i18n'
import {
  IconArrowRight,
  IconBook,
  IconChart,
  IconChat,
  IconHeadphones,
  IconMic,
  IconPencilEdit,
  IconPlus,
  IconStar,
  IconTarget,
  IconTrophy,
  type IconProps
} from '../../components/icons'

/** Route a stored test to its runnable URL (canonical families have dedicated routes). */
function testRunRoute(id: string, kind: string): string {
  if (id === kind && (kind === 'ielts' || kind === 'toefl' || kind === 'cefr' || kind === 'sat' || kind === 'gmat')) {
    return `/exams/${kind}/mock`
  }
  return `/exams/run/${id}`
}

interface ExamDef {
  id: string
  title: string
  subtitle: string
  meta: string
  scale: string
  cover: string
  to: string
  soon?: boolean
  sections: { label: string; Icon: (p: IconProps) => JSX.Element }[]
}

const EXAMS: ExamDef[] = [
  {
    id: 'ielts',
    title: 'IELTS Academic',
    subtitle: 'Full mock with AI examiner',
    meta: '4 sections · ~2h 40m',
    scale: 'Band 0–9',
    cover: 'from-rose-600 to-red-800',
    to: '/exams/ielts',
    sections: [
      { label: 'Listening', Icon: IconHeadphones },
      { label: 'Reading', Icon: IconBook },
      { label: 'Writing', Icon: IconPencilEdit },
      { label: 'Speaking', Icon: IconMic }
    ]
  },
  {
    id: 'toefl',
    title: 'TOEFL iBT',
    subtitle: 'Full mock with AI examiner',
    meta: '4 sections · ~3h',
    scale: 'Score 0–120',
    cover: 'from-blue-600 to-indigo-800',
    to: '/exams/toefl',
    sections: [
      { label: 'Reading', Icon: IconBook },
      { label: 'Listening', Icon: IconHeadphones },
      { label: 'Speaking', Icon: IconMic },
      { label: 'Writing', Icon: IconPencilEdit }
    ]
  },
  {
    id: 'sat',
    title: 'SAT',
    subtitle: 'Reading, Writing & Math',
    meta: '2 sections · ~2h 14m',
    scale: 'Score 400–1600',
    cover: 'from-emerald-600 to-teal-800',
    to: '/exams/sat/mock',
    sections: [
      { label: 'Reading & Writing', Icon: IconBook },
      { label: 'Math', Icon: IconPencilEdit }
    ]
  },
  {
    id: 'gmat',
    title: 'GMAT',
    subtitle: 'Verbal & quantitative',
    meta: '2 sections · timed',
    scale: 'Score 200–800',
    cover: 'from-violet-600 to-purple-800',
    to: '/exams/gmat/mock',
    sections: [
      { label: 'Verbal', Icon: IconBook },
      { label: 'Quant', Icon: IconPencilEdit }
    ]
  }
]

function ExamCard({ exam }: { exam: ExamDef }): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col">
      <div className={cn('bg-gradient-to-br p-5', exam.cover)}>
        <p className="text-lg font-bold text-white">{exam.title}</p>
        <p className="text-xs text-white/75 mt-0.5">{exam.subtitle}</p>
        <div className="flex items-center gap-3 mt-3 text-[11px] text-white/80">
          <span>{exam.meta}</span>
          <span className="text-white/40">·</span>
          <span className="font-semibold">{exam.scale}</span>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="grid grid-cols-4 gap-2">
          {exam.sections.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 text-center">
              <span className="w-9 h-9 rounded-xl bg-white/[0.06] text-slate-300 flex items-center justify-center">
                <s.Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[10px] text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
        {exam.soon ? (
          <button disabled className="btn-ghost w-full py-2.5 mt-auto opacity-60 cursor-not-allowed">
            {t('common.comingSoon')}
          </button>
        ) : (
          <button onClick={() => navigate(exam.to)} className="btn-primary w-full py-2.5 mt-auto">
            {t('exams.startMock')} →
          </button>
        )}
      </div>
    </div>
  )
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  } catch {
    return iso.slice(0, 10)
  }
}

export default function ExamsHubPage(): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  const lang = useTargetLanguage()
  const role = useAppStore((s) => s.role)
  const canAuthor = canAuthorContent(role)
  const [editing, setEditing] = useState(false)
  const { list: allExams, refresh } = useExams()
  const customExams = allExams.filter((e) => !e.builtIn)
  const featured = examStore.featured()
  const langExams = getExamsForLanguage(lang.code)
  // Real recent attempts, persisted via the Foundation backend.
  const { data: attempts } = useBackendQuery(
    () => backend.listExamAttempts(backend.currentUserId() ?? 'u_local'),
    [],
    []
  )
  // Map our shared exam cards through the rich ExamDef shape — only show full
  // mocks for the ones we have real shells for (currently IELTS/TOEFL).
  const exams = EXAMS.filter((e) => e.id === 'sat' || e.id === 'gmat' || langExams.some((x) => x.id === e.id))
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} {t('exams.learning', { language: lang.name })}</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">{t('exams.examsAndTests')}</h1>
            <p className="text-sm text-slate-400 mt-1">
              {t('exams.hubSubtitle', { language: lang.name })}
            </p>
          </div>
          {canAuthor && (
            <button onClick={() => setEditing(true)} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-1.5 shrink-0"><IconPlus className="w-4 h-4" /> {t('exams.createExam')}</button>
          )}
        </div>

        {/* Quick actions — progress dashboard, leaderboard, AI examiner & partner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => navigate('/exams/dashboard')} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex flex-col gap-2">
            <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconChart className="w-5 h-5" /></span>
            <div>
              <p className="text-sm font-bold text-white">{t('exams.myProgress')}</p>
              <p className="text-[11px] text-slate-400">{t('exams.myProgressSub')}</p>
            </div>
          </button>
          <button onClick={() => navigate('/exams/leaderboard')} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex flex-col gap-2">
            <span className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><IconTrophy className="w-5 h-5" /></span>
            <div>
              <p className="text-sm font-bold text-white">{t('progress.leaderboard')}</p>
              <p className="text-[11px] text-slate-400">{t('exams.leaderboardSub')}</p>
            </div>
          </button>
          <button onClick={() => navigate('/exams/ielts?skill=writing')} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex flex-col gap-2">
            <span className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center"><IconPencilEdit className="w-5 h-5" /></span>
            <div>
              <p className="text-sm font-bold text-white">{t('exams.aiExaminer')}</p>
              <p className="text-[11px] text-slate-400">{t('exams.aiExaminerSub')}</p>
            </div>
          </button>
          <button onClick={() => navigate('/speaking')} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex flex-col gap-2">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><IconChat className="w-5 h-5" /></span>
            <div>
              <p className="text-sm font-bold text-white">{t('speaking.partner')}</p>
              <p className="text-[11px] text-slate-400">{t('exams.speakingPartnerSub')}</p>
            </div>
          </button>
        </div>

        {/* Featured tests rail */}
        {featured.length > 0 && (
          <Rail title={t('exams.featuredTests')}>
            {featured.map((ft) => (
              <button
                key={ft.id}
                onClick={() => navigate(testRunRoute(ft.id, ft.kind))}
                className="shrink-0 w-60 snap-start rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0"><IconStar className="w-4 h-4" /></span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">{t('exams.featured')}</span>
                </div>
                <p className="text-sm font-bold text-white leading-snug">{ft.title}</p>
                {ft.blurb && <p className="text-[11px] text-slate-400 line-clamp-2">{ft.blurb}</p>}
                <p className="text-[11px] text-slate-500 mt-auto">{ft.sections.length} sections{ft.band ? ` · ${ft.band}` : ''}</p>
              </button>
            ))}
          </Rail>
        )}

        {/* Recent results rail — quick resume of your latest attempts */}
        {attempts.length > 0 && (
          <Rail title={t('exams.continueRecent')}>
            {[...attempts].sort((a, b) => b.takenAt.localeCompare(a.takenAt)).slice(0, 8).map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.kind === 'ielts' || a.kind === 'toefl' ? `/exams/${a.kind}` : '/exams')}
                className="shrink-0 w-44 snap-start rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition"
              >
                <p className="text-sm font-bold text-white uppercase">{a.kind}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{fmtDate(a.takenAt)}</p>
                <p className="text-2xl font-bold text-amber-300 mt-2">{a.cefr ?? a.overall}</p>
              </button>
            ))}
          </Rail>
        )}

        {/* Authored / community exams */}
        {customExams.length > 0 && (
          <div>
            <SectionHeading title={t('exams.createdExams')} subtitle={`${customExams.length} custom exam${customExams.length === 1 ? '' : 's'}`} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {customExams.map((e) => (
                <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2">
                  <p className="text-sm font-bold text-white">{e.title}</p>
                  <p className="text-[11px] text-slate-400">{e.sections.length} section{e.sections.length === 1 ? '' : 's'} · {e.scaleLabel}</p>
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <button onClick={() => navigate(`/exams/run/${e.id}`)} className="btn-primary px-3 py-1.5 text-xs flex-1">{t('common.start')} →</button>
                    {canAuthor && <button onClick={() => { setEditing(true) }} className="btn-ghost px-2 py-1.5 text-xs">{t('common.edit')}</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Language-specific exam shortcuts */}
        <div>
          <SectionHeading title={t('exams.officialCerts', { language: lang.name })} subtitle={t('exams.examTypesFor', { n: langExams.length, language: lang.name })} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {langExams.map((e) => {
              const supported = e.id === 'cefr' || e.id === 'ielts' || e.id === 'toefl'
              return (
                <button
                  key={e.id}
                  disabled={!supported}
                  onClick={() => {
                    if (e.id === 'cefr') navigate('/exams/cefr')
                    else if (e.id === 'ielts' || e.id === 'toefl') navigate(`/exams/${e.id}`)
                  }}
                  className={cn(
                    'rounded-2xl p-1 ring-1 transition text-left bg-gradient-to-br relative',
                    supported ? 'ring-white/10 hover:ring-white/25 cursor-pointer' : 'ring-white/5 opacity-50 cursor-not-allowed',
                    e.tint
                  )}
                >
                  <div className="rounded-xl bg-black/20 px-3 py-3 h-full">
                    <span className="text-xl">{e.flag}</span>
                    <p className="text-sm font-bold text-white mt-1">{e.name}</p>
                    <p className="text-[10px] text-white/80 mt-0.5">{e.description}</p>
                    {!supported && (
                      <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-black/40 backdrop-blur text-white/90 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                        {t('common.soon')}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {exams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exams.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        )}

        {/* CEFR hub */}
        <button
          onClick={() => navigate('/exams/cefr')}
          className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4 text-left hover:bg-white/[0.06] transition"
        >
          <span className="w-12 h-12 rounded-2xl bg-grad-brand flex items-center justify-center shadow-glow-sm shrink-0">
            <IconTarget className="w-6 h-6 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white">{t('exams.cefrTest')}</p>
            <p className="text-sm text-slate-400">{t('exams.cefrSub')}</p>
          </div>
          <IconArrowRight className="w-5 h-5 text-brand-300 shrink-0" />
        </button>

        {/* Community mocks — real teacher/learner-authored exams from the store */}
        <div>
          <SectionHeading title={t('exams.communityMocks')} subtitle={t('exams.communityMocksSub')} />
          <div className="flex flex-col gap-2">
            {customExams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400">
                {t('exams.noCommunity')}
              </div>
            ) : (
              customExams.map((m) => (
                <button key={m.id} onClick={() => navigate(`/exams/run/${m.id}`)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      <span className="uppercase tracking-wider text-brand-300">{m.kind}</span> · {m.sections?.length ?? 0} section{(m.sections?.length ?? 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <IconArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Recent results — real persisted attempts */}
        <div>
          <SectionHeading title={t('exams.recentResults')} subtitle={attempts.length ? `${attempts.length} attempt${attempts.length === 1 ? '' : 's'}` : undefined} />
          <div className="flex flex-col gap-2">
            {attempts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400">
                {t('exams.noAttempts')}
              </div>
            ) : (
              [...attempts]
                .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
                .slice(0, 6)
                .map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white uppercase">{r.kind}</p>
                      <p className="text-xs text-slate-500">{fmtDate(r.takenAt)}{r.durationMin ? ` · ${r.durationMin} min` : ''}</p>
                    </div>
                    <span className="text-lg font-bold text-amber-300">{r.cefr ?? r.overall}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {editing && (
        <ExamEditor
          authorId={backend.currentUserId() ?? 'me'}
          onClose={() => setEditing(false)}
          onSaved={(e) => { setEditing(false); refresh(); navigate(`/exams/run/${e.id}`) }}
        />
      )}
    </div>
  )
}
