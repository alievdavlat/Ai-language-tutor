import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Spinner } from '../../components/ui'
import {
  IconArrowRight,
  IconBook,
  IconBolt,
  IconCheck,
  IconChevronLeft,
  IconDownload,
  IconLock,
  IconPlay,
  IconVolume,
  IconYouTube
} from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { buildCourseView } from '../../services/content/courseModel'
import { getLessonContent, type LessonMaterial } from '../../services/content/lessonContent'
import {
  useContentState, isLessonComplete, markLessonComplete, recordCheckpoint
} from '../../services/content/progress'
import { getCheckpointQuiz } from '../../services/content/exams'
import { logActivity } from '../../services/activity'
import { courseAccess } from '../../services/access/entitlement'
import YouTubeEmbed from '../../components/content/YouTubeEmbed'
import { RichTextView } from '../../components/forms'
import ExamRunner from './ExamRunner'
import type { Lesson } from '@shared/types'

function ytId(url?: string): string | null {
  if (!url) return null
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/) || url.match(/embed\/([^?]+)/)
  return m ? m[1] : null
}

type Tab = 'materials' | 'transcript' | 'about'

function MaterialRow({ m }: { m: LessonMaterial }): JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const isAudio = m.kind === 'audio'

  function toggleAudio(): void {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) } else { el.pause(); setPlaying(false) }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
      <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isAudio ? 'bg-brand-500/15 text-brand-300' : 'bg-rose-500/15 text-rose-300')}>
        {isAudio ? <IconVolume className="w-5 h-5" /> : <IconBook className="w-5 h-5" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
        <p className="text-xs text-slate-500">{isAudio ? 'Audio' : 'PDF'} · {m.size}</p>
      </div>
      {isAudio ? (
        <>
          <audio ref={audioRef} src={m.url} onEnded={() => setPlaying(false)} preload="none" />
          <button onClick={toggleAudio} className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition" title={playing ? 'Pause' : 'Play'}>
            <IconPlay className="w-[18px] h-[18px]" />
          </button>
        </>
      ) : (
        <a href={m.url} target="_blank" rel="noreferrer" download className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition" title="Download">
          <IconDownload className="w-[18px] h-[18px]" />
        </a>
      )}
    </div>
  )
}

export default function ClassroomPage(): JSX.Element {
  const navigate = useNavigate()
  const { courseId = '', lessonId = '' } = useParams()
  const userId = backend.currentUserId()
  const content = useContentState()
  const [tab, setTab] = useState<Tab>('materials')

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
  const { data: teacher } = useBackendQuery(
    () => (course ? backend.getUser(course.teacherId) : Promise.resolve(null)),
    [course?.teacherId],
    null
  )

  const view = useMemo(() => buildCourseView(courseId, units, lessons), [courseId, units, lessons, content])
  const lesson = lessons.find((l) => l.id === lessonId)
  const unit = units.find((u) => u.id === lesson?.unitId)
  const unitLessons = view.units.find((u) => u.unit.id === unit?.id)?.lessons ?? []
  const done = isLessonComplete(lessonId)

  // #B1 — entitlement guard. A paid lesson opened by deep link / curriculum
  // rail must re-check access; non-preview lessons of a course the learner
  // hasn't bought (or whose sub lapsed) bounce to the course page paywall.
  const { data: enrollments } = useBackendQuery(
    () => (userId ? backend.myEnrollments(userId) : Promise.resolve([])),
    [userId],
    []
  )
  useEffect(() => {
    if (!course || !lesson) return
    if (course.pricing.kind === 'free') return
    if (lesson.preview) return
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

  // Next lesson in global order.
  const orderIdx = view.ordered.findIndex((l) => l.id === lessonId)
  const nextLesson = orderIdx >= 0 ? view.ordered[orderIdx + 1] : null

  function syncProgress(): void {
    if (!userId) return
    const fresh = buildCourseView(courseId, units, lessons)
    backend.setEnrollmentProgress(userId, courseId, fresh.progress).catch(() => {})
  }

  function goNext(): void {
    if (nextLesson) {
      const base = nextLesson.kind === 'rule' ? `/learn/book/${courseId}` : `/learn/${courseId}`
      navigate(`${base}/${nextLesson.id}`)
    } else {
      navigate(`/course/${courseId}`)
    }
  }

  function complete(): void {
    if (!lesson) return
    // #B2 — already done → this is just "Next", never re-award XP. XP is logged
    // only on the first completion (markLessonComplete is idempotent, but the
    // activity event must not fire again on repeat clicks).
    if (done) {
      goNext()
      return
    }
    markLessonComplete(lesson.id)
    if (userId) logActivity({ userId, kind: 'lesson_complete', xp: 20, minutes: lesson.durationMin, meta: { courseId, lessonId: lesson.id } }).catch(() => {})
    syncProgress()
    goNext()
  }

  function onCheckpoint(score: number, passed: boolean): void {
    if (!lesson) return
    recordCheckpoint(lesson.id, score) // marks complete when passed
    if (userId) logActivity({ userId, kind: 'exam_attempt', xp: passed ? 40 : 10, meta: { courseId, lessonId: lesson.id, score } }).catch(() => {})
    syncProgress()
  }

  if (!lesson) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Spinner />
        <button onClick={() => navigate(`/course/${courseId}`)} className="btn-ghost px-4 py-2 text-sm">Back to course</button>
      </div>
    )
  }

  const lc = getLessonContent(lesson)
  const videoId = ytId(lesson.videoUrl)

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3 backdrop-blur-xl bg-canvas-soft/40 shrink-0">
        <button onClick={() => navigate(`/course/${courseId}`)} className="text-slate-400 hover:text-white transition" title="Back to course">
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{lesson.title}</p>
          <p className="text-[11px] text-slate-400">{course?.title} · {unit?.title}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 w-full">
          {/* Main */}
          <div className="flex flex-col gap-5">
            {lesson.kind === 'exam' ? (
              <ExamRunner
                title={lesson.title}
                subtitle="Pass this checkpoint to unlock the next unit."
                questions={getCheckpointQuiz(lesson.id)}
                passMark={60}
                onComplete={onCheckpoint}
                onExit={goNext}
              />
            ) : (
              <>
                {/* Video */}
                {videoId ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-video ring-1 ring-white/10 bg-black">
                    <YouTubeEmbed videoId={videoId} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                    <span className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-300 items-center justify-center mb-3"><IconBolt className="w-7 h-7" /></span>
                    <p className="text-sm text-slate-300">This is a practice lesson. Try the interactive exercises, then mark it complete.</p>
                  </div>
                )}

                {/* Title + teacher */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold tracking-tight">{lc.videoTitle}</h1>
                    {teacher && (
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => navigate('/channel')} className="flex items-center gap-2 hover:opacity-80 transition">
                          <AvatarCircle name={teacher.name} size="sm" />
                          <span className="text-sm text-slate-300">{teacher.name}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {done && <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/15 rounded-full px-3 py-1"><IconCheck className="w-3.5 h-3.5" /> Completed</span>}
                </div>

                {/* Teacher-authored rich material */}
                {lc.body && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <RichTextView html={lc.body} />
                  </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-white/10">
                  {(['materials', 'transcript', 'about'] as Tab[]).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition', tab === t ? 'border-brand-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200')}>
                      {t}
                    </button>
                  ))}
                </div>

                {tab === 'materials' && (
                  <div className="flex flex-col gap-2">
                    {lc.materials.map((m) => <MaterialRow key={m.name} m={m} />)}
                  </div>
                )}
                {tab === 'transcript' && <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{lc.transcript}</p>}
                {tab === 'about' && <p className="text-sm text-slate-300 leading-relaxed">{lc.about}</p>}

                {/* Footer actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={complete} className={cn('px-5 py-2.5 inline-flex items-center gap-2 rounded-pill font-semibold transition', done ? 'bg-emerald-500/15 text-emerald-300' : 'btn-ghost')}>
                    <IconCheck className="w-4 h-4" /> {done ? (nextLesson ? 'Completed · Next' : 'Completed') : 'Mark complete'}
                  </button>
                  <button onClick={() => navigate('/learn/exercise')} className="btn-primary flex-1 py-2.5 inline-flex items-center justify-center gap-2">
                    <IconBolt className="w-4 h-4" /> Practice exercises <IconArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Curriculum rail */}
          <aside className="lg:border-l lg:border-white/10 lg:pl-6">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">{unit?.title}</p>
            <div className="flex flex-col gap-1">
              {unitLessons.map((item) => {
                const active = item.id === lessonId
                const locked = item.state === 'locked'
                const base = item.kind === 'rule' ? `/learn/book/${courseId}` : `/learn/${courseId}`
                return (
                  <button
                    key={item.id}
                    onClick={() => !locked && navigate(`${base}/${item.id}`)}
                    disabled={locked}
                    className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition', active ? 'bg-brand-500/15 ring-1 ring-brand-400/30' : locked ? 'opacity-50' : 'hover:bg-white/5')}
                  >
                    <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                      {item.state === 'done' ? <IconCheck className="w-4 h-4 text-emerald-300" /> : locked ? <IconLock className="w-3.5 h-3.5 text-slate-600" /> : <IconPlay className="w-3.5 h-3.5 text-brand-300" />}
                    </span>
                    <span className={cn('text-sm truncate', active ? 'text-white font-semibold' : 'text-slate-300')}>{item.title}</span>
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
