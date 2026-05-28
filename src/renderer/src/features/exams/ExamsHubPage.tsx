import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { SectionHeading } from '../../components/ui'
import { useTargetLanguage } from '../../lib/language'
import { getExamsForLanguage } from '../../lib/contentByLanguage'
import {
  IconArrowRight,
  IconBook,
  IconHeadphones,
  IconMic,
  IconPencilEdit,
  IconTarget,
  type IconProps
} from '../../components/icons'

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
    to: '/exams/ielts',
    soon: true,
    sections: [
      { label: 'Reading', Icon: IconBook },
      { label: 'Writing', Icon: IconPencilEdit }
    ]
  },
  {
    id: 'gmat',
    title: 'GMAT',
    subtitle: 'Verbal & quantitative',
    meta: '4 sections · ~3h 7m',
    scale: 'Score 200–800',
    cover: 'from-violet-600 to-purple-800',
    to: '/exams/ielts',
    soon: true,
    sections: [
      { label: 'Verbal', Icon: IconBook },
      { label: 'Writing', Icon: IconPencilEdit }
    ]
  }
]

const COMMUNITY_MOCKS = [
  { name: 'IELTS Writing — Task 2 set', author: 'Emma Carter', role: 'teacher', tries: '1.2k' },
  { name: 'B1 Grammar mock #4', author: 'Bekzod', role: 'student', tries: '340' },
  { name: 'TOEFL Speaking drills', author: 'James Lee', role: 'teacher', tries: '880' }
]

const RECENT = [
  { name: 'IELTS Academic', date: '12 May', score: '6.5', tone: 'text-amber-300' },
  { name: 'CEFR placement', date: '5 May', score: 'B1', tone: 'text-brand-300' },
  { name: 'IELTS Academic', date: '28 Apr', score: '6.0', tone: 'text-amber-300' }
]

function ExamCard({ exam }: { exam: ExamDef }): JSX.Element {
  const navigate = useNavigate()
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
            Coming soon
          </button>
        ) : (
          <button onClick={() => navigate(exam.to)} className="btn-primary w-full py-2.5 mt-auto">
            Start mock test →
          </button>
        )}
      </div>
    </div>
  )
}

export default function ExamsHubPage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const langExams = getExamsForLanguage(lang.code)
  // Map our shared exam cards through the rich ExamDef shape — only show full
  // mocks for the ones we have real shells for (currently IELTS/TOEFL).
  const exams = EXAMS.filter((e) => langExams.some((x) => x.id === e.id))
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-7">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} Learning {lang.name}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Exams &amp; tests</h1>
          <p className="text-sm text-slate-400 mt-1">
            Full-length mock exams with an AI examiner and band-score feedback — filtered to {lang.name}.
          </p>
        </div>

        {/* Language-specific exam shortcuts */}
        <div>
          <SectionHeading title={`Official ${lang.name} certifications`} subtitle={`${langExams.length} exam types for ${lang.name}`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {langExams.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  if (e.id === 'cefr') navigate('/exams/cefr')
                  else if (e.id === 'ielts' || e.id === 'toefl') navigate(`/exams/${e.id}`)
                }}
                className={cn('rounded-2xl p-1 ring-1 ring-white/10 hover:ring-white/25 transition text-left bg-gradient-to-br', e.tint)}
              >
                <div className="rounded-xl bg-black/20 px-3 py-3 h-full">
                  <span className="text-xl">{e.flag}</span>
                  <p className="text-sm font-bold text-white mt-1">{e.name}</p>
                  <p className="text-[10px] text-white/80 mt-0.5">{e.description}</p>
                </div>
              </button>
            ))}
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
            <p className="text-base font-bold text-white">CEFR English test</p>
            <p className="text-sm text-slate-400">Find your A1–C2 level, then practise by level or skill</p>
          </div>
          <IconArrowRight className="w-5 h-5 text-brand-300 shrink-0" />
        </button>

        {/* Free practice by provider */}
        <div>
          <SectionHeading title="Free practice by provider" subtitle="Official section practice, answer keys, sample answers & tips" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'British Council', sub: 'IELTS', to: '/exams/ielts', tone: 'from-rose-600 to-red-800' },
              { name: 'IDP', sub: 'IELTS', to: '/exams/ielts', tone: 'from-blue-600 to-indigo-800' },
              { name: 'Cambridge', sub: 'IELTS · books', to: '/exams/ielts', tone: 'from-violet-600 to-purple-800' },
              { name: 'College Board', sub: 'SAT', to: '/exams', tone: 'from-emerald-600 to-teal-800' }
            ].map((p) => (
              <button key={p.name} onClick={() => navigate(p.to)} className="rounded-2xl p-1 ring-1 ring-white/10 hover:ring-white/25 transition text-left">
                <div className={cn('rounded-xl bg-gradient-to-br h-16 flex items-end p-3', p.tone)}>
                  <span className="text-sm font-bold text-white leading-tight">{p.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 px-1.5 pt-1.5">{p.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Community mocks */}
        <div>
          <SectionHeading title="Community mock tests" subtitle="Created by teachers and learners" />
          <div className="flex flex-col gap-2">
            {COMMUNITY_MOCKS.map((m) => (
              <button key={m.name} onClick={() => navigate('/exams/ielts')} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {m.author} <span className={cn('uppercase tracking-wider', m.role === 'teacher' ? 'text-brand-300' : 'text-slate-400')}>· {m.role}</span> · {m.tries} attempts
                  </p>
                </div>
                <IconArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent results */}
        <div>
          <SectionHeading title="Recent results" />
          <div className="flex flex-col gap-2">
            {RECENT.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.date}</p>
                </div>
                <span className={cn('text-lg font-bold', r.tone)}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
