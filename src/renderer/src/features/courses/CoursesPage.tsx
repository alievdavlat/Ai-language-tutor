import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading, Spinner } from '../../components/ui'
import { IconBook, IconPlay, IconStar, IconTarget } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { useContentState } from '../../services/content/progress'
import { useTargetLanguageCode } from '../../lib/language'
import { useT } from '../../i18n'
import { isImageCover } from '../../lib/cover'
import type { Course } from '@shared/types'

type Skill = 'all' | 'grammar' | 'writing' | 'speaking' | 'listening' | 'exam' | 'business'
const SKILLS: { id: Skill; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📚' },
  { id: 'grammar', label: 'Grammar', emoji: '📐' },
  { id: 'writing', label: 'Writing', emoji: '✍️' },
  { id: 'speaking', label: 'Speaking', emoji: '🎤' },
  { id: 'listening', label: 'Listening', emoji: '🎧' },
  { id: 'exam', label: 'Exam prep', emoji: '🎓' },
  { id: 'business', label: 'Business', emoji: '💼' }
]

/** Map a course to its primary skill — explicit ids first, then title keywords. */
const SKILL_BY_ID: Record<string, Exclude<Skill, 'all'>> = {
  c_egiu: 'grammar',
  c_everyday: 'speaking',
  c_business: 'business',
  c_pronun: 'speaking',
  c_ielts7: 'exam'
}
function courseSkill(c: Course): Exclude<Skill, 'all'> {
  if (SKILL_BY_ID[c.id]) return SKILL_BY_ID[c.id]
  const t = c.title.toLowerCase()
  if (/grammar/.test(t)) return 'grammar'
  if (/writ/.test(t)) return 'writing'
  if (/ielts|toefl|exam|\btest\b/.test(t)) return 'exam'
  if (/listen|podcast|shadow/.test(t)) return 'listening'
  if (/business/.test(t)) return 'business'
  return 'speaking'
}
const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function CourseCard({ course, progress, onOpen }: { course: Course; progress: number; onOpen: () => void }): JSX.Element {
  const isBook = course.title.toLowerCase().includes('coursebook') || course.id === 'c_egiu'
  const price = course.pricing.kind === 'free' ? 'Free' : course.pricing.kind === 'one-off' ? `$${course.pricing.usd}` : `$${course.pricing.usdPerMo}/mo`
  const thumb = course.thumbnailUrl
  return (
    <button onClick={onOpen} className="text-left rounded-2xl p-1 ring-1 ring-white/10 hover:ring-white/25 transition">
      <div className={cn('relative rounded-xl p-4 h-32 flex flex-col justify-between overflow-hidden', !isImageCover(thumb) && `bg-gradient-to-br ${course.cover}`)}>
        {isImageCover(thumb) && (
          <>
            <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
          </>
        )}
        {isBook && <div aria-hidden className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />}
        <div className="relative z-10 flex items-center justify-between">
          {isBook ? <IconBook className="w-5 h-5 text-white/70" /> : <IconPlay className="w-5 h-5 text-white/70" />}
          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/25 text-white rounded-full px-2 py-0.5">{course.level}</span>
        </div>
        <div className="relative z-10">
          <p className="text-sm font-bold text-white leading-tight line-clamp-2">{course.title}</p>
          <p className="text-[11px] text-white/70 mt-0.5 inline-flex items-center gap-1">
            {course.reviewCount > 0 ? <><IconStar className="w-3 h-3" /> {course.rating.toFixed(1)} · </> : <span className="text-emerald-200 font-semibold">New · </span>}{price}
          </p>
        </div>
      </div>
      <div className="px-1.5 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-500">{course.enrollmentCount > 0 ? `${course.enrollmentCount.toLocaleString()} learners` : 'Be the first'}</span>
          <span className="text-[11px] font-semibold text-slate-300">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>
    </button>
  )
}

export default function CoursesPage(): JSX.Element {
  const navigate = useNavigate()
  const [skill, setSkill] = useState<Skill>('all')
  const [level, setLevel] = useState<string>('All')
  const lang = useTargetLanguageCode()
  const t = useT()
  const userId = backend.currentUserId()
  useContentState() // re-render when progress changes

  const { data: courses, loading } = useBackendQuery(() => backend.listCourses({ language: lang }), [lang], [])
  const { data: enrollments } = useBackendQuery(
    () => (userId ? backend.myEnrollments(userId) : Promise.resolve([])),
    [userId],
    []
  )

  const progressFor = (id: string): number => enrollments.find((e) => e.courseId === id)?.progress ?? 0
  const isEnrolled = (id: string): boolean => enrollments.some((e) => e.courseId === id)
  const open = (id: string): void => navigate(`/course/${id}`)

  // Only show skill chips that actually have a course (no empty filters).
  const presentSkills = new Set(courses.map(courseSkill))
  const skillChips = SKILLS.filter((s) => s.id === 'all' || presentSkills.has(s.id as Exclude<Skill, 'all'>))

  const filtered = courses.filter((c) => {
    if (skill !== 'all' && courseSkill(c) !== skill) return false
    if (level !== 'All' && c.level !== level) return false
    return true
  })

  const inProgress = courses.filter((c) => isEnrolled(c.id) && progressFor(c.id) > 0 && progressFor(c.id) < 100)
  const cont = inProgress[0]
  // One representative course per core skill, for the "Skill tracks" rail.
  const trackOrder: Exclude<Skill, 'all'>[] = ['grammar', 'writing', 'speaking', 'listening', 'exam', 'business']
  const tracks = trackOrder
    .map((sk) => courses.find((c) => courseSkill(c) === sk))
    .filter((c): c is Course => !!c)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header + level filter */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{t('nav.section.learn')}</p>
            <h1 className="text-2xl font-black tracking-tight">{t('courses.title')}</h1>
            <p className="text-sm text-slate-400 mt-1">{t('courses.subtitle')}</p>
          </div>
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)} className={cn('rounded-lg px-2.5 py-1.5 text-xs font-bold transition', level === l ? 'bg-brand-500/20 text-brand-100 ring-1 ring-brand-400/40' : 'bg-white/[0.04] text-slate-400 hover:text-white')}>{l}</button>
            ))}
          </div>
        </div>

        {/* Skill chips */}
        <div className="flex flex-wrap gap-2">
          {skillChips.map((s) => (
            <button key={s.id} onClick={() => setSkill(s.id)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition', skill === s.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]')}>
              <span>{s.emoji}</span>{s.label}
            </button>
          ))}
        </div>

        {/* Learning paths — guided multi-course journeys */}
        <button
          onClick={() => navigate('/paths')}
          className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-transparent px-5 py-4 flex items-center gap-4 text-left hover:border-white/20 transition"
        >
          <span className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0"><IconTarget className="w-5 h-5" /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-white">Learning paths</span>
            <span className="block text-xs text-slate-400">Follow a guided, step-by-step journey across several courses.</span>
          </span>
          <span className="text-emerald-300 text-sm font-semibold shrink-0">Explore →</span>
        </button>

        {/* Continue learning hero */}
        {skill === 'all' && level === 'All' && cont && (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-violet-600/12 to-slate-900/30 p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-widest text-brand-200 font-bold">Continue learning</p>
              <h2 className="text-xl font-black text-white mt-0.5">{cont.title}</h2>
              <p className="text-sm text-slate-300/80 mt-1">{progressFor(cont.id)}% complete · {cont.level}</p>
              <button onClick={() => open(cont.id)} className="mt-3 rounded-xl bg-white text-slate-900 px-5 py-2.5 text-sm font-black">Continue →</button>
            </div>
            {isImageCover(cont.thumbnailUrl) && (
              <img src={cont.thumbnailUrl} alt="" className="w-40 h-24 rounded-2xl object-cover ring-1 ring-white/15" />
            )}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <>
            {/* Skill tracks — built-in core courses */}
            {skill === 'all' && level === 'All' && tracks.length > 0 && (
              <div>
                <SectionHeading title="Skill tracks" subtitle="Built-in courses — grammar, writing, speaking & exam prep" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tracks.map((c) => (
                    <CourseCard key={c.id} course={c} progress={progressFor(c.id)} onOpen={() => open(c.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* All / filtered courses */}
            <div>
              <SectionHeading title={skill === 'all' ? 'All courses' : SKILLS.find((s) => s.id === skill)?.label ?? 'Courses'} subtitle={`${filtered.length} course${filtered.length === 1 ? '' : 's'}`} />
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-slate-400">No courses match this filter yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filtered.map((c) => (
                    <CourseCard key={c.id} course={c} progress={progressFor(c.id)} onOpen={() => open(c.id)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
