import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressRing } from '../../components/ui'
import {
  IconArrowRight,
  IconBook,
  IconHeadphones,
  IconMic,
  IconPencilEdit,
  type IconProps
} from '../../components/icons'

const LEVELS = [
  { code: 'A1', name: 'Beginner', cover: 'from-sky-500 to-blue-700' },
  { code: 'A2', name: 'Elementary', cover: 'from-emerald-500 to-teal-700' },
  { code: 'B1', name: 'Intermediate', cover: 'from-blue-500 to-indigo-700' },
  { code: 'B2', name: 'Upper-Int.', cover: 'from-violet-500 to-purple-700' },
  { code: 'C1', name: 'Advanced', cover: 'from-rose-500 to-pink-700' },
  { code: 'C2', name: 'Proficiency', cover: 'from-amber-500 to-orange-700' }
]

const SKILLS: { name: string; meta: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { name: 'Reading', meta: '5 graded passages', Icon: IconBook },
  { name: 'Listening', meta: 'Audio + questions', Icon: IconHeadphones },
  { name: 'Writing', meta: 'AI-graded tasks', Icon: IconPencilEdit },
  { name: 'Speaking', meta: 'AI examiner', Icon: IconMic }
]

const CURRENT = 'B1'

export default function CefrHubPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CEFR English test</h1>
          <p className="text-sm text-slate-400 mt-1">
            Find your level (A1–C2), then practise by level or skill — instant scoring & breakdown.
          </p>
        </div>

        {/* Hero — current level + take test */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing value={55} size={120} stroke={11} tone="brand">
            <span className="text-2xl font-bold text-white">{CURRENT}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">your level</span>
          </ProgressRing>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">Intermediate</p>
            <h2 className="text-xl font-bold text-white mt-1">Take the full CEFR test</h2>
            <p className="text-sm text-slate-400 mt-1.5">
              Reading, Listening, Writing & Speaking — get a precise level with a detailed breakdown.
            </p>
            <button onClick={() => navigate('/level-test')} className="btn-primary mt-3 px-6">Start test →</button>
          </div>
        </div>

        {/* Practice by level */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Practice by level</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LEVELS.map((l) => (
              <button key={l.code} onClick={() => navigate('/learn/exercise')} className={cn('rounded-2xl p-1 transition', l.code === CURRENT ? 'ring-2 ring-brand-400' : 'ring-1 ring-white/10 hover:ring-white/25')}>
                <div className={cn('rounded-xl bg-gradient-to-br h-20 flex items-center justify-center', l.cover)}>
                  <span className="text-2xl font-bold text-white">{l.code}</span>
                </div>
                <p className="text-sm font-semibold text-white mt-2">{l.name}</p>
                <p className="text-[11px] text-slate-500 mb-1">{l.code === CURRENT ? 'You are here' : 'Practice set'}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Practice by skill */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Practice by skill</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKILLS.map((s) => (
              <button key={s.name} onClick={() => navigate('/learn/exercise')} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><s.Icon className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.meta}</p>
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
