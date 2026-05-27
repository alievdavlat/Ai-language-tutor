import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, StatCard, Tabs, type TabItem } from '../../components/ui'
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
type Tab = 'tests' | 'listening' | 'reading' | 'writing' | 'speaking' | 'vocab'

const TABS: TabItem<Tab>[] = [
  { id: 'tests', label: 'Full tests' },
  { id: 'listening', label: 'Listening' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'speaking', label: 'Speaking' },
  { id: 'vocab', label: 'Vocabulary' }
]

const SKILL_ICON: Record<string, (p: IconProps) => JSX.Element> = {
  listening: IconHeadphones,
  reading: IconBook,
  writing: IconPencilEdit,
  speaking: IconMic
}

interface TestItem {
  name: string
  source: string
  mins: number
  attempts: string
  band?: string
}

interface ExamConfig {
  title: string
  scale: string
  best: string
  taken: string
  hours: string
  tests: TestItem[]
  sets: Record<'listening' | 'reading' | 'writing' | 'speaking', { name: string; meta: string }[]>
}

const CONFIG: Record<ExamId, ExamConfig> = {
  ielts: {
    title: 'IELTS Academic',
    scale: 'Band 0–9',
    best: '6.5',
    taken: '4',
    hours: '12h',
    tests: [
      { name: 'Academic Test 1', source: 'Official', mins: 160, attempts: '120k', band: '6.5' },
      { name: 'Cambridge IELTS 18 · Test 1', source: 'Cambridge', mins: 160, attempts: '88k' },
      { name: 'Cambridge IELTS 18 · Test 2', source: 'Cambridge', mins: 160, attempts: '74k' },
      { name: 'Recent Actual Test · May 2026', source: 'Recent', mins: 160, attempts: '31k' }
    ],
    sets: {
      listening: [
        { name: 'Listening · Section 1 — Conversation', meta: '10 questions · 8 min' },
        { name: 'Listening · Section 3 — Discussion', meta: '10 questions · 9 min' }
      ],
      reading: [
        { name: 'Reading · Passage 1 — True/False/NG', meta: '13 questions · 20 min' },
        { name: 'Reading · Passage 2 — Matching headings', meta: '13 questions · 20 min' }
      ],
      writing: [
        { name: 'Writing · Task 1 — describe a chart', meta: 'AI examiner · 20 min' },
        { name: 'Writing · Task 2 — opinion essay', meta: 'AI examiner · 40 min' }
      ],
      speaking: [
        { name: 'Speaking · Part 1 — Interview', meta: 'AI examiner · 5 min' },
        { name: 'Speaking · Part 2 — Cue card', meta: 'AI examiner · 4 min' }
      ]
    }
  },
  toefl: {
    title: 'TOEFL iBT',
    scale: 'Score 0–120',
    best: '92',
    taken: '2',
    hours: '6h',
    tests: [
      { name: 'TOEFL Practice Test 1', source: 'Official', mins: 180, attempts: '54k', band: '92' },
      { name: 'TOEFL Practice Test 2', source: 'Official', mins: 180, attempts: '41k' },
      { name: 'Recent Actual Test · Apr 2026', source: 'Recent', mins: 180, attempts: '12k' }
    ],
    sets: {
      reading: [{ name: 'Reading · Academic passage', meta: '10 questions · 18 min' }],
      listening: [{ name: 'Listening · Lecture', meta: '6 questions · 7 min' }],
      speaking: [{ name: 'Speaking · Independent task', meta: 'AI examiner · 45 sec' }],
      writing: [{ name: 'Writing · Integrated task', meta: 'AI examiner · 20 min' }]
    }
  }
}

const COMMUNITY = [
  { name: 'Writing Task 2 — band 7 set', author: 'Emma Carter', role: 'teacher', tries: '1.2k' },
  { name: 'Listening practice (my recordings)', author: 'Bekzod', role: 'student', tries: '210' }
]

export default function ExamPracticeHub({ examId }: { examId: ExamId }): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('tests')
  const c = CONFIG[examId]
  const mock = `/exams/${examId}/mock`

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{c.title} practice</h1>
          <p className="text-sm text-slate-400 mt-1">
            Full mock tests and skill-by-skill practice with an AI examiner — {c.scale}.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={c.best} label="Best score" tone="brand" />
          <StatCard value={c.taken} label="Tests taken" tone="emerald" />
          <StatCard value={c.hours} label="Study time" tone="amber" />
          <StatCard value="AI" label="Examiner feedback" tone="violet" />
        </div>

        {/* Start full mock */}
        <button onClick={() => navigate(mock)} className="rounded-card bg-grad-brand text-white p-5 flex items-center gap-4 text-left shadow-glow-sm">
          <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><IconPlay className="w-6 h-6" /></span>
          <div className="flex-1">
            <p className="text-base font-bold">Take a full mock test</p>
            <p className="text-sm text-white/80">4 sections · timed · band-score result with feedback</p>
          </div>
          <IconArrowRight className="w-5 h-5" />
        </button>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {/* Full tests library */}
        {tab === 'tests' && (
          <div className="flex flex-col gap-2">
            {c.tests.map((t) => (
              <button key={t.name} onClick={() => navigate(mock)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconBook className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.source} · {t.mins} min · {t.attempts} attempts</p>
                </div>
                {t.band ? (
                  <span className="text-sm font-bold text-amber-300 shrink-0">{t.band}</span>
                ) : (
                  <span className="text-xs font-semibold text-brand-300 shrink-0">Start →</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Skill practice */}
        {(['listening', 'reading', 'writing', 'speaking'] as const).map((skill) =>
          tab === skill ? (
            <div key={skill} className="flex flex-col gap-2">
              {(skill === 'writing' || skill === 'speaking') && (
                <div className="rounded-xl bg-brand-500/10 border border-brand-400/20 px-4 py-2.5 text-xs text-brand-200 inline-flex items-center gap-2">
                  <IconBolt className="w-4 h-4" /> Graded by the AI examiner — band + criterion feedback in under a minute.
                </div>
              )}
              {c.sets[skill].map((s) => {
                const Icon = SKILL_ICON[skill]
                return (
                  <button key={s.name} onClick={() => navigate(mock)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                    <span className="w-10 h-10 rounded-xl bg-white/[0.06] text-slate-300 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.meta}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-300 shrink-0">Practice →</span>
                  </button>
                )
              })}
            </div>
          ) : null
        )}

        {tab === 'vocab' && (
          <button onClick={() => navigate('/vocabulary')} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4 text-left hover:bg-white/[0.06] transition">
            <span className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><IconStar className="w-5 h-5" /></span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{c.title} vocabulary</p>
              <p className="text-xs text-slate-400">Academic word list + spaced-repetition review</p>
            </div>
            <IconArrowRight className="w-5 h-5 text-brand-300" />
          </button>
        )}

        {/* Community tests */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Community tests</p>
          <div className="flex flex-col gap-2">
            {COMMUNITY.map((m) => (
              <button key={m.name} onClick={() => navigate(mock)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                <AvatarCircle name={m.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.author} <span className={cn('uppercase tracking-wider', m.role === 'teacher' ? 'text-brand-300' : 'text-slate-400')}>· {m.role}</span> · {m.tries} attempts</p>
                </div>
                <IconArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
