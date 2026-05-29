import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import {
  IconArrowRight,
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconPlay,
  IconYouTube
} from '../../components/icons'

// Original Murphy-style explanatory content (paraphrased, not copied) for the
// "Present continuous" unit — visual shell of the textbook page-tour.
interface Page {
  label: string
  body: JSX.Element
}

const PAGES: Page[] = [
  {
    label: 'A',
    body: (
      <>
        <p className="mb-3">
          Study this example situation:
        </p>
        <div className="rounded-lg bg-[#e9e3d4] px-4 py-3 mb-4 italic">
          Sarah is in her car. She is driving to work.<br />
          → <b className="not-italic">She is driving</b> = she is driving now, at the time of speaking.
        </div>
        <p className="mb-2">
          The <b>present continuous</b> is: <b>am / is / are + -ing</b>.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>I <b>am</b> work<b>ing</b> (I&apos;m working)</li>
          <li>she <b>is</b> driv<b>ing</b> (she&apos;s driving)</li>
          <li>they <b>are</b> do<b>ing</b> (they&apos;re doing)</li>
        </ul>
      </>
    )
  },
  {
    label: 'B',
    body: (
      <>
        <p className="mb-3">
          We use the present continuous for something that is happening <b>now</b>,
          at or around the moment of speaking:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Please be quiet. I<b>&apos;m working</b>.</li>
          <li>Listen to those people. What language <b>are they speaking</b>?</li>
          <li>&apos;Where&apos;s Tom?&apos; &apos;He<b>&apos;s having</b> a shower.&apos;</li>
        </ul>
        <p>
          The action is not necessarily happening at the exact moment — but around
          this period of time: <i>I&apos;m reading a good book at the moment.</i>
        </p>
      </>
    )
  },
  {
    label: '3.1',
    body: (
      <>
        <p className="mb-3 font-semibold">Exercise 3.1 — Complete the sentences.</p>
        <ol className="list-decimal pl-5 space-y-2.5">
          <li>Please don&apos;t make so much noise. I <span className="inline-block w-28 border-b border-slate-400" /> (try) to work.</li>
          <li>Let&apos;s go out now. It <span className="inline-block w-28 border-b border-slate-400" /> (not / rain) any more.</li>
          <li>You <span className="inline-block w-28 border-b border-slate-400" /> (work) hard today. Yes, I have a lot to do.</li>
          <li>Why <span className="inline-block w-28 border-b border-slate-400" /> (you / look) at me like that? Stop it!</li>
        </ol>
      </>
    )
  }
]

export default function BookReaderPage(): JSX.Element {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const p = PAGES[page]

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3 backdrop-blur-xl bg-canvas-soft/40 shrink-0">
        <button onClick={() => navigate('/courses')} className="text-slate-400 hover:text-white transition" title="Back to course">
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">English Grammar in Use · Murphy</p>
          <p className="text-[11px] text-slate-400">Unit 3 · Present continuous (I am doing)</p>
        </div>
        <button className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-pill bg-white/[0.06] hover:bg-white/10 px-3 py-2 text-slate-200 transition">
          <IconDownload className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 w-full flex flex-col gap-5">
          {/* Video strip */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
            <div className="relative w-32 h-20 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shrink-0">
              <IconPlay className="w-6 h-6 text-white" />
              <span className="absolute top-1.5 left-1.5"><IconYouTube className="w-4 h-4 text-red-500" /></span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-brand-300 font-semibold">Watch first</p>
              <p className="text-sm font-semibold text-white truncate">Present continuous — explained in 7 min</p>
              <p className="text-xs text-slate-400">Video lesson for this unit</p>
            </div>
          </div>

          {/* Book page */}
          <div className="rounded-2xl overflow-hidden ring-1 ring-black/20 shadow-2xl">
            <div className="bg-[#f5f1e8] text-slate-800 px-7 py-8 min-h-[420px] font-serif">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm font-sans">3</span>
                <h2 className="text-xl font-bold">Present continuous (I am doing)</h2>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-700 font-bold text-lg shrink-0 w-6">{p.label}</span>
                <div className="text-[15px] leading-relaxed">{p.body}</div>
              </div>
            </div>
          </div>

          {/* Page nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((i) => Math.max(0, i - 1))}
              disabled={page === 0}
              className="btn-ghost px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <IconChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs text-slate-400">Page {page + 1} of {PAGES.length}</span>
            {page + 1 < PAGES.length ? (
              <button onClick={() => setPage((i) => i + 1)} className="btn-ghost px-4 py-2 inline-flex items-center gap-1.5">
                Next <IconChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => navigate('/learn/exercise')} className="btn-primary px-4 py-2 inline-flex items-center gap-1.5">
                <IconBolt className="w-4 h-4" /> Exercises <IconArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
