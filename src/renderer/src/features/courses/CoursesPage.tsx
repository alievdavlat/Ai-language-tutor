import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading, Tabs, type TabItem } from '../../components/ui'
import {
  IconBolt,
  IconBook,
  IconCheck,
  IconChevronLeft,
  IconLock,
  IconPlay,
  IconTrophy,
  type IconProps
} from '../../components/icons'
import {
  BOOK_COURSES,
  LEVEL_COURSES,
  STUDENT_COURSES,
  TEACHER_COURSES,
  SAMPLE_UNITS,
  type Course,
  type NodeKind,
  type NodeState,
  type PathNode
} from './data'

type Source = 'all' | 'official' | 'teachers' | 'students'
const SOURCE_FILTERS: TabItem<Source>[] = [
  { id: 'all', label: 'All' },
  { id: 'official', label: 'Official' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'students', label: 'Students' }
]

const KIND_ICON: Record<NodeKind, (p: IconProps) => JSX.Element> = {
  video: IconPlay,
  lesson: IconBook,
  practice: IconBolt,
  checkpoint: IconTrophy
}

// Zig-zag horizontal offsets (px) cycled down the path, Duolingo-style.
const OFFSETS = [0, 54, 82, 54, 0, -54, -82, -54]

function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }): JSX.Element {
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-2xl p-1 ring-1 ring-white/10 hover:ring-white/25 transition"
    >
      <div className={cn('relative rounded-xl bg-gradient-to-br p-4 h-32 flex flex-col justify-between overflow-hidden', course.cover)}>
        {course.type === 'book' && <div aria-hidden className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />}
        <div className="flex items-center justify-between">
          {course.type === 'book' ? <IconBook className="w-5 h-5 text-white/70" /> : <IconPlay className="w-5 h-5 text-white/70" />}
          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/25 text-white rounded-full px-2 py-0.5">
            {course.level}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">{course.title}</p>
          <p className="text-[11px] text-white/70 mt-0.5">{course.subtitle}</p>
        </div>
      </div>
      <div className="px-1.5 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-500">{course.lessons} lessons</span>
          <span className="text-[11px] font-semibold text-slate-300">{course.progress}%</span>
        </div>
        <ProgressBar value={course.progress} />
      </div>
    </button>
  )
}

function PathNodeButton({ node, onOpen }: { node: PathNode; onOpen: () => void }): JSX.Element {
  const Icon = KIND_ICON[node.kind]
  const clickable = node.state !== 'locked'
  const base = 'relative w-[68px] h-[68px] rounded-full flex items-center justify-center transition shrink-0'

  const visual: Record<NodeState, string> = {
    done: 'bg-grad-brand text-white shadow-glow-sm',
    current: 'bg-grad-brand text-white shadow-glow ring-4 ring-brand-400/30',
    locked: 'bg-white/[0.05] text-slate-600 border border-white/10'
  }

  return (
    <div className="flex flex-col items-center">
      {node.state === 'current' && (
        <span className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-300 bg-brand-500/15 border border-brand-400/30 rounded-full px-2.5 py-1 animate-pulse">
          Start
        </span>
      )}
      <button
        onClick={clickable ? onOpen : undefined}
        disabled={!clickable}
        title={node.label}
        className={cn(base, visual[node.state], clickable && 'hover:scale-105 active:scale-95 cursor-pointer')}
      >
        {node.state === 'done' ? (
          <IconCheck className="w-7 h-7" />
        ) : node.state === 'locked' ? (
          <IconLock className="w-5 h-5" />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </button>
      <span className={cn('mt-2 text-[11px] font-medium max-w-[150px] text-center leading-tight', node.state === 'locked' ? 'text-slate-600' : 'text-slate-300')}>
        {node.label}
      </span>
    </div>
  )
}

export default function CoursesPage(): JSX.Element {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Course | null>(null)
  const [source, setSource] = useState<Source>('all')

  // ── Path view ────────────────────────────────────────────────────────────
  if (selected) {
    let nodeIdx = 0
    return (
      <div className="h-full overflow-y-auto">
        {/* Sticky course header */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-canvas-soft/70 border-b border-white/10 px-6 py-3">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition" title="All courses">
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{selected.title}</p>
              <p className="text-[11px] text-slate-400">{selected.level} · {selected.progress}% complete</p>
            </div>
            <div className="w-28"><ProgressBar value={selected.progress} /></div>
          </div>
        </div>

        <div className="px-6 py-8 max-w-xl mx-auto flex flex-col gap-8">
          {SAMPLE_UNITS.map((unit) => (
            <div key={unit.title}>
              {/* Unit banner */}
              <div className={cn('rounded-2xl bg-gradient-to-r border border-white/10 px-5 py-3 mb-8', unit.tint)}>
                <p className="text-[11px] uppercase tracking-widest text-white/60 font-semibold">{unit.title}</p>
                <p className="text-base font-bold text-white">{unit.topic}</p>
              </div>
              {/* Zig-zag node path */}
              <div className="flex flex-col items-center gap-7">
                {unit.nodes.map((node, i) => {
                  const offset = OFFSETS[nodeIdx % OFFSETS.length]
                  nodeIdx += 1
                  return (
                    <div key={i} style={{ transform: `translateX(${offset}px)` }}>
                      <PathNodeButton node={node} onOpen={() => navigate(selected.type === 'book' ? '/learn/book' : '/learn/lesson')} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Course picker ────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-sm text-slate-400 mt-1">
            Official courses, teacher channels and community picks — follow the path in order.
          </p>
        </div>

        <Tabs items={SOURCE_FILTERS} active={source} onChange={setSource} className="self-start" />

        {(source === 'all' || source === 'official') && (
          <>
            <div>
              <SectionHeading title="Level courses" subtitle="Video-led, A1 → C1 — learn step by step" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {LEVEL_COURSES.map((c) => (
                  <CourseCard key={c.id} course={c} onOpen={() => setSelected(c)} />
                ))}
              </div>
            </div>
            <div>
              <SectionHeading title="Coursebooks" subtitle="Study a full textbook unit by unit" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BOOK_COURSES.map((c) => (
                  <CourseCard key={c.id} course={c} onOpen={() => setSelected(c)} />
                ))}
              </div>
            </div>
          </>
        )}

        {(source === 'all' || source === 'teachers') && (
          <div>
            <SectionHeading title="From teachers" subtitle="Made by teachers on the platform" action={<button onClick={() => navigate('/channel')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">Browse teachers</button>} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TEACHER_COURSES.map((c) => (
                <CourseCard key={c.id} course={c} onOpen={() => navigate('/course')} />
              ))}
            </div>
          </div>
        )}

        {(source === 'all' || source === 'students') && (
          <div>
            <SectionHeading title="From the community" subtitle="Shared by other learners" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STUDENT_COURSES.map((c) => (
                <CourseCard key={c.id} course={c} onOpen={() => navigate('/course')} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
