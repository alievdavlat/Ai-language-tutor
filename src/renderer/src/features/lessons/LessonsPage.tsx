import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading } from '../../components/ui'
import { IconBookmark, IconCheck, IconLock, IconPlay } from '../../components/icons'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVELS)[number]

type LessonState = 'done' | 'current' | 'locked'

interface Lesson {
  title: string
  duration: string
  state: LessonState
  bookmarked?: boolean
}

const CHAPTERS: { title: string; topic: string; lessons: Lesson[] }[] = [
  {
    title: 'Chapter 1',
    topic: 'Traveling',
    lessons: [
      { title: "We're going on vacation", duration: '4 min', state: 'done', bookmarked: true },
      { title: 'Describing travel experiences', duration: '6 min', state: 'done' },
      { title: 'Discussing types of vacation', duration: '5 min', state: 'current' },
      { title: 'At the airport', duration: '7 min', state: 'locked' },
      { title: 'Booking a hotel room', duration: '6 min', state: 'locked' }
    ]
  },
  {
    title: 'Chapter 2',
    topic: 'Food & dining',
    lessons: [
      { title: 'Ordering at a restaurant', duration: '5 min', state: 'locked' },
      { title: 'Talking about taste', duration: '6 min', state: 'locked' }
    ]
  }
]

function LessonStateIcon({ state }: { state: LessonState }): JSX.Element {
  if (state === 'done') {
    return (
      <span className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
        <IconCheck className="w-5 h-5" />
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="w-10 h-10 rounded-full bg-grad-brand text-white flex items-center justify-center shadow-glow-sm">
        <IconPlay className="w-[18px] h-[18px]" />
      </span>
    )
  }
  return (
    <span className="w-10 h-10 rounded-full bg-white/[0.04] text-slate-600 flex items-center justify-center">
      <IconLock className="w-4 h-4" />
    </span>
  )
}

export default function LessonsPage(): JSX.Element {
  const [level, setLevel] = useState<Level>('B1')

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
          <p className="text-sm text-slate-400 mt-1">
            Structured grammar & conversation units, tuned to your level.
          </p>
        </div>

        {/* Level selector */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Your level</span>
            <span className="text-xs text-slate-400">12 of 60 lessons completed</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-bold transition',
                  lv === level
                    ? 'bg-grad-brand text-white shadow-glow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                )}
              >
                {lv}
              </button>
            ))}
          </div>
          <ProgressBar value={20} />
        </div>

        {/* Chapters */}
        {CHAPTERS.map((ch) => {
          const done = ch.lessons.filter((l) => l.state === 'done').length
          return (
            <div key={ch.title}>
              <SectionHeading
                title={
                  <span className="flex items-center gap-2">
                    {ch.title}
                    <span className="text-slate-500 font-medium">·</span>
                    <span className="text-brand-300">{ch.topic}</span>
                  </span>
                }
                subtitle={`${done}/${ch.lessons.length} lessons completed`}
              />
              <div className="flex flex-col gap-2">
                {ch.lessons.map((l) => (
                  <div
                    key={l.title}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition',
                      l.state === 'locked'
                        ? 'border-white/[0.05] bg-white/[0.015] opacity-60'
                        : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer'
                    )}
                  >
                    <LessonStateIcon state={l.state} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{l.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.duration}</div>
                    </div>
                    {l.bookmarked && (
                      <IconBookmark className="w-4 h-4 text-brand-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
