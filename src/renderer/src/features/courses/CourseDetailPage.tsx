import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle } from '../../components/ui'
import {
  IconBookmark,
  IconCheck,
  IconChevronLeft,
  IconHeart,
  IconLock,
  IconPlay,
  IconStar,
  IconTrophy
} from '../../components/icons'

const COURSE = {
  title: 'Everyday Conversation',
  teacher: 'Emma Carter',
  level: 'A2–B1',
  rating: 4.8,
  reviews: 312,
  students: '4,120',
  lessons: 24,
  duration: '6h 30m',
  cover: 'from-sky-500 via-blue-700 to-slate-950',
  about:
    'Build the confidence to handle real conversations — greetings, small talk, shopping, travel and more. Short video lessons, vocabulary, and lots of speaking practice with your AI partner.',
  learn: [
    'Hold everyday conversations with confidence',
    'Use natural phrases native speakers actually say',
    'Handle travel, shopping and dining situations',
    'Improve pronunciation and fluency'
  ]
}

interface CurLesson {
  title: string
  kind: 'video' | 'practice' | 'exam'
  state: 'done' | 'current' | 'locked'
}
const CURRICULUM: { unit: string; lessons: CurLesson[] }[] = [
  { unit: 'Unit 1 · Greetings & small talk', lessons: [
    { title: 'Saying hello', kind: 'video', state: 'done' },
    { title: 'Talking about yourself', kind: 'video', state: 'done' },
    { title: 'Practice', kind: 'practice', state: 'done' }
  ] },
  { unit: 'Unit 2 · Out and about', lessons: [
    { title: 'At a cafe', kind: 'video', state: 'current' },
    { title: 'Shopping', kind: 'video', state: 'locked' },
    { title: 'Unit test', kind: 'exam', state: 'locked' }
  ] }
]

const REVIEWS = [
  { name: 'Dilnoza', stars: 5, text: 'Emma explains everything so clearly. My speaking improved fast!' },
  { name: 'Bekzod', stars: 5, text: 'The AI practice after each lesson is gold. Highly recommend.' },
  { name: 'Madina', stars: 4, text: 'Great course, would love more advanced units.' }
]

const DIST = [
  { s: 5, pct: 78 },
  { s: 4, pct: 16 },
  { s: 3, pct: 4 },
  { s: 2, pct: 1 },
  { s: 1, pct: 1 }
]

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
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <div className={cn('relative bg-gradient-to-br px-6 pt-4 pb-6', COURSE.cover)}>
        <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white transition mb-4">
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 text-white rounded-full px-2 py-1">{COURSE.level}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-400/90 text-black rounded-full px-2 py-1">
              <IconTrophy className="w-3 h-3" /> Ends with exam
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{COURSE.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5"><Stars n={5} /> {COURSE.rating} ({COURSE.reviews})</span>
            <span>{COURSE.students} learners</span>
            <span>{COURSE.lessons} lessons · {COURSE.duration}</span>
          </div>
          <button onClick={() => navigate('/channel')} className="flex items-center gap-2 mt-3 hover:opacity-90">
            <AvatarCircle name={COURSE.teacher} size="sm" />
            <span className="text-sm text-white font-medium">{COURSE.teacher}</span>
          </button>
        </div>
      </div>

      <div className="px-6 py-6 w-full">
        {/* Action row */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/learn/lesson')} className="btn-primary px-8 py-3">
            Continue learning →
          </button>
          <button onClick={() => setLiked((v) => !v)} className={cn('w-11 h-11 rounded-full border flex items-center justify-center transition', liked ? 'bg-rose-500/15 border-rose-400/40 text-rose-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Like">
            <IconHeart className="w-5 h-5" />
          </button>
          <button onClick={() => setSaved((v) => !v)} className={cn('w-11 h-11 rounded-full border flex items-center justify-center transition', saved ? 'bg-brand-500/15 border-brand-400/40 text-brand-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Save">
            <IconBookmark className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="flex flex-col gap-7">
            {/* About */}
            <section>
              <h2 className="text-base font-bold mb-2">About this course</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{COURSE.about}</p>
            </section>

            {/* What you'll learn */}
            <section>
              <h2 className="text-base font-bold mb-3">What you'll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COURSE.learn.map((l) => (
                  <div key={l} className="flex items-start gap-2 text-sm text-slate-300">
                    <IconCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {l}
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section>
              <h2 className="text-base font-bold mb-3">Curriculum</h2>
              <div className="flex flex-col gap-4">
                {CURRICULUM.map((u) => (
                  <div key={u.unit}>
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">{u.unit}</p>
                    <div className="flex flex-col gap-1.5">
                      {u.lessons.map((l) => {
                        const locked = l.state === 'locked'
                        return (
                          <button
                            key={l.title}
                            onClick={() => !locked && navigate('/learn/lesson')}
                            disabled={locked}
                            className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition', locked ? 'border-white/[0.05] bg-white/[0.015] opacity-60' : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]')}
                          >
                            <span className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                              {l.state === 'done' ? <IconCheck className="w-4 h-4 text-emerald-300" /> : locked ? <IconLock className="w-3.5 h-3.5 text-slate-600" /> : l.kind === 'exam' ? <IconTrophy className="w-3.5 h-3.5 text-amber-300" /> : <IconPlay className="w-3.5 h-3.5 text-brand-300" />}
                            </span>
                            <span className="flex-1 text-sm text-slate-200">{l.title}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">{l.kind}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-base font-bold mb-3">Reviews</h2>
              <div className="flex flex-col sm:flex-row gap-6 mb-5">
                <div className="text-center shrink-0">
                  <p className="text-5xl font-bold text-white">{COURSE.rating}</p>
                  <Stars n={5} className="mt-1" />
                  <p className="text-xs text-slate-500 mt-1">{COURSE.reviews} reviews</p>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 justify-center">
                  {DIST.map((d) => (
                    <div key={d.s} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-3">{d.s}</span>
                      <IconStar className="w-3 h-3 text-amber-300" />
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn-ghost px-4 py-2 text-sm mb-4">Write a review</button>
              <div className="flex flex-col gap-3">
                {REVIEWS.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AvatarCircle name={r.name} size="sm" />
                      <span className="text-sm font-semibold text-white">{r.name}</span>
                      <Stars n={r.stars} className="ml-auto" />
                    </div>
                    <p className="text-sm text-slate-300">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Meta rail */}
          <aside className="lg:border-l lg:border-white/10 lg:pl-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 text-sm">
              {[
                ['Level', COURSE.level],
                ['Lessons', String(COURSE.lessons)],
                ['Duration', COURSE.duration],
                ['Language', 'English'],
                ['Certificate', 'Yes, on completion']
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
    </div>
  )
}
