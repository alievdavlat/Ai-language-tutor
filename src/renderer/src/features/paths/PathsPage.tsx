import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Course, Enrollment, ID } from '@shared/types'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import { IconBook, IconCheck, IconClipboard, IconStar, IconTrophy, IconUsers } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { useTargetLanguageCode } from '../../lib/language'
import { useT } from '../../i18n'
import {
  paths as pathStore,
  pathCourses,
  pathProgress,
  pathStats,
  usePaths,
  type LearningPath
} from '../../services/paths/store'
import PlacementQuiz from './PlacementQuiz'

interface CardProps {
  path: LearningPath
  byId: Map<ID, Course>
  enrollments: Enrollment[]
  enrolled: boolean
  recommended: boolean
  onEnroll: (path: LearningPath) => void
  onContinue: (path: LearningPath) => void
}

function PathCard({ path, byId, enrollments, enrolled, recommended, onEnroll, onContinue }: CardProps): JSX.Element {
  const t = useT()
  const stats = pathStats(path, byId)
  const progress = enrolled ? pathProgress(path, byId, enrollments) : null
  const enrolledCount = pathStore.enrolledCount(path.id)

  return (
    <article
      className={cn(
        'rounded-card border overflow-hidden transition group',
        recommended ? 'border-brand-400/60 ring-1 ring-brand-400/40' : 'border-white/10 hover:border-white/20',
        'bg-white/[0.025]'
      )}
    >
      <div className={cn('relative h-32 bg-gradient-to-br', path.cover)}>
        {path.thumbnailUrl && (
          <img src={path.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-black/25" />
        {recommended && (
          <span className="absolute top-3 right-3 rounded-full bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 shadow-lg">★ {t('misc.forYou')}</span>
        )}
        <span className="absolute top-3 left-3 rounded-full bg-white/15 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">{t('misc.specialization')}</span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-white">
          <IconBook className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{stats.courses} {stats.courses === 1 ? t('misc.course') : t('misc.courses')} · {stats.hours}h</span>
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/30 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5">{stats.levelSpan}</span>
      </div>
      <div className="p-5">
        <h3 className="text-base font-bold text-white">{path.title}</h3>
        <p className="text-xs text-slate-400 mt-1">{path.subtitle}</p>

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          {stats.rating > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-300"><IconStar className="w-3.5 h-3.5" /> <b className="text-white">{stats.rating}</b></span>
          )}
          <span className="inline-flex items-center gap-1">
            <IconUsers className="w-3.5 h-3.5" /> {enrolledCount > 0 ? `${enrolledCount.toLocaleString()} ${t('misc.enrolled')}` : t('misc.beTheFirst')}
          </span>
        </div>

        {/* Member courses */}
        <ul className="mt-3 space-y-1">
          {pathCourses(path, byId).map((c) => {
            const cp = enrollments.find((e) => e.courseId === c.id)?.progress ?? 0
            return (
              <li key={c.id} className="flex items-center gap-2 text-xs">
                <span className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0', cp >= 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-slate-500')}>
                  {cp >= 100 ? <IconCheck className="w-3 h-3" /> : null}
                </span>
                <span className={cn('truncate', cp >= 100 ? 'text-slate-400 line-through' : 'text-slate-300')}>{c.title}</span>
              </li>
            )
          })}
        </ul>

        {progress != null && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">{t('misc.yourProgress')}</span>
              <span className="text-[11px] font-bold text-brand-200">{progress}%</span>
            </div>
            <ProgressBar value={progress} color="brand" />
          </div>
        )}

        <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3 flex items-start gap-2.5">
          <IconTrophy className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">{t('misc.capstone')}</p>
            <p className="text-xs text-slate-200 mt-0.5 leading-snug">{path.capstone}</p>
          </div>
        </div>

        {enrolled ? (
          <button onClick={() => onContinue(path)} className="btn-primary w-full mt-4 text-sm py-2">
            {progress != null && progress >= 100 ? 'Review path' : 'Continue path'}
          </button>
        ) : (
          <button onClick={() => onEnroll(path)} className="btn-primary w-full mt-4 text-sm py-2">
            Enroll in path
          </button>
        )}
      </div>
    </article>
  )
}

export default function PathsPage(): JSX.Element {
  const navigate = useNavigate()
  const userId = backend.currentUserId()
  const { list: pathList } = usePaths()
  const [quizOpen, setQuizOpen] = useState(false)
  const [recommendedId, setRecommendedId] = useState<string | null>(null)
  const [enrolledIds, setEnrolledIds] = useState<string[]>(() => (userId ? pathStore.myPaths(userId) : []))
  const recRef = useRef<HTMLDivElement | null>(null)

  const { data: courses } = useBackendQuery(() => backend.listCourses(), [], [] as Course[])
  const { data: enrollments, refresh: refreshEnrollments } = useBackendQuery(
    () => (userId ? backend.myEnrollments(userId) : Promise.resolve([])),
    [userId],
    [] as Enrollment[]
  )

  const byId = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  // Scroll the recommended path into view once it's set.
  useEffect(() => {
    if (recommendedId && recRef.current) {
      recRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [recommendedId])

  const enroll = async (path: LearningPath): Promise<void> => {
    if (!userId) { navigate('/sign-in'); return }
    pathStore.enroll(userId, path.id)
    // Enrolling in a path enrols you in every member course (real enrolment).
    await Promise.all(path.courseIds.map((cid) => backend.enroll(userId, cid).catch(() => {})))
    setEnrolledIds(pathStore.myPaths(userId))
    refreshEnrollments()
  }

  const cont = (path: LearningPath): void => {
    // Open the first not-yet-finished member course (else the first course).
    const member = pathCourses(path, byId)
    const next = member.find((c) => (enrollments.find((e) => e.courseId === c.id)?.progress ?? 0) < 100)
    const target = next ?? member[0]
    navigate(target ? `/course/${target.id}` : '/courses')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Career tracks"
          title="Learning paths"
          subtitle="Multi-course specializations that end with a capstone project and a certificate."
          back="/courses"
          crumbs={[{ label: 'Courses', to: '/courses' }, { label: 'Paths' }]}
        />

        {/* Banner */}
        <div className="rounded-card p-5 bg-gradient-to-br from-brand-500/15 to-violet-500/15 border border-brand-400/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center"><IconClipboard className="w-7 h-7 text-brand-200" /></div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Not sure where to start?</p>
            <p className="text-xs text-slate-300">Take a 1-min quiz and we'll recommend the right path.</p>
          </div>
          <button onClick={() => setQuizOpen(true)} className="btn-primary text-xs px-4 py-2">Take quiz</button>
        </div>

        <SectionHeading title="Featured tracks" subtitle={`${pathList.length} specializations · curated by us`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {pathList.map((p) => {
            const isRec = recommendedId === p.id
            const card = (
              <PathCard
                path={p}
                byId={byId}
                enrollments={enrollments}
                enrolled={enrolledIds.includes(p.id)}
                recommended={isRec}
                onEnroll={(path) => void enroll(path)}
                onContinue={cont}
              />
            )
            return isRec ? <div key={p.id} ref={recRef}>{card}</div> : <div key={p.id}>{card}</div>
          })}
        </div>

        {!courses.length && (
          <p className="text-center text-sm text-slate-500 py-6">Loading your courses…</p>
        )}
      </div>

      {quizOpen && (
        <PlacementQuiz
          paths={pathList}
          onClose={() => setQuizOpen(false)}
          onRecommend={(id) => setRecommendedId(id)}
        />
      )}
    </div>
  )
}
