import type { CourseView, LessonView } from '../../services/content/courseModel'
import { cn } from '../../lib/classnames'
import { IconBook, IconCheck, IconLock, IconPlay, IconStar, IconTarget, IconTrophy } from '../../components/icons'

/**
 * Englify × Duolingo course path. The curriculum renders as a winding,
 * gamified path of lesson "nodes" (Duolingo): circular, locked → current →
 * done, zig-zagging down the screen, grouped by unit sections. Englify touch:
 * video lessons show a play node + thumbnail, level/section banners, XP.
 */

// Distinct section colors (Duolingo gives each unit its own colour).
const UNIT_TONES = [
  { ring: 'ring-sky-400/40', node: 'from-sky-400 to-blue-600', banner: 'from-sky-500/25 to-blue-600/10 text-sky-200 border-sky-400/30' },
  { ring: 'ring-emerald-400/40', node: 'from-emerald-400 to-teal-600', banner: 'from-emerald-500/25 to-teal-600/10 text-emerald-200 border-emerald-400/30' },
  { ring: 'ring-violet-400/40', node: 'from-violet-400 to-purple-600', banner: 'from-violet-500/25 to-purple-600/10 text-violet-200 border-violet-400/30' },
  { ring: 'ring-amber-400/40', node: 'from-amber-400 to-orange-600', banner: 'from-amber-500/25 to-orange-600/10 text-amber-200 border-amber-400/30' },
  { ring: 'ring-rose-400/40', node: 'from-rose-400 to-pink-600', banner: 'from-rose-500/25 to-pink-600/10 text-rose-200 border-rose-400/30' }
]
// Zig-zag horizontal offsets (px), cycled — the Duolingo "snake".
const OFFSETS = [0, 56, 80, 56, 0, -56, -80, -56]

function kindIcon(kind: LessonView['kind']): (p: { className?: string }) => JSX.Element {
  if (kind === 'video') return IconPlay
  if (kind === 'exam') return IconTrophy
  if (kind === 'rule') return IconBook
  if (kind === 'practice') return IconTarget
  return IconStar
}

function Node({ lesson, offset, locked, previewable, tone, onOpen }: {
  lesson: LessonView
  offset: number
  locked: boolean
  /** Free taster on a paid course the learner hasn't bought yet. */
  previewable: boolean
  tone: (typeof UNIT_TONES)[number]
  onOpen: () => void
}): JSX.Element {
  const done = lesson.state === 'done'
  const current = !locked && !previewable && lesson.state === 'current'
  const Icon = done ? IconCheck : locked ? IconLock : kindIcon(lesson.kind)
  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {current && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-brand-200 bg-brand-500/20 border border-brand-400/40 rounded-full px-2 py-0.5 animate-bounce">Start</span>
      )}
      {previewable && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-2 py-0.5 whitespace-nowrap">Free preview</span>
      )}
      {/* Locked nodes stay clickable — tapping opens the "buy to unlock" prompt. */}
      <button
        onClick={onOpen}
        title={locked ? `${lesson.title} · buy to unlock` : lesson.title}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition ring-4',
          done && 'bg-gradient-to-b from-emerald-400 to-emerald-600 ring-emerald-400/30 text-white',
          current && cn('bg-gradient-to-b text-white ring-offset-2 ring-offset-canvas hover:scale-105 active:scale-95', tone.node, tone.ring),
          previewable && 'bg-gradient-to-b from-emerald-400 to-teal-600 ring-emerald-400/30 text-white hover:scale-105 active:scale-95',
          locked && 'bg-white/[0.06] ring-white/[0.04] text-slate-600 hover:bg-white/[0.1] hover:text-slate-400'
        )}
      >
        <Icon className="w-7 h-7" />
      </button>
      <p className={cn('mt-2 text-[11px] font-semibold max-w-[120px] text-center leading-tight', locked ? 'text-slate-600' : 'text-slate-200')}>{lesson.title}</p>
    </div>
  )
}

export default function CoursePath({ view, unlocked, onOpenLesson, onOpenFinal, onLocked }: {
  view: CourseView
  /** Full access — learner may open every (non-preview) lesson. */
  unlocked: boolean
  onOpenLesson: (l: LessonView) => void
  onOpenFinal: () => void
  /** Tapped a locked node / the final while not unlocked — open the paywall. */
  onLocked: () => void
}): JSX.Element {
  let nodeIdx = 0
  return (
    <div className="relative flex flex-col items-center gap-2 py-2">
      {view.units.map(({ unit, lessons }, ui) => {
        const tone = UNIT_TONES[ui % UNIT_TONES.length]
        return (
          <div key={unit.id} className="w-full flex flex-col items-center gap-6 mb-6">
            {/* Section banner */}
            <div className={cn('w-full max-w-md rounded-2xl border bg-gradient-to-r px-4 py-3 text-center', tone.banner)}>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Unit {ui + 1}{unit.about ? '' : ''}</p>
              <p className="text-sm font-black text-white">{unit.title}</p>
            </div>
            {lessons.map((l) => {
              const off = OFFSETS[nodeIdx % OFFSETS.length]
              nodeIdx += 1
              const previewable = !unlocked && !!l.preview
              const locked = unlocked ? l.state === 'locked' : !l.preview
              return (
                <Node
                  key={l.id}
                  lesson={l}
                  offset={off}
                  locked={locked}
                  previewable={previewable}
                  tone={tone}
                  onOpen={() => (locked ? onLocked() : onOpenLesson(l))}
                />
              )
            })}
          </div>
        )
      })}

      {/* Final exam — the trophy at the summit */}
      {view.hasFinal && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <button
            onClick={() => (!unlocked ? onLocked() : view.finalUnlocked && onOpenFinal())}
            title="Final exam"
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center shadow-xl ring-4 transition',
              view.finalPassed ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 ring-emerald-400/30 text-white'
                : view.finalUnlocked && unlocked ? 'bg-gradient-to-b from-amber-300 to-amber-500 ring-amber-300/40 text-black hover:scale-105'
                  : 'bg-white/[0.06] ring-white/[0.04] text-slate-600 hover:bg-white/[0.1]'
            )}
          >
            {view.finalPassed ? <IconCheck className="w-9 h-9" /> : view.finalUnlocked && unlocked ? <IconTrophy className="w-9 h-9" /> : <IconLock className="w-8 h-8" />}
          </button>
          <p className="text-xs font-bold text-white">Final exam{view.finalPassed ? ' · passed' : ''}</p>
          <p className="text-[11px] text-slate-500">Pass to earn your certificate 🏆</p>
        </div>
      )}

      {!unlocked && (
        <button onClick={onLocked} className="text-xs text-brand-300 hover:text-brand-200 mt-4 inline-flex items-center gap-1.5 font-semibold">
          <IconLock className="w-3.5 h-3.5" /> Buy to unlock the full path →
        </button>
      )}
    </div>
  )
}
