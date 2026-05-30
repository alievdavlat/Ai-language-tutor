import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading, StatCard } from '../../components/ui'
import {
  IconBolt,
  IconBook,
  IconChat,
  IconCheck,
  IconDownload,
  IconLock,
  IconStar,
  IconTrophy,
  type IconProps
} from '../../components/icons'
import { GUIDES, UNITS, type GrammarLesson, type GuideId } from './curriculum'
import { downloadCheatsheet } from './cheatsheet'
import { isLessonDone, unitDoneCount } from '../../services/study/grammarProgress'

const KIND_ICON: Record<GrammarLesson['kind'], (p: IconProps) => JSX.Element> = {
  rule: IconBook,
  practice: IconChat,
  quiz: IconStar
}

const KIND_TINT: Record<GrammarLesson['kind'], string> = {
  rule: 'bg-brand-500/15 text-brand-300',
  practice: 'bg-emerald-500/15 text-emerald-300',
  quiz: 'bg-amber-500/15 text-amber-300'
}

const GUIDE_TINT: Record<GuideId, string> = {
  conditionals: 'from-violet-600 to-purple-800',
  modals: 'from-sky-600 to-blue-800',
  tenses: 'from-emerald-600 to-teal-800',
  articles: 'from-rose-600 to-red-800'
}

export default function GrammarPage(): JSX.Element {
  const navigate = useNavigate()

  // Live progress from the local grammar store.
  const unitProgress = UNITS.map((u) => {
    const done = unitDoneCount(u.id)
    return { unit: u, done, total: u.lessons.length, pct: Math.round((done / u.lessons.length) * 100) }
  })
  const totalLessons = UNITS.reduce((n, u) => n + u.lessons.length, 0)
  const totalDone = unitProgress.reduce((n, p) => n + p.done, 0)
  const inProgress = unitProgress.filter((p) => p.done > 0 && p.done < p.total).length

  // The active unit = first not-fully-complete unit (fallback to the first).
  const active = unitProgress.find((p) => p.done < p.total) ?? unitProgress[0]
  const crownTier = totalDone >= 30 ? 'Gold' : totalDone >= 15 ? 'Silver' : totalDone >= 5 ? 'Bronze' : '—'

  const stats = [
    { value: totalDone, label: 'Lessons done', tone: 'emerald' as const, icon: <IconCheck /> },
    { value: inProgress, label: 'Units in progress', tone: 'amber' as const, icon: <IconBolt /> },
    { value: crownTier, label: 'Crown tier', tone: 'violet' as const, icon: <IconTrophy /> }
  ]

  // First unfinished lesson in the active unit, for the Continue CTA.
  const nextLesson =
    active.unit.lessons.find((l) => !isLessonDone(active.unit.id, l.id)) ?? active.unit.lessons[0]

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Skill tree"
          title="Grammar"
          subtitle={`${UNITS.length} units · CEFR A1 → B2 · ${totalDone}/${totalLessons} lessons`}
          back="/courses"
          crumbs={[{ label: 'Courses', to: '/courses' }, { label: 'Grammar' }]}
          action={<button onClick={() => navigate('/courses')} className="btn-ghost text-xs px-3 py-2">All courses</button>}
        />

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => <StatCard key={s.label} value={s.value} label={s.label} tone={s.tone} icon={s.icon} />)}
        </div>

        {/* Active unit hero */}
        <div className="rounded-card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-brand-500/10 p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">UNIT {active.unit.number}</span>
            <span className="inline-flex items-center rounded-full bg-white/[0.06] text-slate-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">{active.unit.level}</span>
            <span className="text-[11px] text-slate-400 ml-auto">{active.done}/{active.total} done</span>
          </div>
          <h2 className="text-xl font-black text-white mt-3">{active.unit.title}</h2>
          <p className="text-sm text-slate-300 mt-1">{active.unit.about}</p>
          <ProgressBar value={active.pct} color="green" className="mt-3" />
        </div>

        {/* Active unit lessons */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
          {active.unit.lessons.map((l, i) => {
            const Icon = KIND_ICON[l.kind]
            const lessonDone = isLessonDone(active.unit.id, l.id)
            // Lock a lesson only if the previous one isn't done (sequential unlock).
            const prevDone = i === 0 || isLessonDone(active.unit.id, active.unit.lessons[i - 1].id)
            const locked = !lessonDone && !prevDone
            return (
              <button
                key={l.id}
                disabled={locked}
                onClick={() => navigate(`/learn/exercise?unit=${active.unit.id}&lesson=${l.id}`)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition',
                  locked ? 'opacity-50 cursor-not-allowed' : lessonDone ? 'hover:bg-emerald-500/[0.05]' : 'hover:bg-white/[0.04]'
                )}
              >
                <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', locked ? 'bg-white/[0.05] text-slate-500' : lessonDone ? 'bg-emerald-500/20 text-emerald-300' : KIND_TINT[l.kind])}>
                  {locked ? <IconLock className="w-4 h-4" /> : lessonDone ? <IconCheck className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Lesson {i + 1} — {l.title}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{l.kind} · {l.duration} · {l.exercises.length} exercises</p>
                </div>
                {lessonDone && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Done</span>}
                {!lessonDone && !locked && <span className="text-slate-400 text-xs">→</span>}
              </button>
            )
          })}
        </div>

        {/* Deep-dive guides + cheatsheets */}
        <div>
          <SectionHeading title="Free deep-dive guides" subtitle="Full explanations + downloadable PDF cheatsheets" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(GUIDES) as GuideId[]).map((id) => {
              const g = GUIDES[id]
              return (
                <div key={id} className={cn('rounded-2xl p-1 ring-1 ring-white/10 bg-gradient-to-br', GUIDE_TINT[id])}>
                  <div className="rounded-xl bg-black/25 p-4 h-full flex flex-col">
                    <p className="text-base font-bold text-white">{g.title}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">CEFR {g.level}</p>
                    <p className="text-xs text-white/80 mt-2 flex-1">{g.summary}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => navigate(`/grammar/guide/${id}`)} className="flex-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-2 transition">Read guide</button>
                      <button onClick={() => downloadCheatsheet(g)} title="Download PDF cheatsheet" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 transition">
                        <IconDownload className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 30-day challenges */}
        <div>
          <SectionHeading title="30-day challenges" subtitle="One short drill set per day — build a streak per topic" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UNITS.slice(0, 4).map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/grammar/challenge/${u.id}`)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] flex items-center gap-3"
              >
                <span className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0"><IconFlameLite /></span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.title}</p>
                  <p className="text-[11px] text-slate-400">30-day challenge · {u.level}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* All units */}
        <div>
          <SectionHeading title="All units" subtitle="Tap a unit to open it" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unitProgress.map((p) => (
              <button
                key={p.unit.id}
                onClick={() => navigate(`/learn/exercise?unit=${p.unit.id}&lesson=${p.unit.lessons[0].id}`)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Unit {p.unit.number} · {p.unit.level}</span>
                  <span className="text-[11px] font-bold text-brand-200">{p.pct}%</span>
                </div>
                <p className="text-sm font-bold text-white mt-1">{p.unit.title}</p>
                <ProgressBar value={p.pct} color={p.pct === 100 ? 'green' : 'brand'} className="mt-2" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Continue CTA */}
      <div className="fixed bottom-0 left-56 right-0 bg-slate-950/90 backdrop-blur border-t border-white/[0.06] px-6 py-3">
        <button
          onClick={() => navigate(`/learn/exercise?unit=${active.unit.id}&lesson=${nextLesson.id}`)}
          className="btn-primary w-full max-w-xs mx-auto block py-3 text-base font-bold"
        >
          Continue: {nextLesson.title} →
        </button>
      </div>
    </div>
  )
}

// Small inline flame glyph (avoids depending on an icon that may not exist).
function IconFlameLite(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2c1 3-1 4-2 6-1 2 0 4 2 4s3-1 3-3c2 1 3 3 3 5a6 6 0 1 1-12 0c0-3 2-5 3-7 1-2 2-3 3-5z" />
    </svg>
  )
}
