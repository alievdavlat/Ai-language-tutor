import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/classnames'
import { IconArrowRight } from '../../../components/icons'

interface Slide {
  badge: string
  badgeTone: string
  title: string
  subtitle: string
  meta: string
  cta: string
  cover: string
  to: string
}

const SLIDES: Slide[] = [
  {
    badge: 'LIVE TODAY',
    badgeTone: 'bg-rose-500 text-white',
    title: 'Mastering Past Tenses',
    subtitle: 'Open live lesson with Emma Carter',
    meta: 'Today · 7:00 PM · free for everyone',
    cta: 'Set reminder',
    cover: 'from-rose-600 via-red-700 to-slate-950',
    to: '/exams'
  },
  {
    badge: 'NEW COURSE',
    badgeTone: 'bg-brand-500 text-white',
    title: 'IELTS Speaking Bootcamp',
    subtitle: 'Band 7+ in 4 weeks · by James Lee',
    meta: '24 video lessons · mock exam included',
    cta: 'Explore course',
    cover: 'from-blue-600 via-indigo-700 to-slate-950',
    to: '/courses'
  },
  {
    badge: 'CHALLENGE',
    badgeTone: 'bg-amber-500 text-black',
    title: '7-Day Speaking Streak',
    subtitle: 'Join 1,240 learners this week',
    meta: 'Win XP & a badge',
    cta: 'Join challenge',
    cover: 'from-amber-500 via-orange-700 to-slate-950',
    to: '/speaking'
  }
]

export default function HeroCarousel(): JSX.Element {
  const navigate = useNavigate()
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5500)
    return () => clearInterval(t)
  }, [])

  const s = SLIDES[i]

  return (
    <div className="relative">
      <div
        className={cn('relative overflow-hidden rounded-card bg-gradient-to-br p-7 min-h-[200px] flex flex-col justify-end ring-1 ring-white/10 transition-all duration-500', s.cover)}
      >
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <span className={cn('absolute top-5 left-7 text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1', s.badgeTone)}>
          {s.badge}
        </span>
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{s.title}</h2>
          <p className="text-white/85 mt-1">{s.subtitle}</p>
          <p className="text-white/60 text-xs mt-1">{s.meta}</p>
          <button
            onClick={() => navigate(s.to)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-semibold text-sm px-5 py-2.5 hover:bg-white/90 transition"
          >
            {s.cta} <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={cn('h-1.5 rounded-full transition-all', idx === i ? 'w-6 bg-brand-400' : 'w-1.5 bg-white/20 hover:bg-white/40')}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
