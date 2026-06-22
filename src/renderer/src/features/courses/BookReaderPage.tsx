import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { Spinner } from '../../components/ui'
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconChevronLeft,
  IconChevronRight
} from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { buildCourseView } from '../../services/content/courseModel'
import { getLessonContent, type BookBlock } from '../../services/content/lessonContent'
import { useContentState, isLessonComplete, markLessonComplete } from '../../services/content/progress'
import { logActivity } from '../../services/activity'
import { courseAccess } from '../../services/access/entitlement'
import type { Lesson } from '@shared/types'
import { useT } from '../../i18n'

function Block({ block }: { block: BookBlock }): JSX.Element {
  switch (block.kind) {
    case 'text':
      return <p className="mb-3">{block.text}</p>
    case 'example':
      return <div className="rounded-lg bg-[#e9e3d4] px-4 py-3 mb-4 italic">{block.text}</div>
    case 'list':
      return (
        <ul className="list-disc pl-5 space-y-1 mb-3">
          {block.items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )
    case 'exercise':
      return (
        <>
          <p className="mb-3 font-semibold">{block.title}</p>
          <ol className="list-decimal pl-5 space-y-2.5">
            {block.items.map((it, i) => <li key={i}>{it}</li>)}
          </ol>
        </>
      )
    default:
      return <></>
  }
}

export default function BookReaderPage(): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  const { courseId = '', lessonId = '' } = useParams()
  const userId = backend.currentUserId()
  const content = useContentState()
  const [page, setPage] = useState(0)

  const { data: course } = useBackendQuery(() => backend.getCourse(courseId), [courseId], null)
  const { data: units } = useBackendQuery(() => backend.listUnits(courseId), [courseId], [])
  const { data: lessons } = useBackendQuery(
    async () => {
      const us = await backend.listUnits(courseId)
      const lists = await Promise.all(us.map((u) => backend.listLessons(u.id)))
      return lists.flat()
    },
    [courseId],
    [] as Lesson[]
  )

  const view = useMemo(() => buildCourseView(courseId, units, lessons), [courseId, units, lessons, content])
  const lesson = lessons.find((l) => l.id === lessonId)
  const unit = units.find((u) => u.id === lesson?.unitId)
  const orderIdx = view.ordered.findIndex((l) => l.id === lessonId)
  const nextLesson = orderIdx >= 0 ? view.ordered[orderIdx + 1] : null

  // #B1 — same paywall guard as ClassroomPage for rule/book lessons.
  const { data: enrollments } = useBackendQuery(
    () => (userId ? backend.myEnrollments(userId) : Promise.resolve([])),
    [userId],
    []
  )
  useEffect(() => {
    if (!course || !lesson || course.pricing.kind === 'free' || lesson.preview) return
    const enrolled = enrollments.some((e) => e.courseId === courseId)
    let cancelled = false
    void courseAccess(userId, course, enrolled).then((acc) => {
      if (!cancelled && !acc.unlocked) navigate(`/course/${courseId}?paywall=1`, { replace: true })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, lesson?.id, enrollments])

  if (!lesson) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Spinner />
        <button onClick={() => navigate(`/course/${courseId}`)} className="btn-ghost px-4 py-2 text-sm">{t('crs.backToCourse')}</button>
      </div>
    )
  }

  const pages = getLessonContent(lesson).bookPages ?? [
    { label: 'A', blocks: [{ kind: 'text', text: lesson.title } as BookBlock] }
  ]
  const p = pages[Math.min(page, pages.length - 1)]
  const done = isLessonComplete(lessonId)

  function finish(): void {
    // #B2 — award XP only on first completion; repeat clicks just navigate on.
    if (!done) {
      markLessonComplete(lesson!.id)
      if (userId) {
        logActivity({ userId, kind: 'lesson_complete', xp: 20, minutes: lesson!.durationMin, meta: { courseId, lessonId } }).catch(() => {})
        const fresh = buildCourseView(courseId, units, lessons)
        backend.setEnrollmentProgress(userId, courseId, fresh.progress).catch(() => {})
      }
    }
    if (nextLesson) {
      const base = nextLesson.kind === 'rule' ? `/learn/book/${courseId}` : `/learn/${courseId}`
      navigate(`${base}/${nextLesson.id}`)
    } else {
      navigate(`/course/${courseId}`)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3 backdrop-blur-xl bg-canvas-soft/40 shrink-0">
        <button onClick={() => navigate(`/course/${courseId}`)} className="text-slate-400 hover:text-white transition" title={t('crs.backToCourse')}>
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{course?.title}</p>
          <p className="text-[11px] text-slate-400">{unit?.title} · {lesson.title}</p>
        </div>
        {done && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/15 rounded-full px-2.5 py-1"><IconCheck className="w-3.5 h-3.5" /> {t('crs.done')}</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 w-full max-w-3xl mx-auto flex flex-col gap-5">
          {/* Book page */}
          <div className="rounded-2xl overflow-hidden ring-1 ring-black/20 shadow-2xl">
            <div className="bg-[#f5f1e8] text-slate-800 px-7 py-8 min-h-[420px] font-serif">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm font-sans">{(unit?.index ?? 0) + 1}</span>
                <h2 className="text-xl font-bold">{lesson.title}</h2>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-700 font-bold text-lg shrink-0 w-8">{p.label}</span>
                <div className="text-[15px] leading-relaxed">
                  {p.blocks.map((b, i) => <Block key={i} block={b} />)}
                </div>
              </div>
            </div>
          </div>

          {/* Page nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => setPage((i) => Math.max(0, i - 1))} disabled={page === 0} className="btn-ghost px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-40">
              <IconChevronLeft className="w-4 h-4" /> {t('crs.prev')}
            </button>
            <span className="text-xs text-slate-400">{t('crs.page')} {page + 1} {t('crs.of')} {pages.length}</span>
            {page + 1 < pages.length ? (
              <button onClick={() => setPage((i) => i + 1)} className="btn-ghost px-4 py-2 inline-flex items-center gap-1.5">
                {t('crs.next')} <IconChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} className="btn-primary px-4 py-2 inline-flex items-center gap-1.5">
                <IconCheck className="w-4 h-4" /> {done ? t('crs.nextLesson') : t('crs.markComplete')} <IconArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <button onClick={() => navigate('/learn/exercise')} className="self-center inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200">
            <IconBolt className="w-3.5 h-3.5" /> {t('crs.practiceInteractively')}
          </button>
        </div>
      </div>
    </div>
  )
}
