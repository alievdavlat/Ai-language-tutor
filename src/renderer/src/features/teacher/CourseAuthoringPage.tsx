import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { IconBook, IconChevronLeft, IconPlus, IconVolume, IconYouTube } from '../../components/icons'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

interface DraftLesson {
  title: string
  link: string
}

export default function CourseAuthoringPage(): JSX.Element {
  const navigate = useNavigate()
  const [level, setLevel] = useState('B1')
  const [lessons, setLessons] = useState<DraftLesson[]>([{ title: '', link: '' }])

  const addLesson = (): void => setLessons((l) => [...l, { title: '', link: '' }])
  const update = (i: number, patch: Partial<DraftLesson>): void =>
    setLessons((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/teacher')} className="text-slate-400 hover:text-white transition"><IconChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create a course</h1>
            <p className="text-sm text-slate-400 mt-0.5">Add lessons — videos go on YouTube, materials upload as PDF/audio.</p>
          </div>
        </div>

        {/* Basics */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Title</label>
            <input placeholder="e.g. Everyday Conversation" className="mt-1.5 w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Level</label>
            <div className="flex gap-2 mt-1.5">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)} className={cn('rounded-lg px-3.5 py-1.5 text-sm font-bold transition', l === level ? 'bg-grad-brand text-white' : 'bg-white/[0.05] text-slate-400 hover:bg-white/10')}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Description</label>
            <textarea placeholder="What will students learn?" className="mt-1.5 w-full min-h-[80px] rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none resize-none" />
          </div>
        </div>

        {/* Lessons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Lessons</h2>
            <button onClick={addLesson} className="text-xs font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1"><IconPlus className="w-3.5 h-3.5" /> Add lesson</button>
          </div>
          <div className="flex flex-col gap-3">
            {lessons.map((ls, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/[0.06] text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <input value={ls.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Lesson title" className="flex-1 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <IconYouTube className="w-4 h-4 text-red-500 shrink-0" />
                  <input value={ls.link} onChange={(e) => update(i, { link: e.target.value })} placeholder="YouTube video link" className="flex-1 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10"><IconBook className="w-3.5 h-3.5" /> Attach PDF</button>
                  <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10"><IconVolume className="w-3.5 h-3.5" /> Attach audio</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-ghost px-5 py-2.5">Save draft</button>
          <button onClick={() => navigate('/teacher')} className="btn-primary flex-1 py-2.5">Publish course</button>
        </div>
      </div>
    </div>
  )
}
