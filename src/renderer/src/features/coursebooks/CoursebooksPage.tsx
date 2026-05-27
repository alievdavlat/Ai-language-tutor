import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading } from '../../components/ui'
import { IconBook, IconCheck, IconLock, IconPlay } from '../../components/icons'

// Hardcoded preview data — real coursebook packs are parsed from PDF in Phase 22.
interface Book {
  id: string
  title: string
  author: string
  level: string
  units: number
  progress: number
  spine: string // tailwind gradient classes for the cover
}

const BOOKS: Book[] = [
  { id: 'egiu', title: 'English Grammar in Use', author: 'Raymond Murphy', level: 'B1–B2', units: 145, progress: 18, spine: 'from-blue-600 to-blue-800' },
  { id: 'essential', title: 'Essential Grammar in Use', author: 'Raymond Murphy', level: 'A1–A2', units: 115, progress: 64, spine: 'from-rose-600 to-rose-800' },
  { id: 'wordskills', title: 'Oxford Word Skills', author: 'Gairns & Redman', level: 'B1', units: 80, progress: 35, spine: 'from-emerald-600 to-emerald-800' },
  { id: 'vocabinuse', title: 'Vocabulary in Use', author: 'Cambridge', level: 'B2', units: 100, progress: 8, spine: 'from-amber-500 to-amber-700' }
]

type UnitState = 'done' | 'current' | 'locked'
interface Unit {
  n: number
  title: string
  exercises: number
  state: UnitState
}

const UNITS: Record<string, Unit[]> = {
  egiu: [
    { n: 1, title: 'Present continuous (I am doing)', exercises: 6, state: 'done' },
    { n: 2, title: 'Present simple (I do)', exercises: 6, state: 'done' },
    { n: 3, title: 'Present continuous vs present simple', exercises: 8, state: 'current' },
    { n: 4, title: 'Past simple (I did)', exercises: 6, state: 'locked' },
    { n: 5, title: 'Past continuous (I was doing)', exercises: 7, state: 'locked' },
    { n: 6, title: 'Present perfect (I have done)', exercises: 8, state: 'locked' }
  ]
}

const FALLBACK_UNITS: Unit[] = [
  { n: 1, title: 'Unit 1', exercises: 6, state: 'current' },
  { n: 2, title: 'Unit 2', exercises: 6, state: 'locked' },
  { n: 3, title: 'Unit 3', exercises: 6, state: 'locked' }
]

function BookCover({ book, active, onClick }: { book: Book; active: boolean; onClick: () => void }): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left rounded-2xl p-1 transition',
        active ? 'ring-2 ring-brand-400' : 'ring-1 ring-white/10 hover:ring-white/25'
      )}
    >
      <div className={cn('relative rounded-xl bg-gradient-to-br p-4 h-40 flex flex-col justify-between overflow-hidden', book.spine)}>
        <div aria-hidden className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />
        <IconBook className="w-6 h-6 text-white/70" />
        <div>
          <p className="text-sm font-bold text-white leading-tight">{book.title}</p>
          <p className="text-[11px] text-white/70 mt-1">{book.author}</p>
        </div>
      </div>
      <div className="px-1.5 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-300">{book.level}</span>
          <span className="text-[11px] text-slate-500">{book.progress}%</span>
        </div>
        <ProgressBar value={book.progress} />
      </div>
    </button>
  )
}

function UnitRow({ unit, onOpen }: { unit: Unit; onOpen: () => void }): JSX.Element {
  const icon =
    unit.state === 'done' ? (
      <span className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
        <IconCheck className="w-5 h-5" />
      </span>
    ) : unit.state === 'current' ? (
      <span className="w-10 h-10 rounded-full bg-grad-brand text-white flex items-center justify-center shadow-glow-sm">
        <IconPlay className="w-[18px] h-[18px]" />
      </span>
    ) : (
      <span className="w-10 h-10 rounded-full bg-white/[0.04] text-slate-600 flex items-center justify-center">
        <IconLock className="w-4 h-4" />
      </span>
    )

  const clickable = unit.state !== 'locked'
  return (
    <div
      onClick={clickable ? onOpen : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onOpen() } : undefined}
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition',
        unit.state === 'locked'
          ? 'border-white/[0.05] bg-white/[0.015] opacity-60'
          : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer'
      )}
    >
      <span className="text-xs font-bold text-slate-500 w-6 text-center shrink-0">{unit.n}</span>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{unit.title}</div>
        <div className="text-xs text-slate-400 mt-0.5">Rule + {unit.exercises} exercises</div>
      </div>
    </div>
  )
}

export default function CoursebooksPage(): JSX.Element {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState('egiu')
  const activeBook = BOOKS.find((b) => b.id === activeId) ?? BOOKS[0]
  const units = UNITS[activeId] ?? FALLBACK_UNITS

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coursebooks</h1>
          <p className="text-sm text-slate-400 mt-1">
            Study a full textbook unit by unit — the AI explains the rule, then drills you.
          </p>
        </div>

        {/* Book shelf */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BOOKS.map((b) => (
            <BookCover key={b.id} book={b} active={b.id === activeId} onClick={() => setActiveId(b.id)} />
          ))}
        </div>

        {/* Selected book units */}
        <div>
          <SectionHeading
            title={activeBook.title}
            subtitle={`${activeBook.author} · ${activeBook.units} units · ${activeBook.level}`}
            action={
              <span className="text-xs font-semibold text-slate-400">{activeBook.progress}% complete</span>
            }
          />
          <div className="flex flex-col gap-2">
            {units.map((u) => (
              <UnitRow key={u.n} unit={u} onOpen={() => navigate('/learn/exercise')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
