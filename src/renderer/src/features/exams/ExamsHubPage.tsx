import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { SectionHeading } from '../../components/ui'
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
  }
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
        <button onClick={() => navigate(exam.to)} className="btn-primary w-full py-2.5 mt-auto">
          Start mock test →
        </button>
      </div>
    </div>
  )
}

export default function ExamsHubPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exams &amp; tests</h1>
          <p className="text-sm text-slate-400 mt-1">
            Full-length mock exams with an AI examiner and band-score feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXAMS.map((e) => (
            <ExamCard key={e.id} exam={e} />
          ))}
        </div>

        {/* CEFR quick test */}
        <button
          onClick={() => navigate('/level-test')}
          className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4 text-left hover:bg-white/[0.06] transition"
        >
          <span className="w-12 h-12 rounded-2xl bg-grad-brand flex items-center justify-center shadow-glow-sm shrink-0">
            <IconTarget className="w-6 h-6 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white">CEFR placement test</p>
            <p className="text-sm text-slate-400">Quick 12-question test → your A1–C2 level + IELTS estimate</p>
          </div>
          <IconArrowRight className="w-5 h-5 text-brand-300 shrink-0" />
        </button>

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
