import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Course } from '@shared/types'
import type { InteractiveLesson, ThinkQuestion } from '@shared/types/studio.types'
import { cn } from '../../../lib/classnames'
import { useAppStore } from '../../../store/useAppStore'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { fetchVideoMeta, thumbnailFor } from '../../../services/studio/youtube'
import { PageHeader, Tabs, type TabItem } from '../../../components/ui'
import LevelSelect from '../../../components/ui/LevelSelect'
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconStar,
  IconTarget,
  IconX,
  IconYouTube
} from '../../../components/icons'

const MAX_THINK = 15

type Section = 'video' | 'begin' | 'think' | 'deeper' | 'discuss' | 'finally' | 'details' | 'publish'
const SECTIONS: TabItem<Section>[] = [
  { id: 'video', label: '🎬 Video' },
  { id: 'begin', label: "Let's Begin" },
  { id: 'think', label: 'Think' },
  { id: 'deeper', label: 'Dig Deeper' },
  { id: 'discuss', label: 'Discuss' },
  { id: 'finally', label: 'And Finally' },
  { id: 'details', label: 'Details' },
  { id: 'publish', label: 'Publish' }
]

function emptyLesson(teacherId: string): InteractiveLesson {
  const ts = new Date().toISOString()
  return {
    id: `lsn_${Math.random().toString(36).slice(2, 10)}`,
    teacherId,
    title: '',
    targetLanguage: 'en',
    level: 'B1',
    letsBegin: '',
    think: [],
    digDeeper: '',
    discuss: '',
    andFinally: '',
    targetVocab: [],
    status: 'draft',
    createdAt: ts,
    updatedAt: ts,
    views: 0,
    completions: 0
  }
}

function newQuestion(kind: ThinkQuestion['kind']): ThinkQuestion {
  return kind === 'mcq'
    ? { id: `q_${Math.random().toString(36).slice(2, 8)}`, kind: 'mcq', prompt: '', options: ['', '', '', ''], answerIndex: 0 }
    : { id: `q_${Math.random().toString(36).slice(2, 8)}`, kind: 'open', prompt: '', sampleAnswer: '' }
}

export default function LessonBuilderPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id')
  const prefillYt = params.get('yt')
  const profile = useAppStore((s) => s.profile)
  const me = backend.currentUserId() ?? 'u_anon'

  const [section, setSection] = useState<Section>('video')
  const [lesson, setLesson] = useState<InteractiveLesson>(() => emptyLesson(me))
  const [linkInput, setLinkInput] = useState('')
  const [fetching, setFetching] = useState(false)
  const [busy, setBusy] = useState<'idle' | 'saving' | 'publishing'>('idle')
  const [vocabInput, setVocabInput] = useState('')

  const myCourses = useBackendQuery(() => backend.myCourses(me), [me], [] as Course[])

  // Load an existing lesson for editing.
  useEffect(() => {
    if (!editId) return
    void studio.getLesson(editId).then((l) => {
      if (l) {
        setLesson(l)
        if (l.video) setLinkInput(l.video.title ? `${l.video.title}` : l.video.youtubeId)
      }
    })
  }, [editId])

  // Prefill the video from a YouTube hand-off (?yt=ID) — used by the channel
  // import + paste-a-link flows (#25).
  useEffect(() => {
    if (!prefillYt || editId) return
    setLinkInput(prefillYt)
    void fetchVideoMeta(prefillYt).then((meta) => {
      if (meta) {
        setLesson((l) => ({
          ...l,
          video: { source: 'youtube', youtubeId: meta.youtubeId, startSec: 0, title: meta.title, channelTitle: meta.channelTitle },
          title: l.title || meta.title
        }))
      }
    })
  }, [prefillYt, editId])

  const patch = (p: Partial<InteractiveLesson>): void => setLesson((l) => ({ ...l, ...p }))

  const onFetchVideo = async (): Promise<void> => {
    setFetching(true)
    const meta = await fetchVideoMeta(linkInput)
    setFetching(false)
    if (!meta) return
    patch({
      video: {
        source: 'youtube',
        youtubeId: meta.youtubeId,
        startSec: lesson.video?.startSec ?? 0,
        endSec: lesson.video?.endSec,
        title: meta.title,
        channelTitle: meta.channelTitle
      },
      title: lesson.title || meta.title
    })
  }

  // ── Think helpers ──
  const addQuestion = (kind: ThinkQuestion['kind']): void => {
    if (lesson.think.length >= MAX_THINK) return
    patch({ think: [...lesson.think, newQuestion(kind)] })
  }
  const updateQuestion = (i: number, p: Partial<ThinkQuestion>): void =>
    patch({ think: lesson.think.map((q, j) => (j === i ? { ...q, ...p } : q)) })
  const removeQuestion = (i: number): void => patch({ think: lesson.think.filter((_, j) => j !== i) })
  const moveQuestion = (i: number, dir: -1 | 1): void => {
    const next = [...lesson.think]
    const target = i + dir
    if (target < 0 || target >= next.length) return
    ;[next[i], next[target]] = [next[target], next[i]]
    patch({ think: next })
  }

  // ── Vocab chips ──
  const addVocab = (): void => {
    const w = vocabInput.trim()
    if (w && !lesson.targetVocab.includes(w)) patch({ targetVocab: [...lesson.targetVocab, w] })
    setVocabInput('')
  }

  const save = async (publish: boolean): Promise<void> => {
    setBusy(publish ? 'publishing' : 'saving')
    await studio.upsertLesson(lesson)
    if (publish) {
      const pub = await studio.publishLesson(lesson.id)
      setLesson(pub)
    }
    setBusy('idle')
    if (publish) navigate('/teacher')
  }

  const embedSrc = useMemo(() => {
    if (!lesson.video) return null
    const { youtubeId, startSec, endSec } = lesson.video
    const q = new URLSearchParams({ rel: '0', modestbranding: '1' })
    if (startSec) q.set('start', String(Math.floor(startSec)))
    if (endSec) q.set('end', String(Math.floor(endSec)))
    return `https://www.youtube.com/embed/${youtubeId}?${q.toString()}`
  }, [lesson.video])

  const order: Section[] = SECTIONS.map((s) => s.id)
  const idx = order.indexOf(section)
  const ready = lesson.title.trim().length > 0 && !!lesson.video

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Teacher · Interactive lesson"
          title={editId ? 'Edit lesson' : 'Build an interactive lesson'}
          subtitle="TED-Ed style: a video, then Think · Dig Deeper · Discuss · And Finally."
          back="/teacher"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'Lesson builder' }]}
          action={
            <div className="flex items-center gap-2">
              <button onClick={() => void save(false)} disabled={busy !== 'idle'} className="btn-ghost text-xs px-4 py-2 disabled:opacity-50">
                {busy === 'saving' ? 'Saving…' : 'Save draft'}
              </button>
              <button onClick={() => navigate(`/teacher/course/new`)} className="btn-ghost text-xs px-4 py-2">Build a course →</button>
            </div>
          }
        />

        <Tabs items={SECTIONS} active={section} onChange={setSection} className="self-start flex-wrap" />

        {/* ── VIDEO ── */}
        {section === 'video' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">YouTube URL or video ID</label>
                <div className="flex gap-2 mt-1.5">
                  <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://youtu.be/… or 11-char ID" className="input flex-1" />
                  <button onClick={() => void onFetchVideo()} disabled={fetching || !linkInput.trim()} className="btn-primary px-4 disabled:opacity-50">
                    {fetching ? '…' : 'Fetch'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">We fetch the title & channel automatically (no API key needed).</p>
              </div>
              {lesson.video && (
                <>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex items-center gap-3">
                    <img src={thumbnailFor(lesson.video.youtubeId)} alt="" className="w-24 h-14 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{lesson.video.title ?? lesson.video.youtubeId}</p>
                      <p className="text-[11px] text-slate-400 truncate">{lesson.video.channelTitle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Crop start (sec)</label>
                      <input type="number" min={0} value={lesson.video.startSec ?? 0}
                        onChange={(e) => patch({ video: { ...lesson.video!, startSec: Math.max(0, Number(e.target.value) || 0) } })}
                        className="input mt-1.5" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Crop end (sec)</label>
                      <input type="number" min={0} value={lesson.video.endSec ?? ''} placeholder="(end)"
                        onChange={(e) => patch({ video: { ...lesson.video!, endSec: e.target.value ? Number(e.target.value) : undefined } })}
                        className="input mt-1.5" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="rounded-card border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center min-h-[240px]">
              {embedSrc ? (
                <iframe title="preview" src={embedSrc} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <div className="text-center text-slate-500 p-8">
                  <IconYouTube className="w-10 h-10 mx-auto text-red-500/60" />
                  <p className="text-sm mt-2">Fetch a video to preview the crop.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LET'S BEGIN ── */}
        {section === 'begin' && (
          <SectionEditor
            title="Let's Begin"
            help="A short, motivating framing. What will the learner notice in this video?"
            value={lesson.letsBegin}
            onChange={(v) => patch({ letsBegin: v })}
            placeholder="Great stories pull you in with vivid past events…"
          />
        )}

        {/* ── THINK ── */}
        {section === 'think' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">Comprehension questions · <b className="text-white">{lesson.think.length}</b>/{MAX_THINK}</p>
              <div className="flex gap-2">
                <button onClick={() => addQuestion('mcq')} disabled={lesson.think.length >= MAX_THINK} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"><IconPlus className="w-3.5 h-3.5" /> Multiple choice</button>
                <button onClick={() => addQuestion('open')} disabled={lesson.think.length >= MAX_THINK} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"><IconPlus className="w-3.5 h-3.5" /> Open answer</button>
              </div>
            </div>
            {lesson.think.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
                No questions yet. Add multiple-choice or open-answer prompts (max {MAX_THINK}).
              </div>
            )}
            {lesson.think.map((q, i) => (
              <div key={q.id} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-white/[0.06] text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-1">{i + 1}</span>
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full shrink-0 mt-1', q.kind === 'mcq' ? 'bg-brand-500/15 text-brand-200' : 'bg-violet-500/15 text-violet-200')}>{q.kind === 'mcq' ? 'Choice' : 'Open'}</span>
                  <input value={q.prompt} onChange={(e) => updateQuestion(i, { prompt: e.target.value })} placeholder="Question prompt…" className="input flex-1 text-sm" />
                  <div className="flex flex-col">
                    <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="text-slate-500 hover:text-brand-300 disabled:opacity-30 text-xs">▲</button>
                    <button onClick={() => moveQuestion(i, 1)} disabled={i === lesson.think.length - 1} className="text-slate-500 hover:text-brand-300 disabled:opacity-30 text-xs">▼</button>
                  </div>
                  <button onClick={() => removeQuestion(i)} className="text-rose-400/70 hover:text-rose-300 mt-1"><IconX className="w-4 h-4" /></button>
                </div>
                {q.kind === 'mcq' ? (
                  <div className="pl-8 flex flex-col gap-1.5">
                    {(q.options ?? []).map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-2">
                        <input type="radio" checked={q.answerIndex === oi} onChange={() => updateQuestion(i, { answerIndex: oi })} className="accent-emerald-500" />
                        <input value={opt} onChange={(e) => updateQuestion(i, { options: (q.options ?? []).map((o, j) => (j === oi ? e.target.value : o)) })} placeholder={`Option ${oi + 1}`} className="input flex-1 text-sm !py-1.5" />
                        {q.answerIndex === oi && <span className="text-[10px] font-bold text-emerald-300">CORRECT</span>}
                      </label>
                    ))}
                    <input value={q.hint ?? ''} onChange={(e) => updateQuestion(i, { hint: e.target.value })} placeholder="Optional hint" className="input text-xs mt-1 !py-1.5" />
                  </div>
                ) : (
                  <div className="pl-8">
                    <input value={q.sampleAnswer ?? ''} onChange={(e) => updateQuestion(i, { sampleAnswer: e.target.value })} placeholder="Model answer (shown after the learner submits)" className="input text-sm w-full" />
                  </div>
                )}
              </div>
            ))}

            {/* Embedded Clips-style fill-in-blank */}
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-white inline-flex items-center gap-2"><IconTarget className="w-4 h-4 text-emerald-300" /> Fill-in-the-blank drill <span className="text-[10px] font-normal text-slate-500">(optional · Clips-style)</span></p>
                {lesson.fillBlank && <button onClick={() => patch({ fillBlank: undefined })} className="text-xs text-rose-300 hover:text-rose-200">Remove</button>}
              </div>
              {lesson.fillBlank ? (
                <textarea value={lesson.fillBlank.text} onChange={(e) => patch({ fillBlank: { ...lesson.fillBlank!, text: e.target.value } })}
                  placeholder="Last summer we [[traveled]] to the coast." className="input min-h-[70px] resize-none text-sm w-full" />
              ) : (
                <button onClick={() => patch({ fillBlank: { text: '', instructions: 'Fill the blanks with the correct word.' } })} className="text-xs font-semibold text-brand-300 hover:text-brand-200">+ Add fill-in-blank task</button>
              )}
              {lesson.fillBlank && <p className="text-[11px] text-slate-500 mt-1.5">Wrap answers in <code className="text-emerald-300">[[double brackets]]</code> to mark blanks.</p>}
            </div>
          </div>
        )}

        {section === 'deeper' && (
          <SectionEditor title="Dig Deeper" help="Extra reading, grammar notes, links — markdown supported." value={lesson.digDeeper} onChange={(v) => patch({ digDeeper: v })} placeholder="Regular verbs add -ed. Common irregulars: go→went…" />
        )}
        {section === 'discuss' && (
          <SectionEditor title="Discuss" help="Open discussion prompts for the community / classroom." value={lesson.discuss} onChange={(v) => patch({ discuss: v })} placeholder="Tell the group about the best trip you ever took…" />
        )}
        {section === 'finally' && (
          <SectionEditor title="And Finally" help="A wrap-up or call to action." value={lesson.andFinally} onChange={(v) => patch({ andFinally: v })} placeholder="Record a 60-second story and post it for feedback." />
        )}

        {/* ── DETAILS ── */}
        {section === 'details' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Title</label>
              <input value={lesson.title} onChange={(e) => patch({ title: e.target.value })} placeholder="How storytellers use the past simple" className="input mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Level</label>
                <div className="mt-1.5">
                  <LevelSelect value={lesson.level} onChange={(l) => patch({ level: l })} />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Group into a course</label>
                <select value={lesson.courseId ?? ''} onChange={(e) => patch({ courseId: e.target.value || undefined })} className="input mt-1.5">
                  <option value="">— Standalone lesson —</option>
                  {myCourses.data.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Grammar focus</label>
              <input value={lesson.grammarFocus ?? ''} onChange={(e) => patch({ grammarFocus: e.target.value })} placeholder="Past simple (regular + irregular)" className="input mt-1.5" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Target vocabulary</label>
              <div className="flex gap-2 mt-1.5">
                <input value={vocabInput} onChange={(e) => setVocabInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVocab() } }} placeholder="Type a word, press Enter" className="input flex-1" />
                <button onClick={addVocab} className="btn-ghost px-4">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {lesson.targetVocab.map((w) => (
                  <span key={w} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs font-semibold px-2.5 py-1">
                    {w}<button onClick={() => patch({ targetVocab: lesson.targetVocab.filter((x) => x !== w) })} className="hover:text-white"><IconX className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PUBLISH ── */}
        {section === 'publish' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 flex flex-col gap-4">
            <ChecklistRow ok={!!lesson.video} label="Video added & cropped" />
            <ChecklistRow ok={lesson.letsBegin.trim().length > 0} label="Let's Begin intro written" />
            <ChecklistRow ok={lesson.think.length > 0} label={`${lesson.think.length} Think question${lesson.think.length === 1 ? '' : 's'}`} />
            <ChecklistRow ok={lesson.title.trim().length > 0} label="Title set" />
            {lesson.shareId && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Shareable link</p>
                  <p className="text-sm text-white truncate font-mono">/lesson?id={lesson.shareId}</p>
                </div>
                <button onClick={() => navigate(`/lesson?id=${lesson.shareId}`)} className="btn-ghost text-xs px-3 py-1.5 shrink-0">Open</button>
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => void save(false)} disabled={busy !== 'idle'} className="btn-ghost px-5 py-2.5 disabled:opacity-50">{busy === 'saving' ? 'Saving…' : 'Save draft'}</button>
              <button onClick={() => void save(true)} disabled={busy !== 'idle' || !ready} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                {busy === 'publishing' ? 'Publishing…' : 'Publish lesson'}
              </button>
            </div>
            {!ready && <p className="text-[11px] text-amber-300/80">Add a video and a title before publishing.</p>}
          </div>
        )}

        {/* Section nav */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => idx > 0 && setSection(order[idx - 1])} disabled={idx === 0} className="btn-ghost text-xs px-4 py-2 disabled:opacity-40"><IconChevronLeft className="w-4 h-4" /> Back</button>
          <button onClick={() => idx < order.length - 1 && setSection(order[idx + 1])} disabled={idx === order.length - 1} className="btn-primary text-xs px-4 py-2 disabled:opacity-40">Next <IconChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  )
}

function SectionEditor({ title, help, value, onChange, placeholder }: { title: string; help: string; value: string; onChange: (v: string) => void; placeholder: string }): JSX.Element {
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <IconStar className="w-4 h-4 text-brand-300" />
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      <p className="text-xs text-slate-400">{help}</p>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input mt-1 min-h-[200px] resize-y text-sm leading-relaxed" />
    </div>
  )
}

function ChecklistRow({ ok, label }: { ok: boolean; label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center', ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-slate-500')}>
        {ok ? <IconCheck className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      </span>
      <span className={ok ? 'text-slate-200' : 'text-slate-400'}>{label}</span>
    </div>
  )
}
