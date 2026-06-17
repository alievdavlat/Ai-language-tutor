import { useMemo, useState } from 'react'
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
  IconPlus,
  IconStar,
  IconTrophy,
  type IconProps
} from '../../components/icons'
import { GUIDES, allUnits, type GrammarLesson, type GrammarUnit, type GuideId } from './curriculum'
import GrammarUnitEditor from './GrammarUnitEditor'
import { downloadCheatsheet } from './cheatsheet'
import { isLessonDone, unitDoneCount } from '../../services/study/grammarProgress'
import { useAppStore } from '../../store/useAppStore'
import { canAuthorContent } from '@shared/constants'
import { useT } from '../../i18n'

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
  const t = useT()
  const role = useAppStore((s) => s.role)
  const canAuthor = canAuthorContent(role)
  const [rev, setRev] = useState(0)
  const [editing, setEditing] = useState<{ unit: GrammarUnit | null } | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const units = useMemo(() => allUnits(), [rev])

  // Live progress from the local grammar store.
  const unitProgress = units.map((u) => {
    const done = unitDoneCount(u.id)
    return { unit: u, done, total: u.lessons.length, pct: Math.round((done / u.lessons.length) * 100) }
  })
  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0)
  const totalDone = unitProgress.reduce((n, p) => n + p.done, 0)
  const inProgress = unitProgress.filter((p) => p.done > 0 && p.done < p.total).length

  // The active unit = first not-fully-complete unit (fallback to the first).
  const active = unitProgress.find((p) => p.done < p.total) ?? unitProgress[0]
  const crownTier =
    totalDone >= 30 ? t('progress.crown.gold')
      : totalDone >= 15 ? t('progress.crown.silver')
        : totalDone >= 5 ? t('progress.crown.bronze')
          : '—'

  const stats = [
    { value: totalDone, label: t('grammar.lessonsDone'), tone: 'emerald' as const, icon: <IconCheck /> },
    { value: inProgress, label: t('grammar.unitsInProgress'), tone: 'amber' as const, icon: <IconBolt /> },
    { value: crownTier, label: t('grammar.crownTier'), tone: 'violet' as const, icon: <IconTrophy /> }
  ]

  // First unfinished lesson in the active unit, for the Continue CTA.
  const nextLesson =
    active.unit.lessons.find((l) => !isLessonDone(active.unit.id, l.id)) ?? active.unit.lessons[0]

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow={t('grammar.eyebrow')}
          title={t('grammar.title')}
          subtitle={t('grammar.headerSub', { units: units.length, done: totalDone, total: totalLessons })}
          back="/courses"
          crumbs={[{ label: t('nav.courses'), to: '/courses' }, { label: t('grammar.title') }]}
          action={
            <div className="flex items-center gap-2">
              {canAuthor && (
                <button onClick={() => setEditing({ unit: null })} className="btn-primary text-xs px-3 py-2 inline-flex items-center gap-1.5">
                  <IconPlus className="w-3.5 h-3.5" /> {t('grammar.newUnit')}
                </button>
              )}
              <button onClick={() => navigate('/courses')} className="btn-ghost text-xs px-3 py-2">{t('courses.allCourses')}</button>
            </div>
          }
        />

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => <StatCard key={s.label} value={s.value} label={s.label} tone={s.tone} icon={s.icon} />)}
        </div>

        {/* Active unit hero */}
        <div className="rounded-card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-brand-500/10 p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">{t('grammar.unit', { n: active.unit.number })}</span>
            <span className="inline-flex items-center rounded-full bg-white/[0.06] text-slate-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">{active.unit.level}</span>
            <span className="text-[11px] text-slate-400 ml-auto">{t('grammar.doneCount', { done: active.done, total: active.total })}</span>
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
                  <p className="text-sm font-semibold text-white">{t('grammar.lessonLine', { n: i + 1, title: l.title })}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{t('grammar.lessonMeta', { kind: l.kind, duration: l.duration, n: l.exercises.length })}</p>
                </div>
                {lessonDone && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">{t('grammar.done')}</span>}
                {!lessonDone && !locked && <span className="text-slate-400 text-xs">→</span>}
              </button>
            )
          })}
        </div>

        {/* Deep-dive guides + cheatsheets */}
        <div>
          <SectionHeading title={t('grammar.deepDiveGuides')} subtitle={t('grammar.deepDiveGuidesSub')} />
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
                      <button onClick={() => navigate(`/grammar/guide/${id}`)} className="flex-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-2 transition">{t('grammar.readGuide')}</button>
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
          <SectionHeading title={t('grammar.challenges')} subtitle={t('grammar.challengesSub')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {units.slice(0, 4).map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/grammar/challenge/${u.id}`)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] flex items-center gap-3"
              >
                <span className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0"><IconFlameLite /></span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.title}</p>
                  <p className="text-[11px] text-slate-400">{t('grammar.challengeLine', { level: u.level })}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* All units */}
        <div>
          <SectionHeading title={t('grammar.allUnits')} subtitle={t('grammar.allUnitsSub')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unitProgress.map((p) => (
              <div
                key={p.unit.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/learn/exercise?unit=${p.unit.id}&lesson=${p.unit.lessons[0].id}`)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('grammar.unit', { n: p.unit.number })} · {p.unit.level}</span>
                  <span className="flex items-center gap-2">
                    {canAuthor && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing({ unit: p.unit }) }}
                        className="text-[10px] font-bold text-slate-400 hover:text-brand-300 uppercase tracking-wider"
                      >
                        {t('common.edit')}
                      </button>
                    )}
                    <span className="text-[11px] font-bold text-brand-200">{p.pct}%</span>
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-1">{p.unit.title}</p>
                <ProgressBar value={p.pct} color={p.pct === 100 ? 'green' : 'brand'} className="mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <GrammarUnitEditor
          unit={editing.unit}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setRev((r) => r + 1) }}
        />
      )}

      {/* Sticky Continue CTA */}
      <div className="fixed bottom-0 left-56 right-0 bg-slate-950/90 backdrop-blur border-t border-white/[0.06] px-6 py-3">
        <button
          onClick={() => navigate(`/learn/exercise?unit=${active.unit.id}&lesson=${nextLesson.id}`)}
          className="btn-primary w-full max-w-xs mx-auto block py-3 text-base font-bold"
        >
          {t('grammar.continueCta', { title: nextLesson.title })}
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
