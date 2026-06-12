import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/classnames'
import { IconArrowRight } from '../../../components/icons'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { dateTime } from '../../../lib/time'
import type { Course, LiveAnnouncement, Challenge, PlatformUser } from '@shared/types'

interface Slide {
  key: string
  badge: string
  badgeTone: string
  title: string
  subtitle: string
  meta: string
  cta: string
  cover: string
  /** Background photo (data: or remote URL). Falls back to the `cover` gradient. */
  image?: string
  to: string
}

/**
 * Home hero. Teacher announcements (posted from the Teacher dashboard via
 * backend.createAnnouncement) lead the carousel, followed by a live top course
 * and the most-joined active challenge — all real backend data (#28).
 */
export default function HeroCarousel(): JSX.Element {
  const navigate = useNavigate()
  const [i, setI] = useState(0)

  const announcements = useBackendQuery(() => backend.listAnnouncements(), [], [] as LiveAnnouncement[])
  const courses = useBackendQuery(() => backend.listCourses(), [], [] as Course[])
  const challenges = useBackendQuery(() => backend.listChallenges({ active: true }), [], [] as Challenge[])
  const teachers = useBackendQuery(async () => {
    const ids = Array.from(new Set(announcements.data.map((a) => a.teacherId)))
    const users = await Promise.all(ids.map((id) => backend.getUser(id)))
    const map: Record<string, PlatformUser> = {}
    for (const u of users) if (u) map[u.id] = u
    return map
  }, [announcements.data], {} as Record<string, PlatformUser>)

  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = []
    for (const a of announcements.data.slice(0, 4)) {
      const teacher = teachers.data[a.teacherId]
      out.push({
        key: a.id,
        badge: 'FROM YOUR TEACHERS',
        badgeTone: 'bg-rose-500 text-white',
        title: a.title,
        subtitle: teacher ? `${a.body} — ${teacher.name}` : a.body,
        meta: dateTime(a.whenISO),
        cta: 'View details',
        cover: `bg-gradient-to-br ${a.cover ?? 'from-rose-600 via-red-700 to-slate-950'}`,
        image: a.imageUrl,
        to: `/announcement/${a.id}`
      })
    }
    const topCourse = courses.data[0]
    if (topCourse) {
      out.push({
        key: `course_${topCourse.id}`,
        badge: 'FEATURED COURSE',
        badgeTone: 'bg-brand-500 text-white',
        title: topCourse.title,
        subtitle: topCourse.description,
        meta: `${topCourse.level} · ${topCourse.hours}h · ${topCourse.enrollmentCount.toLocaleString()} learners`,
        cta: 'Explore course',
        cover: `bg-gradient-to-br ${topCourse.cover}`,
        image: topCourse.thumbnailUrl,
        to: '/courses'
      })
    }
    const topChallenge = challenges.data[0]
    if (topChallenge) {
      out.push({
        key: `ch_${topChallenge.id}`,
        badge: 'CHALLENGE',
        badgeTone: 'bg-amber-500 text-black',
        title: topChallenge.title,
        subtitle: `Join ${topChallenge.participantCount.toLocaleString()} learners`,
        meta: topChallenge.description,
        cta: 'Join challenge',
        cover: `bg-gradient-to-br ${topChallenge.cover}`,
        to: '/community'
      })
    }
    if (out.length === 0) {
      out.push({
        key: 'fallback',
        badge: 'WELCOME',
        badgeTone: 'bg-brand-500 text-white',
        title: 'Start speaking today',
        subtitle: 'Pick a companion and have your first conversation',
        meta: 'AI tutors · live rooms · daily practice',
        cta: 'Start now',
        cover: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-950',
        to: '/speaking'
      })
    }
    return out
  }, [announcements.data, courses.data, challenges.data, teachers.data])

  // Keep index in range as slides load.
  useEffect(() => {
    if (i >= slides.length) setI(0)
  }, [slides.length, i])

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5500)
    return () => clearInterval(t)
  }, [slides.length])

  const s = slides[i] ?? slides[0]
  if (!s) return <div className="rounded-card min-h-[200px] bg-white/[0.03] animate-pulse" />

  return (
    <div className="relative">
      <div
        className={cn('relative overflow-hidden rounded-card p-7 min-h-[200px] flex flex-col justify-end ring-1 ring-white/10 transition-all duration-500', !s.image && s.cover)}
      >
        {s.image
          ? <><img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" /><div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" /></>
          : <div aria-hidden className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />}
        <span className={cn('absolute top-5 left-7 text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1', s.badgeTone)}>
          {s.badge}
        </span>
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{s.title}</h2>
          <p className="text-white/85 mt-1 line-clamp-2">{s.subtitle}</p>
          <p className="text-white/60 text-xs mt-1">{s.meta}</p>
          <button
            onClick={() => navigate(s.to)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-semibold text-sm px-5 py-2.5 hover:bg-white/90 transition"
          >
            {s.cta} <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {slides.map((slide, idx) => (
            <button
              key={slide.key}
              onClick={() => setI(idx)}
              className={cn('h-1.5 rounded-full transition-all', idx === i ? 'w-6 bg-brand-400' : 'w-1.5 bg-white/20 hover:bg-white/40')}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
