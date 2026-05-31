import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Course, Lesson, Unit } from '@shared/types'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { backend } from '../../services/backend/useBackend'
import { isImageCover } from '../../lib/cover'
import { uploadUrl } from '../../services/backend'
import { checkDuplicate, contentKey } from '../../services/dedup'
import LevelSelect from '../../components/ui/LevelSelect'
import { Tabs, type TabItem } from '../../components/ui'
import {
  IconBook,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconVolume,
  IconX,
  IconYouTube
} from '../../components/icons'


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
  const profile = useAppStore((s) => s.profile)
  const [step, setStep] = useState<Step>('basics')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState('B1')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const thumbInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)
  const [imgError, setImgError] = useState<string | null>(null)
  const [pricingMode, setPricingMode] = useState<'free' | 'one-off' | 'subscription'>('one-off')
  const [price, setPrice] = useState('29')
  const [units, setUnits] = useState<DraftUnit[]>([
    { title: 'Unit 1 — Foundations', lessons: [{ title: '', link: '', dripDays: 0 }] }
  ])
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null)
  const [busy, setBusy] = useState<'idle' | 'saving' | 'publishing'>('idle')

  const buildCourse = (publish: boolean): Course => {
    const me = backend.currentUserId() ?? 'u_anon'
    const id = savedCourseId ?? `c_${Math.random().toString(36).slice(2, 10)}`
    const pricing: Course['pricing'] =
      pricingMode === 'free' ? { kind: 'free' }
        : pricingMode === 'one-off' ? { kind: 'one-off', usd: Number(price) || 0 }
        : { kind: 'sub', usdPerMo: Number(price) || 0 }
    return {
      id,
      teacherId: me,
      title: title || 'Untitled course',
      description: description || 'Course description coming soon.',
      level,
      targetLanguage: profile?.targetLanguage ?? 'en',
      cover: 'from-violet-500 to-purple-700',
      thumbnailUrl: thumbnailUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      pricing,
      rating: 0,
      reviewCount: 0,
      enrollmentCount: 0,
      hours: Math.max(1, units.reduce((acc, u) => acc + u.lessons.length, 0)),
      publishedAt: publish ? new Date().toISOString() : undefined,
      contentHash: contentKey.titleOwner(title || 'Untitled course', me)
    }
  }

  /**
   * Block saving a course whose title duplicates one this teacher already owns
   * (#A65). Returns true when it's safe to proceed.
   */
  const ensureNotDuplicate = async (): Promise<boolean> => {
    const me = backend.currentUserId() ?? 'u_anon'
    const mine = await backend.myCourses(me)
    const dup = checkDuplicate(
      { contentHash: contentKey.titleOwner(title || 'Untitled course', me), title: title || 'Untitled course', excludeId: savedCourseId ?? undefined },
      mine,
      { getId: (c) => c.id, getKey: (c) => c.contentHash, getTitle: (c) => c.title }
    )
    const hit = dup.exact ?? dup.near[0]?.item
    if (hit) {
      setImgError(`You already have a course called “${hit.title}”. Rename this one or edit the original instead.`)
      setStep('basics')
      return false
    }
    return true
  }

  /** Persist the drafted units + lessons to the backend (so the course
   *  actually has a curriculum — without this, courses show "0 lessons"). */
  const persistCurriculum = async (courseId: string): Promise<void> => {
    for (const [ui, u] of units.entries()) {
      const unit: Unit = { id: `${courseId}_u${ui}`, courseId, index: ui, title: u.title || `Unit ${ui + 1}` }
      await backend.upsertUnit(unit)
      for (const [li, ls] of u.lessons.entries()) {
        if (!ls.title.trim()) continue
        const lesson: Lesson = {
          id: `${unit.id}_l${li}`,
          unitId: unit.id,
          index: li,
          title: ls.title.trim(),
          kind: 'video',
          videoUrl: ls.link || undefined,
          dripDays: ls.dripDays || undefined
        }
        await backend.upsertLesson(lesson)
      }
    }
  }

  const saveDraft = async (): Promise<void> => {
    if (!(await ensureNotDuplicate())) return
    setBusy('saving')
    const course = await backend.upsertCourse(buildCourse(false))
    await persistCurriculum(course.id)
    setSavedCourseId(course.id)
    setBusy('idle')
  }
  const publish = async (): Promise<void> => {
    if (!thumbnailUrl || !bannerUrl) {
      setImgError('Add both a thumbnail and a banner before publishing.')
      setStep('basics')
      return
    }
    if (!(await ensureNotDuplicate())) return
    setBusy('publishing')
    const course = await backend.upsertCourse(buildCourse(true))
    await persistCurriculum(course.id)
    setSavedCourseId(course.id)
    setBusy('idle')
    navigate(`/course/${course.id}`)
  }

  const pickImage = async (kind: 'thumb' | 'banner', file?: File): Promise<void> => {
    setImgError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) { setImgError('Please choose an image file.'); return }
    if (file.size > 4 * 1024 * 1024) { setImgError('Image must be under 4 MB.'); return }
    const url = await uploadUrl(file, 'covers')
    if (kind === 'thumb') setThumbnailUrl(url)
    else setBannerUrl(url)
  }

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
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
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
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Everyday Conversation" className="input mt-1.5" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Level</label>
              <div className="mt-1.5">
                <LevelSelect value={level} onChange={setLevel} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Short description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" className="input mt-1.5 min-h-[80px] resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Thumbnail (square card image) */}
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Thumbnail <span className="text-rose-400">*</span></label>
                <input ref={thumbInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pickImage('thumb', e.target.files?.[0])} />
                {isImageCover(thumbnailUrl) ? (
                  <div className="mt-1.5 relative rounded-xl overflow-hidden aspect-video ring-1 ring-white/10">
                    <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                    <button onClick={() => setThumbnailUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><IconX className="w-4 h-4" /></button>
                    <button onClick={() => thumbInput.current?.click()} className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/60 text-white rounded-full px-2.5 py-1 hover:bg-black/80">Replace</button>
                  </div>
                ) : (
                  <button onClick={() => thumbInput.current?.click()} className="mt-1.5 w-full aspect-video rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04]">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs text-slate-400">Upload card thumbnail</span>
                    <span className="text-[10px] text-slate-600">JPG/PNG · under 4 MB</span>
                  </button>
                )}
              </div>
              {/* Banner (wide hero image) */}
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Banner <span className="text-rose-400">*</span></label>
                <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pickImage('banner', e.target.files?.[0])} />
                {isImageCover(bannerUrl) ? (
                  <div className="mt-1.5 relative rounded-xl overflow-hidden aspect-video ring-1 ring-white/10">
                    <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
                    <button onClick={() => setBannerUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><IconX className="w-4 h-4" /></button>
                    <button onClick={() => bannerInput.current?.click()} className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/60 text-white rounded-full px-2.5 py-1 hover:bg-black/80">Replace</button>
                  </div>
                ) : (
                  <button onClick={() => bannerInput.current?.click()} className="mt-1.5 w-full aspect-video rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04]">
                    <span className="text-2xl">🌄</span>
                    <span className="text-xs text-slate-400">Upload wide banner</span>
                    <span className="text-[10px] text-slate-600">Shown on the course page header</span>
                  </button>
                )}
              </div>
              {imgError && <p className="text-[12px] text-rose-400 sm:col-span-2">⚠ {imgError}</p>}
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
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29" className="input mt-1.5" />
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
              <li className={title.trim() ? '' : 'text-amber-300'}>{title.trim() ? '✓' : '⚠'} {title.trim() ? 'Title set' : 'Add a title (Basics)'}</li>
              <li className={totalLessons > 0 ? '' : 'text-amber-300'}>{totalLessons > 0 ? '✓' : '⚠'} {totalLessons} lessons across {units.length} unit{units.length === 1 ? '' : 's'}</li>
              <li className={thumbnailUrl ? '' : 'text-amber-300'}>{thumbnailUrl ? '✓' : '⚠'} Thumbnail {thumbnailUrl ? 'added' : 'required (Basics)'}</li>
              <li className={bannerUrl ? '' : 'text-amber-300'}>{bannerUrl ? '✓' : '⚠'} Banner {bannerUrl ? 'added' : 'required (Basics)'}</li>
            </ul>
            {imgError && <p className="text-[12px] text-rose-400">⚠ {imgError}</p>}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => void saveDraft()} disabled={busy !== 'idle'} className="btn-ghost px-5 py-2.5 disabled:opacity-50">
                {busy === 'saving' ? 'Saving…' : savedCourseId ? 'Update draft' : 'Save draft'}
              </button>
              <button onClick={() => savedCourseId && navigate(`/course/${savedCourseId}`)} disabled={busy !== 'idle' || !savedCourseId} className="btn-ghost px-5 py-2.5 disabled:opacity-50">Preview</button>
              <button onClick={() => void publish()} disabled={busy !== 'idle' || !title.trim() || !thumbnailUrl || !bannerUrl} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                {busy === 'publishing' ? 'Publishing…' : 'Publish course'}
              </button>
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
