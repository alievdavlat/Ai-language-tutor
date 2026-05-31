import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Course, Lesson, LessonMaterialRef, Unit } from '@shared/types'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { backend } from '../../services/backend/useBackend'
import { isImageCover } from '../../lib/cover'
import { uploadUrl } from '../../services/backend'
import LevelSelect from '../../components/ui/LevelSelect'
import { Tabs, type TabItem } from '../../components/ui'
import { Field, MaterialsField, RichTextEditor } from '../../components/forms'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
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
const STEP_ORDER: Step[] = ['basics', 'curriculum', 'pricing', 'publish']

type LessonKind = Lesson['kind']
const KINDS: { id: LessonKind; label: string; hint: string }[] = [
  { id: 'video', label: 'Video', hint: 'A YouTube video + written material' },
  { id: 'practice', label: 'Practice', hint: 'Written material + exercises' },
  { id: 'rule', label: 'Reading', hint: 'A written article / coursebook page' },
  { id: 'exam', label: 'Checkpoint', hint: 'A graded quiz to unlock the next unit' }
]

interface DraftLesson {
  id: string
  title: string
  kind: LessonKind
  link: string
  durationMin: number
  dripDays: number
  about: string
  body: string
  transcript: string
  materials: LessonMaterialRef[]
  open: boolean
}
interface DraftUnit {
  id: string
  title: string
  about: string
  lessons: DraftLesson[]
}

const rid = (p: string): string => `${p}_${Math.random().toString(36).slice(2, 10)}`
function emptyLesson(): DraftLesson {
  return { id: rid('l'), title: '', kind: 'video', link: '', durationMin: 0, dripDays: 0, about: '', body: '', transcript: '', materials: [], open: false }
}

export default function CourseAuthoringPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id')
  const profile = useAppStore((s) => s.profile)

  const [step, setStep] = useState<Step>('basics')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [about, setAbout] = useState('')
  const [level, setLevel] = useState('B1')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const thumbInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)
  const [imgError, setImgError] = useState<string | null>(null)
  const [pricingMode, setPricingMode] = useState<'free' | 'one-off' | 'subscription'>('free')
  const [price, setPrice] = useState('29')
  const [units, setUnits] = useState<DraftUnit[]>([
    { id: rid('u'), title: 'Unit 1 — Foundations', about: '', lessons: [emptyLesson()] }
  ])
  const [savedCourseId, setSavedCourseId] = useState<string | null>(editId)
  const [busy, setBusy] = useState<'idle' | 'saving' | 'publishing' | 'loading'>(editId ? 'loading' : 'idle')

  // ── Load an existing course for editing ──────────────────────────────────
  useEffect(() => {
    if (!editId) return
    void (async () => {
      const course = await backend.getCourse(editId)
      if (!course) { setBusy('idle'); return }
      setTitle(course.title)
      setDescription(course.description)
      setAbout(course.about ?? '')
      setLevel(course.level)
      setThumbnailUrl(course.thumbnailUrl ?? '')
      setBannerUrl(course.bannerUrl ?? '')
      setPricingMode(course.pricing.kind === 'free' ? 'free' : course.pricing.kind === 'one-off' ? 'one-off' : 'subscription')
      if (course.pricing.kind === 'one-off') setPrice(String(course.pricing.usd))
      if (course.pricing.kind === 'sub') setPrice(String(course.pricing.usdPerMo))
      const us = await backend.listUnits(editId)
      const draftUnits: DraftUnit[] = []
      for (const u of us) {
        const ls = await backend.listLessons(u.id)
        draftUnits.push({
          id: u.id,
          title: u.title,
          about: u.about ?? '',
          lessons: ls.map((l) => ({
            id: l.id,
            title: l.title,
            kind: l.kind,
            link: l.videoUrl ?? '',
            durationMin: l.durationMin ?? 0,
            dripDays: l.dripDays ?? 0,
            about: l.content?.about ?? '',
            body: l.content?.body ?? '',
            transcript: l.content?.transcript ?? '',
            materials: l.content?.materials ?? [],
            open: false
          }))
        })
      }
      if (draftUnits.length) setUnits(draftUnits)
      setBusy('idle')
    })()
  }, [editId])

  const buildCourse = (publish: boolean): Course => {
    const me = backend.currentUserId() ?? 'u_anon'
    const id = savedCourseId ?? rid('c')
    const pricing: Course['pricing'] =
      pricingMode === 'free' ? { kind: 'free' }
        : pricingMode === 'one-off' ? { kind: 'one-off', usd: Number(price) || 0 }
        : { kind: 'sub', usdPerMo: Number(price) || 0 }
    return {
      id,
      teacherId: me,
      title: title || 'Untitled course',
      description: description || 'Course description coming soon.',
      about: about || undefined,
      level,
      targetLanguage: profile?.targetLanguage ?? 'en',
      cover: 'from-violet-500 to-purple-700',
      thumbnailUrl: thumbnailUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      pricing,
      rating: 0,
      reviewCount: 0,
      enrollmentCount: 0,
      hours: Math.max(1, Math.round(units.reduce((acc, u) => acc + u.lessons.reduce((a, l) => a + (l.durationMin || 0), 0), 0) / 60) || units.reduce((acc, u) => acc + u.lessons.length, 0)),
      publishedAt: publish ? new Date().toISOString() : undefined
    }
  }

  /** Persist drafted units + lessons (incl. rich content) so the course has a real curriculum. */
  const persistCurriculum = async (courseId: string): Promise<void> => {
    for (const [ui, u] of units.entries()) {
      const unit: Unit = { id: u.id, courseId, index: ui, title: u.title || `Unit ${ui + 1}`, about: u.about || undefined }
      await backend.upsertUnit(unit)
      for (const [li, ls] of u.lessons.entries()) {
        if (!ls.title.trim()) continue
        const hasContent = ls.about.trim() || ls.body.trim() || ls.transcript.trim() || ls.materials.length
        const lesson: Lesson = {
          id: ls.id,
          unitId: unit.id,
          index: li,
          title: ls.title.trim(),
          kind: ls.kind,
          videoUrl: ls.link || undefined,
          durationMin: ls.durationMin || undefined,
          dripDays: ls.dripDays || undefined,
          content: hasContent
            ? {
                about: ls.about.trim() || undefined,
                body: ls.body.trim() || undefined,
                transcript: ls.transcript.trim() || undefined,
                materials: ls.materials.length ? ls.materials : undefined
              }
            : undefined
        }
        await backend.upsertLesson(lesson)
      }
    }
  }

  const saveDraft = async (): Promise<void> => {
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

  // ── Curriculum mutations ──
  const addUnit = (): void => setUnits((u) => [...u, { id: rid('u'), title: `Unit ${u.length + 1}`, about: '', lessons: [emptyLesson()] }])
  const removeUnit = (ui: number): void => setUnits((u) => u.filter((_, i) => i !== ui))
  const addLesson = (ui: number): void => setUnits((u) => u.map((x, i) => i === ui ? { ...x, lessons: [...x.lessons, { ...emptyLesson(), dripDays: x.lessons.length * 3 }] } : x))
  const updateUnit = (ui: number, patch: Partial<DraftUnit>): void => setUnits((u) => u.map((x, i) => i === ui ? { ...x, ...patch } : x))
  const updateLesson = (ui: number, li: number, patch: Partial<DraftLesson>): void =>
    setUnits((u) => u.map((x, i) => i === ui ? { ...x, lessons: x.lessons.map((y, j) => j === li ? { ...y, ...patch } : y) } : x))
  const removeLesson = (ui: number, li: number): void =>
    setUnits((u) => u.map((x, i) => i === ui ? { ...x, lessons: x.lessons.filter((_, j) => j !== li) } : x))
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

  if (busy === 'loading') {
    return <div className="h-full grid place-items-center text-slate-400">Loading course…</div>
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/studio')} className="text-slate-400 hover:text-white transition"><IconChevronLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-violet-300 font-bold">Creator Studio · Course builder</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">{editId ? 'Edit course' : 'Create a course'}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{units.length} unit{units.length === 1 ? '' : 's'} · {totalLessons} lesson{totalLessons === 1 ? '' : 's'}</p>
          </div>
        </div>

        <Tabs items={STEPS} active={step} onChange={setStep} className="self-start" />

        {/* ── BASICS ── */}
        {step === 'basics' && (
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
            <Field label="Title" required>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Everyday Conversation" className="input" />
            </Field>
            <Field label="Level">
              <LevelSelect value={level} onChange={setLevel} />
            </Field>
            <Field label="Short tagline" hint="One line shown on the course card.">
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Speak naturally in everyday situations." className="input" />
            </Field>
            <Field label="About this course" hint="The full description shown on the course page — format it however you like.">
              <RichTextEditor value={about} onChange={setAbout} placeholder="## What you'll learn&#10;- Greet people naturally&#10;- Order food with confidence&#10;&#10;Each unit builds on the last…" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Thumbnail" required>
                <input ref={thumbInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pickImage('thumb', e.target.files?.[0])} />
                {isImageCover(thumbnailUrl) ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video ring-1 ring-white/10">
                    <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                    <button onClick={() => setThumbnailUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><IconX className="w-4 h-4" /></button>
                    <button onClick={() => thumbInput.current?.click()} className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/60 text-white rounded-full px-2.5 py-1 hover:bg-black/80">Replace</button>
                  </div>
                ) : (
                  <button onClick={() => thumbInput.current?.click()} className="w-full aspect-video rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04]">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs text-slate-400">Upload card thumbnail</span>
                    <span className="text-[10px] text-slate-600">JPG/PNG · under 4 MB</span>
                  </button>
                )}
              </Field>
              <Field label="Banner" required>
                <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pickImage('banner', e.target.files?.[0])} />
                {isImageCover(bannerUrl) ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video ring-1 ring-white/10">
                    <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
                    <button onClick={() => setBannerUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><IconX className="w-4 h-4" /></button>
                    <button onClick={() => bannerInput.current?.click()} className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/60 text-white rounded-full px-2.5 py-1 hover:bg-black/80">Replace</button>
                  </div>
                ) : (
                  <button onClick={() => bannerInput.current?.click()} className="w-full aspect-video rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04]">
                    <span className="text-2xl">🌄</span>
                    <span className="text-xs text-slate-400">Upload wide banner</span>
                    <span className="text-[10px] text-slate-600">Shown on the course page header</span>
                  </button>
                )}
              </Field>
              {imgError && <p className="text-[12px] text-rose-400 sm:col-span-2">⚠ {imgError}</p>}
            </div>
          </div>
        )}

        {/* ── CURRICULUM ── */}
        {step === 'curriculum' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400">Build units and lessons. Open a lesson to write its material, attach files, and add a transcript. Drip days unlock lessons over time.</p>
            {units.map((unit, ui) => (
              <div key={unit.id} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={unit.title}
                    onChange={(e) => updateUnit(ui, { title: e.target.value })}
                    className="flex-1 bg-transparent text-base font-bold text-white focus:outline-none"
                  />
                  {units.length > 1 && <button onClick={() => removeUnit(ui)} className="text-rose-400/70 hover:text-rose-300 shrink-0" title="Remove unit"><IconX className="w-4 h-4" /></button>}
                </div>
                <input
                  value={unit.about}
                  onChange={(e) => updateUnit(ui, { about: e.target.value })}
                  placeholder="What this unit covers (optional)"
                  className="input text-xs mb-3 w-full !py-2"
                />
                <div className="flex flex-col gap-2">
                  {unit.lessons.map((ls, li) => (
                    <LessonCard
                      key={ls.id}
                      lesson={ls}
                      index={li}
                      count={unit.lessons.length}
                      onChange={(p) => updateLesson(ui, li, p)}
                      onMove={(d) => moveLesson(ui, li, d)}
                      onRemove={() => removeLesson(ui, li)}
                    />
                  ))}
                  <button onClick={() => addLesson(ui)} className="text-xs font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1 self-start"><IconPlus className="w-3.5 h-3.5" /> Add lesson</button>
                </div>
              </div>
            ))}
            <button onClick={addUnit} className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm font-semibold text-brand-300 hover:bg-white/[0.04]">+ Add unit</button>
          </div>
        )}

        {/* ── PRICING ── */}
        {step === 'pricing' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-5">
            <Field label="Pricing model" hint="Courses are free by default — you can charge a one-off price or a monthly subscription.">
              <div className="grid grid-cols-3 gap-2">
                {([['free', 'Free', 'Reach the widest audience'], ['one-off', 'One-off', 'Pay once, own forever'], ['subscription', 'Subscription', 'Recurring monthly']] as const).map(([id, label, sub]) => (
                  <button key={id} onClick={() => setPricingMode(id)} className={cn('rounded-xl border p-3 text-left transition', pricingMode === id ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]')}>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
            </Field>
            {pricingMode !== 'free' && (
              <Field label={pricingMode === 'subscription' ? 'Price per month (USD)' : 'Price (USD)'}>
                <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29" className="input max-w-[200px]" />
              </Field>
            )}
          </div>
        )}

        {/* ── PUBLISH ── */}
        {step === 'publish' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-300">Ready to publish? Your course appears on your channel and in the catalog.</p>
            <ul className="text-sm text-slate-300 flex flex-col gap-1.5">
              <li className={title.trim() ? '' : 'text-amber-300'}>{title.trim() ? '✓' : '⚠'} {title.trim() ? 'Title set' : 'Add a title (Basics)'}</li>
              <li className={totalLessons > 0 ? '' : 'text-amber-300'}>{totalLessons > 0 ? '✓' : '⚠'} {totalLessons} lessons across {units.length} unit{units.length === 1 ? '' : 's'}</li>
              <li className={about.trim() ? '' : 'text-slate-400'}>{about.trim() ? '✓' : '○'} About this course {about.trim() ? 'written' : '(optional but recommended)'}</li>
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
            onClick={() => { const idx = STEP_ORDER.indexOf(step); if (idx > 0) setStep(STEP_ORDER[idx - 1]) }}
            disabled={step === 'basics'}
            className="btn-ghost text-xs px-4 py-2 disabled:opacity-40"
          >
            <IconChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => { const idx = STEP_ORDER.indexOf(step); if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]) }}
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

// ─── Lesson card with inline rich-material editor ────────────────────────────

function LessonCard({
  lesson, index, count, onChange, onMove, onRemove
}: {
  lesson: DraftLesson
  index: number
  count: number
  onChange: (p: Partial<DraftLesson>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}): JSX.Element {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button onClick={() => onMove(-1)} className="text-slate-500 hover:text-brand-300 disabled:opacity-30" disabled={index === 0} title="Move up">▲</button>
          <button onClick={() => onMove(1)} className="text-slate-500 hover:text-brand-300 disabled:opacity-30" disabled={index === count - 1} title="Move down">▼</button>
        </div>
        <span className="w-6 h-6 rounded-full bg-white/[0.06] text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
        <input value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Lesson title" className="input flex-1 text-sm" />
        <button onClick={() => onChange({ open: !lesson.open })} className="btn-ghost text-xs px-2.5 py-1.5 shrink-0 inline-flex items-center gap-1">
          {lesson.open ? 'Close' : 'Edit material'} <IconChevronRight className={cn('w-3.5 h-3.5 transition', lesson.open && 'rotate-90')} />
        </button>
        {count > 1 && <button onClick={onRemove} className="text-rose-400/70 hover:text-rose-300 shrink-0" title="Remove lesson"><IconX className="w-4 h-4" /></button>}
      </div>

      {/* Lesson type */}
      <div className="flex flex-wrap gap-1.5 pl-12">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => onChange({ kind: k.id })}
            title={k.hint}
            className={cn('text-[11px] font-semibold rounded-full px-3 py-1.5 border transition', lesson.kind === k.id ? 'border-brand-400/40 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10')}
          >
            {k.label}
          </button>
        ))}
      </div>

      {lesson.kind === 'video' && (
        <div className="flex items-center gap-2 pl-12">
          <IconYouTube className="w-4 h-4 text-red-500 shrink-0" />
          <input value={lesson.link} onChange={(e) => onChange({ link: e.target.value })} placeholder="YouTube video link" className="input flex-1 text-xs" />
        </div>
      )}

      <div className="flex items-center gap-2 pl-12 flex-wrap">
        <span className="text-[11px] text-slate-500">Duration (min)</span>
        <input type="number" min={0} value={lesson.durationMin} onChange={(e) => onChange({ durationMin: Math.max(0, Number(e.target.value || 0)) })} className="w-16 input text-xs text-center !py-1.5" />
        <span className="text-[11px] text-slate-500 ml-auto">Unlocks day</span>
        <input type="number" min={0} value={lesson.dripDays} onChange={(e) => onChange({ dripDays: Math.max(0, Number(e.target.value || 0)) })} className="w-14 input text-xs text-center !py-1.5" />
      </div>

      {/* Expandable rich material editor */}
      {lesson.open && (
        <div className="pl-12 flex flex-col gap-3 pt-1">
          <Field label="What you'll learn" hint="A short summary shown above the lesson.">
            <textarea value={lesson.about} onChange={(e) => onChange({ about: e.target.value })} placeholder="In this lesson you'll…" className="input min-h-[60px] resize-y text-sm w-full" />
          </Field>
          <Field label="Lesson material" hint="The written article / notes learners read. Bold, headings, lists and links all render.">
            <RichTextEditor value={lesson.body} onChange={(v) => onChange({ body: v })} minRows={6} />
          </Field>
          <Field label="Materials" hint="Attach PDFs or audio learners can download.">
            <MaterialsField value={lesson.materials} onChange={(m) => onChange({ materials: m })} />
          </Field>
          {lesson.kind === 'video' && (
            <Field label="Transcript" hint="Optional — shown under the Transcript tab.">
              <textarea value={lesson.transcript} onChange={(e) => onChange({ transcript: e.target.value })} placeholder="Paste or write the video transcript…" className="input min-h-[80px] resize-y text-sm w-full" />
            </Field>
          )}
        </div>
      )}
    </div>
  )
}
