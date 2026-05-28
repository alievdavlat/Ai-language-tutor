import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { Tabs, type TabItem } from '../../components/ui'
import {
  IconBook,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconVolume,
  IconYouTube
} from '../../components/icons'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

type Step = 'basics' | 'curriculum' | 'pricing' | 'publish'
const STEPS: TabItem<Step>[] = [
  { id: 'basics', label: '1 · Basics' },
  { id: 'curriculum', label: '2 · Curriculum' },
  { id: 'pricing', label: '3 · Pricing' },
  { id: 'publish', label: '4 · Publish' }
]

interface DraftLesson {
  title: string
  link: string
  dripDays: number
}
interface DraftUnit {
  title: string
  lessons: DraftLesson[]
}

export default function CourseAuthoringPage(): JSX.Element {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('basics')
  const [level, setLevel] = useState('B1')
  const [pricingMode, setPricingMode] = useState<'free' | 'one-off' | 'subscription'>('one-off')
  const [units, setUnits] = useState<DraftUnit[]>([
    { title: 'Unit 1 — Foundations', lessons: [{ title: '', link: '', dripDays: 0 }] }
  ])

  const addUnit = (): void => setUnits((u) => [...u, { title: `Unit ${u.length + 1}`, lessons: [{ title: '', link: '', dripDays: 0 }] }])
  const addLesson = (ui: number): void => setUnits((u) => u.map((x, i) => i === ui ? { ...x, lessons: [...x.lessons, { title: '', link: '', dripDays: x.lessons.length * 3 }] } : x))
  const updateUnit = (ui: number, patch: Partial<DraftUnit>): void => setUnits((u) => u.map((x, i) => i === ui ? { ...x, ...patch } : x))
  const updateLesson = (ui: number, li: number, patch: Partial<DraftLesson>): void =>
    setUnits((u) => u.map((x, i) => i === ui ? { ...x, lessons: x.lessons.map((y, j) => j === li ? { ...y, ...patch } : y) } : x))
  const moveLesson = (ui: number, li: number, dir: -1 | 1): void => {
    setUnits((u) => u.map((x, i) => {
      if (i !== ui) return x
      const next = [...x.lessons]
      const target = li + dir
      if (target < 0 || target >= next.length) return x
      ;[next[li], next[target]] = [next[target], next[li]]
      return { ...x, lessons: next }
    }))
  }

  const totalLessons = units.reduce((acc, u) => acc + u.lessons.length, 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/teacher')} className="text-slate-400 hover:text-white transition"><IconChevronLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-violet-300 font-bold">Teacher · Course builder</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Create a course</h1>
            <p className="text-sm text-slate-400 mt-0.5">{units.length} unit{units.length === 1 ? '' : 's'} · {totalLessons} lesson{totalLessons === 1 ? '' : 's'}</p>
          </div>
        </div>

        <Tabs items={STEPS} active={step} onChange={setStep} className="self-start" />

        {step === 'basics' && (
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Title</label>
              <input placeholder="e.g. Everyday Conversation" className="input mt-1.5" />
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
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Short description</label>
              <textarea placeholder="What will students learn?" className="input mt-1.5 min-h-[80px] resize-none" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Cover image</label>
              <button className="mt-1.5 w-full rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 flex flex-col items-center gap-2 hover:bg-white/[0.04]">
                <span className="text-2xl">📸</span>
                <span className="text-xs text-slate-400">Upload or paste an image URL</span>
              </button>
            </div>
          </div>
        )}

        {step === 'curriculum' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400">Drag lessons to reorder · drip schedule unlocks lessons over time.</p>
            {units.map((unit, ui) => (
              <div key={ui} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
                <input
                  value={unit.title}
                  onChange={(e) => updateUnit(ui, { title: e.target.value })}
                  className="w-full bg-transparent text-base font-bold text-white focus:outline-none mb-3"
                />
                <div className="flex flex-col gap-2">
                  {unit.lessons.map((ls, li) => (
                    <div key={li} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <button onClick={() => moveLesson(ui, li, -1)} className="text-slate-500 hover:text-brand-300 disabled:opacity-30" disabled={li === 0} title="Move up">▲</button>
                          <button onClick={() => moveLesson(ui, li, 1)} className="text-slate-500 hover:text-brand-300 disabled:opacity-30" disabled={li === unit.lessons.length - 1} title="Move down">▼</button>
                        </div>
                        <span className="w-6 h-6 rounded-full bg-white/[0.06] text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">{li + 1}</span>
                        <input value={ls.title} onChange={(e) => updateLesson(ui, li, { title: e.target.value })} placeholder="Lesson title" className="input flex-1 text-sm" />
                      </div>
                      <div className="flex items-center gap-2 pl-12">
                        <IconYouTube className="w-4 h-4 text-red-500 shrink-0" />
                        <input value={ls.link} onChange={(e) => updateLesson(ui, li, { link: e.target.value })} placeholder="YouTube video link" className="input flex-1 text-xs" />
                      </div>
                      <div className="flex items-center gap-2 pl-12 flex-wrap">
                        <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10"><IconBook className="w-3.5 h-3.5" /> PDF</button>
                        <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10"><IconVolume className="w-3.5 h-3.5" /> Audio</button>
                        <span className="text-[11px] text-slate-500 ml-auto">Unlocks day</span>
                        <input
                          type="number"
                          value={ls.dripDays}
                          onChange={(e) => updateLesson(ui, li, { dripDays: Math.max(0, Number(e.target.value || 0)) })}
                          className="w-14 input text-xs text-center !py-1.5"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addLesson(ui)} className="text-xs font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1 self-start"><IconPlus className="w-3.5 h-3.5" /> Add lesson</button>
                </div>
              </div>
            ))}
            <button onClick={addUnit} className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm font-semibold text-brand-300 hover:bg-white/[0.04]">+ Add unit</button>
          </div>
        )}

        {step === 'pricing' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Pricing model</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {([['free', 'Free', 'Reach the widest audience'], ['one-off', 'One-off', 'Pay once, own forever'], ['subscription', 'Subscription', 'Recurring monthly']] as const).map(([id, label, sub]) => (
                  <button key={id} onClick={() => setPricingMode(id)} className={cn('rounded-xl border p-3 text-left transition', pricingMode === id ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]')}>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
            </div>
            {pricingMode !== 'free' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Price</label>
                  <input type="number" placeholder="29" className="input mt-1.5" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Currency</label>
                  <select className="input mt-1.5"><option>USD</option><option>EUR</option></select>
                </div>
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Coupons</label>
              <div className="mt-2 flex flex-col gap-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">LAUNCH50</p>
                    <p className="text-[11px] text-slate-400">50% off · expires 2026-06-30 · 14 used</p>
                  </div>
                  <button className="text-xs text-rose-300 hover:text-rose-200">Remove</button>
                </div>
                <button className="text-xs font-semibold text-brand-300 hover:text-brand-200 self-start">+ Create coupon</button>
              </div>
            </div>
          </div>
        )}

        {step === 'publish' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-300">Ready to publish? Your course will appear on your channel and in the catalog.</p>
            <ul className="text-sm text-slate-300 flex flex-col gap-1.5">
              <li>✓ Basics complete</li>
              <li>✓ {totalLessons} lessons across {units.length} unit{units.length === 1 ? '' : 's'}</li>
              <li className="text-amber-300">⚠ Add a cover image for better discovery</li>
            </ul>
            <div className="flex items-center gap-3 pt-2">
              <button className="btn-ghost px-5 py-2.5">Save draft</button>
              <button className="btn-ghost px-5 py-2.5">Preview</button>
              <button onClick={() => navigate('/teacher')} className="btn-primary flex-1 py-2.5">Publish course</button>
            </div>
          </div>
        )}

        {/* Step nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const order: Step[] = ['basics', 'curriculum', 'pricing', 'publish']
              const idx = order.indexOf(step)
              if (idx > 0) setStep(order[idx - 1])
            }}
            disabled={step === 'basics'}
            className="btn-ghost text-xs px-4 py-2 disabled:opacity-40"
          >
            <IconChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => {
              const order: Step[] = ['basics', 'curriculum', 'pricing', 'publish']
              const idx = order.indexOf(step)
              if (idx < order.length - 1) setStep(order[idx + 1])
            }}
            disabled={step === 'publish'}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-40"
          >
            Next <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
