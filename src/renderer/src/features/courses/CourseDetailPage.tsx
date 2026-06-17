import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Spinner } from '../../components/ui'
import { RichTextView } from '../../components/forms'
import {
  IconBookmark,
  IconCheck,
  IconChevronLeft,
  IconDownload,
  IconHeart,
  IconLock,
  IconPlay,
  IconRefresh,
  IconStar,
  IconTrophy
} from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { useAppStore } from '../../store/useAppStore'
import { isImageCover } from '../../lib/cover'
import { buildCourseView } from '../../services/content/courseModel'
import { useContentState, recordFinalExam, issueCertificate, getCertificate } from '../../services/content/progress'
import { getFinalExam } from '../../services/content/exams'
import { logActivity } from '../../services/activity'
import { downloadCertificate } from '../../lib/certificate'
import type { Lesson } from '@shared/types'
import ExamRunner from './ExamRunner'
import CoursePath from './CoursePath'
import PaywallOverlay from './PaywallOverlay'
import CommentsSection from '../../components/CommentsSection'
import { studio } from '../../services/studio/store'
import { courseAccess } from '../../services/access/entitlement'

const FALLBACK_COURSE = 'c_everyday'
const FINAL_PASS = 65

function Stars({ n, className }: { n: number; className?: string }): JSX.Element {
  return (
    <span className={cn('inline-flex', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} className={cn('w-4 h-4', i < n ? 'text-amber-300' : 'text-white/15')} />
      ))}
    </span>
  )
}

export default function CourseDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { courseId: param } = useParams()
  const courseId = param ?? FALLBACK_COURSE
  const userId = backend.currentUserId()
  const profile = useAppStore((s) => s.profile)
  const content = useContentState() // re-render when completion/cert changes

  const { data: course, loading: courseLoading } = useBackendQuery(() => backend.getCourse(courseId), [courseId], null)
  const { data: units } = useBackendQuery(() => backend.listUnits(courseId), [courseId], [])
  const { data: lessonsByUnit } = useBackendQuery(
    async () => {
      const us = await backend.listUnits(courseId)
      const lists = await Promise.all(us.map((u) => backend.listLessons(u.id)))
      return lists.flat()
    },
    [courseId],
    [] as Lesson[]
  )
  const { data: enrollments, refresh: refreshEnroll } = useBackendQuery(
    () => (userId ? backend.myEnrollments(userId) : Promise.resolve([])),
    [userId],
    []
  )
  const { data: reviews, refresh: refreshReviews } = useBackendQuery(() => backend.listReviews(courseId), [courseId], [])
  const { data: teacher } = useBackendQuery(
    () => (course ? backend.getUser(course.teacherId) : Promise.resolve(null)),
    [course?.teacherId],
    null
  )

  const enrollment = enrollments.find((e) => e.courseId === courseId)
  const enrolled = !!enrollment

  // Entitlement: paid courses unlock via orders/subscriptions (re-locks on
  // expiry); free courses unlock via enrolment. See services/access.
  const { data: access, refresh: refreshAccess } = useBackendQuery(
    () => (course ? courseAccess(userId, course, enrolled) : Promise.resolve(null)),
    [userId, courseId, enrolled, course?.pricing.kind],
    null
  )
  const unlocked = access?.unlocked ?? (course?.pricing.kind === 'free' ? enrolled : false)
  const [showPaywall, setShowPaywall] = useState(false)

  const view = useMemo(
    () => buildCourseView(courseId, units, lessonsByUnit),
    // content is a dep so the view recomputes after a lesson/exam completes
    [courseId, units, lessonsByUnit, content]
  )

  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewStars, setReviewStars] = useState(5)

  // #B3 — if the user already reviewed, the composer edits that review (the
  // backend replaces one-per-user). Pre-fill it so they aren't writing blind.
  const myReview = userId ? reviews.find((r) => r.userId === userId) : undefined
  useEffect(() => {
    if (myReview) {
      setReviewStars(myReview.rating)
      setReviewText(myReview.text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id])

  useEffect(() => {
    if (!userId) return
    backend.isLiked(userId, `course_${courseId}`).then(setLiked).catch(() => {})
    backend.isSaved(userId, { kind: 'course', id: courseId }).then(setSaved).catch(() => {})
  }, [userId, courseId])

  // Keep the backend enrollment % in sync with computed lesson progress.
  useEffect(() => {
    if (userId && enrolled && enrollment && view.totalCount > 0 && enrollment.progress !== view.progress) {
      backend.setEnrollmentProgress(userId, courseId, view.progress).then(() => refreshEnroll()).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enrolled, view.progress, courseId])

  // #B5 — courses without a final exam issue the certificate automatically once
  // every lesson is complete (meta rail promises "Certificate · On completion").
  useEffect(() => {
    if (course && view.completed && !view.hasFinal && !view.hasCertificate) {
      issueCertificate({ courseId, courseTitle: course.title, learnerName: profile?.name ?? 'Learner', score: 100 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, view.completed, view.hasFinal, view.hasCertificate])

  function openLesson(lesson: Lesson): void {
    const base = lesson.kind === 'rule' ? `/learn/book/${courseId}` : `/learn/${courseId}`
    navigate(`${base}/${lesson.id}`)
  }

  const [buying, setBuying] = useState(false)
  const [managing, setManaging] = useState(false)

  /** Free courses enrol immediately; paid courses go through the paywall. */
  async function handleEnrollFree(): Promise<void> {
    if (!userId || !course) return
    setBuying(true)
    await backend.enroll(userId, courseId).catch(() => {})
    await logActivity({ userId, kind: 'course_enroll', meta: { courseId } }).catch(() => {})
    setBuying(false)
    refreshEnroll()
    refreshAccess()
    if (view.next) openLesson(view.next)
  }

  /** Called after the paywall grants access — refresh + drop into the course. */
  function handleUnlocked(): void {
    setShowPaywall(false)
    refreshEnroll()
    refreshAccess()
    if (view.next) openLesson(view.next)
  }

  /** Cancel keeps access to the period end; renew (from expired) reopens it. */
  async function handleCancelSub(): Promise<void> {
    if (!access?.subscription) return
    setManaging(true)
    await studio.cancelSubscription(access.subscription.id).catch(() => {})
    setManaging(false)
    refreshAccess()
  }
  async function handleResumeSub(): Promise<void> {
    if (!access?.subscription) return
    setManaging(true)
    await studio.renewSubscription(access.subscription.id).catch(() => {})
    setManaging(false)
    refreshAccess()
  }

  function handleContinue(): void {
    if (view.next) openLesson(view.next)
    else if (view.finalUnlocked && view.hasFinal && !view.finalPassed) setShowFinal(true)
  }

  async function onFinalComplete(score: number, passed: boolean): Promise<void> {
    recordFinalExam(courseId, score, FINAL_PASS)
    if (userId) {
      await backend.recordExamAttempt({
        userId, kind: 'custom', language: (course?.targetLanguage ?? 'en'),
        overall: score, sections: { final: score }, feedback: passed ? 'Course final exam passed.' : 'Course final exam — keep practising.'
      }).catch(() => {})
      await logActivity({ userId, kind: 'exam_attempt', xp: passed ? 100 : 20, meta: { courseId, score } }).catch(() => {})
    }
    if (passed) {
      issueCertificate({ courseId, courseTitle: course?.title ?? 'Course', learnerName: profile?.name ?? 'Learner', score })
      if (userId) backend.setEnrollmentProgress(userId, courseId, 100).then(() => refreshEnroll()).catch(() => {})
    }
  }

  async function submitReview(): Promise<void> {
    if (!userId || !reviewText.trim()) return
    await backend.createReview({ courseId, userId, rating: reviewStars, text: reviewText.trim() }).catch(() => {})
    setReviewText('')
    refreshReviews()
  }

  if (courseLoading) {
    return <div className="h-full flex items-center justify-center"><Spinner /></div>
  }
  if (!course) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-slate-400">Course not found.</p>
        <button onClick={() => navigate('/courses')} className="btn-primary px-5 py-2">Back to courses</button>
      </div>
    )
  }

  const cert = getCertificate(courseId)
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : course.rating
  const learnPoints = [
    `Work through ${view.totalCount} lessons at ${course.level} level`,
    'Practise with video, exercises and checkpoints',
    course.capstone ? course.capstone : 'Build real, usable skills you can apply right away',
    'Earn a certificate when you pass the final exam'
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <div className={cn('relative px-6 pt-4 pb-6 overflow-hidden', !isImageCover(course.bannerUrl) && `bg-gradient-to-br ${course.cover}`)}>
        {isImageCover(course.bannerUrl) && (
          <>
            <img src={course.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30" />
          </>
        )}
        <button onClick={() => navigate('/courses')} className="relative z-10 text-white/80 hover:text-white transition mb-4">
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 text-white rounded-full px-2 py-1">{course.level}</span>
            {view.hasFinal && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-400/90 text-black rounded-full px-2 py-1">
                <IconTrophy className="w-3 h-3" /> Ends with exam
              </span>
            )}
            {view.completed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-400/90 text-black rounded-full px-2 py-1">
                <IconCheck className="w-3 h-3" /> Completed
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{course.title}</h1>
          <p className="text-sm text-white/85 mt-1 max-w-2xl">{course.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/85">
            {reviews.length > 0
              ? <span className="inline-flex items-center gap-1.5"><Stars n={Math.round(avgRating)} /> {avgRating.toFixed(1)} ({reviews.length})</span>
              : <span className="font-semibold text-emerald-200">New course</span>}
            {course.enrollmentCount > 0 && <span>{course.enrollmentCount.toLocaleString()} learners</span>}
            <span>{view.totalCount} lessons · {course.hours}h</span>
          </div>
          {teacher && (
            <button onClick={() => navigate('/channel')} className="flex items-center gap-2 mt-3 hover:opacity-90">
              <AvatarCircle name={teacher.name} size="sm" />
              <span className="text-sm text-white font-medium">{teacher.name}</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-6 w-full">
        {/* Action row */}
        <div className="flex items-center gap-3 mb-3">
          {!unlocked ? (
            course.pricing.kind === 'free' ? (
              <button onClick={handleEnrollFree} disabled={buying} className="btn-primary px-8 py-3 disabled:opacity-60">
                {buying ? 'Enrolling…' : 'Enroll free →'}
              </button>
            ) : (
              <button onClick={() => setShowPaywall(true)} className="btn-primary px-8 py-3">
                {access?.status === 'expired'
                  ? `Renew · $${course.pricing.kind === 'sub' ? `${course.pricing.usdPerMo}/mo` : ''} →`
                  : course.pricing.kind === 'one-off'
                    ? `Buy · $${course.pricing.usd} →`
                    : `Subscribe · $${course.pricing.usdPerMo}/mo →`}
              </button>
            )
          ) : view.next ? (
            <button onClick={handleContinue} className="btn-primary px-8 py-3">Continue learning →</button>
          ) : view.hasFinal && !view.finalPassed ? (
            <button onClick={() => setShowFinal(true)} className="btn-primary px-8 py-3 inline-flex items-center gap-2">
              <IconTrophy className="w-4 h-4" /> Take final exam
            </button>
          ) : (
            <button onClick={() => cert && downloadCertificate(cert)} className="btn-primary px-8 py-3 inline-flex items-center gap-2">
              <IconDownload className="w-4 h-4" /> Download certificate
            </button>
          )}
          <button onClick={async () => { if (userId) { const r = await backend.like(userId, `course_${courseId}`); setLiked(r.liked) } }} className={cn('w-11 h-11 rounded-full border flex items-center justify-center transition', liked ? 'bg-rose-500/15 border-rose-400/40 text-rose-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Like">
            <IconHeart className="w-5 h-5" />
          </button>
          <button onClick={async () => { if (userId) { const r = await backend.save(userId, { kind: 'course', id: courseId }); setSaved(r.saved) } }} className={cn('w-11 h-11 rounded-full border flex items-center justify-center transition', saved ? 'bg-brand-500/15 border-brand-400/40 text-brand-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Save">
            <IconBookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar (enrolled) */}
        {enrolled && (
          <div className="mb-6 max-w-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">{view.completedCount}/{view.totalCount} lessons</span>
              <span className="text-xs font-semibold text-brand-300">{view.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-grad-brand rounded-full transition-all" style={{ width: `${view.progress}%` }} />
            </div>
          </div>
        )}

        {/* Subscription lifecycle panel */}
        {course.pricing.kind === 'sub' && (access?.status === 'subscribed' || access?.status === 'expired') && (
          <div className={cn(
            'mb-6 max-w-md rounded-2xl border p-4 flex items-center gap-3',
            access.status === 'expired' ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'
          )}>
            <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              access.status === 'expired' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/15 text-emerald-300')}>
              {access.status === 'expired' ? <IconLock className="w-5 h-5" /> : <IconRefresh className="w-5 h-5" />}
            </span>
            <div className="flex-1 min-w-0">
              {access.status === 'expired' ? (
                <>
                  <p className="text-sm font-bold text-white">Subscription expired</p>
                  <p className="text-xs text-slate-300">Access ended{access.expiresAt ? ` ${new Date(access.expiresAt).toLocaleDateString()}` : ''}. Renew to continue.</p>
                </>
              ) : access.canceling ? (
                <>
                  <p className="text-sm font-bold text-white">Subscription ending</p>
                  <p className="text-xs text-slate-300">You keep access until {access.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'the period ends'}.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-white">Subscription active</p>
                  <p className="text-xs text-slate-300">Renews {access.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'monthly'} · ${course.pricing.usdPerMo}/mo</p>
                </>
              )}
            </div>
            {access.status === 'expired' ? (
              <button onClick={() => setShowPaywall(true)} className="btn-primary px-4 py-2 text-sm shrink-0">Renew</button>
            ) : access.canceling ? (
              <button onClick={handleResumeSub} disabled={managing} className="btn-primary px-4 py-2 text-sm shrink-0 disabled:opacity-50">{managing ? '…' : 'Resume'}</button>
            ) : (
              <button onClick={handleCancelSub} disabled={managing} className="btn-ghost px-4 py-2 text-sm shrink-0 disabled:opacity-50">{managing ? '…' : 'Cancel'}</button>
            )}
          </div>
        )}

        {/* Final exam panel */}
        {showFinal && (
          <div className="mb-6 max-w-2xl">
            <ExamRunner
              title={`${course.title} · Final exam`}
              subtitle={`Pass with ${FINAL_PASS}% to complete the course and earn your certificate.`}
              questions={getFinalExam(courseId)}
              passMark={FINAL_PASS}
              onComplete={onFinalComplete}
              onExit={() => setShowFinal(false)}
            />
          </div>
        )}

        {/* Certificate banner */}
        {cert && (
          <div className="mb-6 rounded-card border border-emerald-400/30 bg-emerald-500/10 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center"><IconTrophy className="w-6 h-6" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Course complete — {cert.score}%</p>
              <p className="text-xs text-slate-300">Certificate issued {new Date(cert.issuedAt).toLocaleDateString()}.</p>
            </div>
            <button onClick={() => downloadCertificate(cert)} className="btn-ghost px-4 py-2 text-sm inline-flex items-center gap-1.5">
              <IconDownload className="w-4 h-4" /> Download
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="flex flex-col gap-7">
            <section>
              <h2 className="text-base font-bold mb-2">About this course</h2>
              {course.about?.trim()
                ? <RichTextView html={course.about} />
                : <p className="text-sm text-slate-300 leading-relaxed">{course.description}</p>}
            </section>

            <section>
              <h2 className="text-base font-bold mb-3">What you'll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {learnPoints.map((l) => (
                  <div key={l} className="flex items-start gap-2 text-sm text-slate-300">
                    <IconCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {l}
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section>
              <h2 className="text-base font-bold mb-1">Curriculum</h2>
              {!unlocked && (
                <p className="text-xs text-slate-400 mb-3 inline-flex items-center gap-1.5">
                  <IconLock className="w-3.5 h-3.5" />
                  {course.pricing.kind === 'free'
                    ? 'Enroll free to unlock all lessons.'
                    : access?.status === 'expired'
                      ? 'Your access expired — renew to unlock all lessons again.'
                      : view.ordered.some((l) => l.preview)
                        ? 'Try the free preview, then buy to unlock every lesson.'
                        : 'Buy this course to unlock all lessons.'}
                </p>
              )}
              <CoursePath
                view={view}
                unlocked={unlocked}
                onOpenLesson={(l) => openLesson(l)}
                onOpenFinal={() => setShowFinal(true)}
                onLocked={() => course.pricing.kind === 'free' ? handleEnrollFree() : setShowPaywall(true)}
              />
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-base font-bold mb-3">Reviews</h2>
              {enrolled && (view.completedCount > 0 || myReview) && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-300">{myReview ? 'Edit your review:' : 'Your rating:'}</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setReviewStars(i + 1)} title={`${i + 1} stars`}>
                        <IconStar className={cn('w-5 h-5', i < reviewStars ? 'text-amber-300' : 'text-white/15')} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share what you thought of this course…"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none"
                    rows={2}
                  />
                  <button onClick={submitReview} disabled={!reviewText.trim()} className="btn-primary mt-2 px-4 py-2 text-sm disabled:opacity-40">{myReview ? 'Update review' : 'Post review'}</button>
                </div>
              )}
              {enrolled && view.completedCount === 0 && !myReview && (
                <p className="text-xs text-slate-500 mb-4">Complete at least one lesson to leave a review.</p>
              )}
              <div className="flex flex-col gap-3">
                {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet — be the first.</p>}
                {reviews.map((r) => (
                  <ReviewRow key={r.id} userId={r.userId} stars={r.rating} text={r.text} />
                ))}
              </div>
            </section>

            {/* Comments (YouTube/IG-style — anyone can post + reply, no enrollment needed) */}
            <CommentsSection targetKind="course" targetId={courseId} />
          </div>

          {/* Meta rail */}
          <aside className="lg:border-l lg:border-white/10 lg:pl-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 text-sm">
              {[
                ['Level', course.level],
                ['Lessons', String(view.totalCount)],
                ['Duration', `${course.hours}h`],
                ['Price', course.pricing.kind === 'free' ? 'Free' : course.pricing.kind === 'one-off' ? `$${course.pricing.usd}` : `$${course.pricing.usdPerMo}/mo`],
                ['Certificate', view.hasFinal ? 'On final-exam pass' : 'On completion']
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {showPaywall && access && (
        <PaywallOverlay
          course={course}
          teacherName={teacher?.name}
          access={access}
          lessonCount={view.totalCount}
          hasFinal={view.hasFinal}
          onUnlocked={handleUnlocked}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  )
}

function ReviewRow({ userId, stars, text }: { userId: string; stars: number; text: string }): JSX.Element {
  const { data: user } = useBackendQuery(() => backend.getUser(userId), [userId], null)
  const name = user?.name ?? 'Learner'
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <AvatarCircle name={name} size="sm" />
        <span className="text-sm font-semibold text-white">{name}</span>
        <Stars n={stars} className="ml-auto" />
      </div>
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  )
}
