import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar } from '../../components/ui'
import {
  IconBook,
  IconHeadphones,
  IconMic,
  IconPencilEdit,
  IconPlay,
  IconX,
  type IconProps
} from '../../components/icons'

type SectionId = 'listening' | 'reading' | 'writing' | 'speaking'
interface Section {
  id: SectionId
  name: string
  mins: number
  Icon: (p: IconProps) => JSX.Element
}

const SECTIONS: Record<'ielts' | 'toefl', Section[]> = {
  ielts: [
    { id: 'listening', name: 'Listening', mins: 30, Icon: IconHeadphones },
    { id: 'reading', name: 'Reading', mins: 60, Icon: IconBook },
    { id: 'writing', name: 'Writing', mins: 60, Icon: IconPencilEdit },
    { id: 'speaking', name: 'Speaking', mins: 14, Icon: IconMic }
  ],
  toefl: [
    { id: 'reading', name: 'Reading', mins: 54, Icon: IconBook },
    { id: 'listening', name: 'Listening', mins: 41, Icon: IconHeadphones },
    { id: 'speaking', name: 'Speaking', mins: 17, Icon: IconMic },
    { id: 'writing', name: 'Writing', mins: 50, Icon: IconPencilEdit }
  ]
}

const RESULT: Record<'ielts' | 'toefl', { overall: string; scaleLabel: string; bands: { label: string; score: string; pct: number }[]; feedback: string[] }> = {
  ielts: {
    overall: '6.5',
    scaleLabel: 'Overall band',
    bands: [
      { label: 'Listening', score: '7.0', pct: 78 },
      { label: 'Reading', score: '6.5', pct: 72 },
      { label: 'Writing', score: '6.0', pct: 66 },
      { label: 'Speaking', score: '6.5', pct: 72 }
    ],
    feedback: [
      'Strong listening — you caught most detail questions.',
      'Writing: improve paragraph linking words for a higher band.',
      'Speaking: good fluency, work on a wider range of tenses.'
    ]
  },
  toefl: {
    overall: '92',
    scaleLabel: 'Total score',
    bands: [
      { label: 'Reading', score: '24', pct: 80 },
      { label: 'Listening', score: '25', pct: 83 },
      { label: 'Speaking', score: '21', pct: 70 },
      { label: 'Writing', score: '22', pct: 73 }
    ],
    feedback: [
      'Reading & listening are your strengths.',
      'Speaking: aim for clearer structure in the 45-second tasks.',
      'Writing: add more specific examples to support your points.'
    ]
  }
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function SectionBody({ id, essay, onEssay }: { id: SectionId; essay: string; onEssay: (v: string) => void }): JSX.Element {
  if (id === 'listening') {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-4">
          <button className="w-12 h-12 rounded-full bg-grad-brand text-white flex items-center justify-center shadow-glow-sm shrink-0">
            <IconPlay className="w-5 h-5 ml-0.5" />
          </button>
          <div className="flex-1">
            <ProgressBar value={35} className="h-2" />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
              <span>1:34</span><span>4:30</span>
            </div>
          </div>
        </div>
        <Question prompt="Q3. What time does the library close on weekdays?" options={['6 pm', '8 pm', '9 pm', '10 pm']} />
      </div>
    )
  }
  if (id === 'reading') {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 max-h-48 overflow-y-auto text-sm text-slate-300 leading-relaxed">
          The Industrial Revolution marked a major turning point in history. Almost every aspect
          of daily life was influenced in some way. Average income and population began to exhibit
          unprecedented sustained growth. Some economists say the most important effect was that
          the standard of living for the general population began to increase consistently…
        </div>
        <Question prompt="Q7. According to the passage, what began to grow at an unprecedented rate?" options={['Trade routes', 'Income and population', 'Factory size', 'Government power']} />
      </div>
    )
  }
  if (id === 'writing') {
    const words = essay.trim() ? essay.trim().split(/\s+/).length : 0
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          <span className="font-semibold text-white">Task 2.</span> Some people think technology makes
          life more complex. To what extent do you agree or disagree? Write at least 250 words.
        </div>
        <textarea
          value={essay}
          onChange={(e) => onEssay(e.target.value)}
          placeholder="Write your response here…"
          className="w-full min-h-[200px] rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/70 focus:outline-none resize-none"
        />
        <div className="flex justify-end">
          <span className={cn('text-xs font-medium', words >= 250 ? 'text-emerald-300' : 'text-slate-500')}>
            {words} / 250 words
          </span>
        </div>
      </div>
    )
  }
  // speaking
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 w-full text-center">
        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-semibold mb-2">Part 1 · The examiner asks</p>
        <p className="text-lg font-semibold text-white">“Let's talk about your hometown. Where is it and what is it like?”</p>
      </div>
      <button className="w-20 h-20 rounded-full bg-grad-brand text-white flex items-center justify-center shadow-glow hover:scale-105 transition">
        <IconMic className="w-8 h-8" />
      </button>
      <p className="text-xs text-slate-400">Tap to answer · the AI examiner is listening</p>
    </div>
  )
}

function Question({ prompt, options }: { prompt: string; options: string[] }): JSX.Element {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <div>
      <p className="text-base font-bold mb-4">{prompt}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o, i) => (
          <button
            key={o}
            onClick={() => setSel(i)}
            className={cn(
              'rounded-2xl border px-4 py-3 text-left font-medium transition',
              sel === i ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]'
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ExamMock({ kind }: { kind: 'ielts' | 'toefl' }): JSX.Element {
  const navigate = useNavigate()
  const sections = SECTIONS[kind]
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'section' | 'result'>('intro')
  const [essay, setEssay] = useState('')
  const [secs, setSecs] = useState(0)

  const section = sections[idx]

  useEffect(() => {
    if (phase !== 'section') return
    setSecs(section.mins * 60)
    const iv = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(iv)
  }, [phase, idx, section.mins])

  const title = kind === 'ielts' ? 'IELTS Academic' : 'TOEFL iBT'

  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-slate-400 mt-2">Full mock test · {sections.length} sections · timed. Complete each section in order.</p>
        <div className="w-full mt-6 flex flex-col gap-2">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><s.Icon className="w-[18px] h-[18px]" /></span>
              <span className="flex-1 text-left text-sm font-semibold text-white">{s.name}</span>
              <span className="text-xs text-slate-400">{s.mins} min</span>
            </div>
          ))}
        </div>
        <button onClick={() => setPhase('section')} className="btn-primary px-10 py-3 mt-7">Start exam</button>
        <button onClick={() => navigate(-1)} className="text-xs text-slate-500 hover:text-slate-300 mt-4">Cancel</button>
      </div>
    )
  }

  if (phase === 'result') {
    const r = RESULT[kind]
    return (
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">{r.scaleLabel}</p>
          <div className="text-6xl font-bold tracking-tight mt-2 bg-grad-brand bg-clip-text text-transparent">{r.overall}</div>
          <p className="text-sm text-slate-400 mt-1">{title}</p>

          <div className="w-full mt-7 flex flex-col gap-3">
            {r.bands.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-200 font-medium">{b.label}</span>
                  <span className="font-bold text-white">{b.score}</span>
                </div>
                <ProgressBar value={b.pct} />
              </div>
            ))}
          </div>

          <div className="w-full mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold mb-2">AI examiner feedback</p>
            <ul className="flex flex-col gap-2">
              {r.feedback.map((f, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-brand-400">•</span> {f}</li>
              ))}
            </ul>
          </div>

          <button onClick={() => navigate('/exams')} className="btn-primary w-full py-3 mt-7">Back to exams</button>
        </div>
      </div>
    )
  }

  // section phase
  const isLast = idx + 1 >= sections.length
  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-5">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white transition shrink-0" title="Exit exam"><IconX className="w-6 h-6" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{section.name}</p>
          <p className="text-[11px] text-slate-400">Section {idx + 1} of {sections.length}</p>
        </div>
        <span className={cn('font-mono font-bold tabular-nums px-3 py-1 rounded-lg', secs < 60 ? 'text-rose-300 bg-rose-500/10' : 'text-slate-200 bg-white/[0.06]')}>
          {fmt(secs)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SectionBody id={section.id} essay={essay} onEssay={setEssay} />
      </div>

      <button
        onClick={() => { if (isLast) setPhase('result'); else setIdx((i) => i + 1) }}
        className="btn-primary w-full py-3 mt-5"
      >
        {isLast ? 'Finish & see score' : `Next: ${sections[idx + 1].name}`}
      </button>
    </div>
  )
}
