import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading, Tabs, type TabItem, Spinner } from '../../components/ui'
import { IconBook, IconPlay, IconStar } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { useContentState } from '../../services/content/progress'
import { useTargetLanguageCode } from '../../lib/language'
import { isImageCover } from '../../lib/cover'
import type { Course } from '@shared/types'

type Filter = 'all' | 'progress' | 'free'
const FILTERS: TabItem<Filter>[] = [
  { id: 'all', label: 'All courses' },
  { id: 'progress', label: 'In progress' },
  { id: 'free', label: 'Free' }
]

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
          <p className="text-[11px] text-white/70 mt-0.5 inline-flex items-center gap-1"><IconStar className="w-3 h-3" /> {course.rating} · {price}</p>
        </div>
      </div>
      <div className="px-1.5 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-500">{course.enrollmentCount.toLocaleString()} learners</span>
          <span className="text-[11px] font-semibold text-slate-300">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>
    </button>
  )
}

export default function CoursesPage(): JSX.Element {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const lang = useTargetLanguageCode()
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

  const filtered = courses.filter((c) => {
    if (filter === 'progress') return isEnrolled(c.id) && progressFor(c.id) < 100
    if (filter === 'free') return c.pricing.kind === 'free'
    return true
  })

  const inProgress = courses.filter((c) => isEnrolled(c.id) && progressFor(c.id) > 0 && progressFor(c.id) < 100)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-sm text-slate-400 mt-1">Video-led courses and coursebooks — follow each path in order, pass the final exam, earn a certificate.</p>
        </div>

        {/* Continue learning */}
        {filter === 'all' && inProgress.length > 0 && (
          <div>
            <SectionHeading title="Continue learning" subtitle="Pick up where you left off" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inProgress.map((c) => (
                <CourseCard key={c.id} course={c} progress={progressFor(c.id)} onOpen={() => navigate(`/course/${c.id}`)} />
              ))}
            </div>
          </div>
        )}

        <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />

        {loading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 text-center">
            <p className="text-sm text-slate-400">No courses match this filter yet.</p>
          </div>
        ) : (
          <div>
            <SectionHeading title={filter === 'free' ? 'Free courses' : filter === 'progress' ? 'In progress' : 'All courses'} subtitle={`${filtered.length} course${filtered.length === 1 ? '' : 's'}`} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} progress={progressFor(c.id)} onOpen={() => navigate(`/course/${c.id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
