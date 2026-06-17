import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading } from '../../components/ui'
import { IconPencilEdit, IconBolt, IconRefresh, IconUsers, IconPlus, IconClipboard, IconCheck } from '../../components/icons'
import { analyze, SAMPLE_TEXT, type WordIssue, type SentenceLevel } from './analyze'
import { useChatStream } from '../../hooks/useChatStream'
import { useIsAIReady } from '../../lib/ai'
import { scoreWriting, type WritingScore } from '../exams/writingScore'
import { rewriteSimpler, getClarityFeedback } from './ai'
import { useWritingTasks, type WritingTask } from '../../services/writing/store'
import { levels } from '../../services/levels/store'
import { usePermissions } from '../../lib/permissions'
import WritingTaskEditor from './WritingTaskEditor'

type Mode = 'write' | 'edit'

const SENTENCE_BG: Record<SentenceLevel, string> = {
  ok: '',
  hard: 'bg-amber-400/15 rounded',
  veryhard: 'bg-red-500/15 rounded'
}

const WORD_CLS: Record<WordIssue, string> = {
  adverb: 'text-sky-300 underline decoration-sky-400/40 decoration-2',
  weakener: 'text-sky-300 underline decoration-sky-400/40 decoration-2',
  passive: 'text-emerald-300 underline decoration-emerald-400/40 decoration-2',
  complex: 'text-violet-300 underline decoration-violet-400/40 decoration-2'
}

interface LegendRow {
  color: string
  label: string
  count: number
}

// Plain-language guide shown in the "How it works" panel.
const GUIDE: { color: string; label: string; tip: string }[] = [
  { color: '#f59e0b', label: 'Yellow sentence', tip: 'long & complex — try to split it in two.' },
  { color: '#f43f5e', label: 'Red sentence', tip: 'very hard to read — rewrite it shorter.' },
  { color: '#a855f7', label: 'Purple word', tip: 'a simpler everyday word exists — swap it.' },
  { color: '#0ea5e9', label: 'Blue word', tip: 'an adverb or weakener (just, very, really) — usually cut it.' },
  { color: '#10b981', label: 'Green word', tip: 'passive voice — prefer the active voice.' }
]

export default function WritingCoachPage(): JSX.Element {
  const navigate = useNavigate()
  const [text, setText] = useState(SAMPLE_TEXT)
  const [mode, setMode] = useState<Mode>('edit')
  const [showHelp, setShowHelp] = useState(true)

  // Standalone writing-task bank (#A33) — pick a prompt to write against.
  const { list: tasks, refresh: refreshTasks } = useWritingTasks()
  const { canAuthorContent } = usePermissions()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [editing, setEditing] = useState<WritingTask | 'new' | null>(null)
  const [showSample, setShowSample] = useState(false)
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null

  const pickTask = (t: WritingTask): void => {
    setActiveTaskId(t.id)
    setShowSample(false)
    setMode('write')
    // Start from a blank draft for the chosen task.
    setText('')
  }

  const aiReady = useIsAIReady()
  const { send } = useChatStream('')
  const [busy, setBusy] = useState<'rewrite' | 'feedback' | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [rewrite, setRewrite] = useState<string | null>(null)
  const [band, setBand] = useState<WritingScore | null>(null)
  const [feedback, setFeedback] = useState<string[] | null>(null)

  const a = useMemo(() => analyze(text), [text])

  const legend: LegendRow[] = [
    { color: '#f43f5e', label: `${a.counts.veryhard} sentence${a.counts.veryhard === 1 ? '' : 's'} very hard to read`, count: a.counts.veryhard },
    { color: '#f59e0b', label: `${a.counts.hard} sentence${a.counts.hard === 1 ? '' : 's'} hard to read`, count: a.counts.hard },
    { color: '#a855f7', label: `${a.counts.complex} word${a.counts.complex === 1 ? '' : 's'} with a simpler alternative`, count: a.counts.complex },
    { color: '#0ea5e9', label: `${a.counts.adverb + a.counts.weakener} adverb${a.counts.adverb + a.counts.weakener === 1 ? '' : 's'} & weakeners`, count: a.counts.adverb + a.counts.weakener },
    { color: '#10b981', label: `${a.counts.passive} use${a.counts.passive === 1 ? '' : 's'} of passive voice`, count: a.counts.passive }
  ]

  const gradeTone =
    a.grade === 0 ? 'text-slate-400' : a.grade <= 8 ? 'text-emerald-300' : a.grade <= 10 ? 'text-amber-300' : 'text-rose-300'

  const runAi = async (kind: 'rewrite' | 'feedback'): Promise<void> => {
    if (busy) return
    setAiError(null)
    if (!aiReady) {
      setAiError('No AI provider configured. Add one in Settings → AI to use the coach.')
      return
    }
    if (!text.trim()) {
      setAiError('Write something first.')
      return
    }
    setBusy(kind)
    try {
      if (kind === 'rewrite') {
        setRewrite(null)
        const result = await rewriteSimpler(text, (m) => send(m))
        if (!result) throw new Error('The model returned nothing — check your AI key in Settings → AI.')
        setRewrite(result)
      } else {
        setBand(null)
        setFeedback(null)
        const [clarity, scored] = await Promise.all([
          getClarityFeedback(text, (m) => send(m)),
          scoreWriting('ielts', text, (m) => send(m))
        ])
        setFeedback(clarity.bullets)
        setBand(scored) // null when essay too short to band fairly
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI request failed. Try again.')
    } finally {
      setBusy(null)
    }
  }

  const applyRewrite = (): void => {
    if (!rewrite) return
    setText(rewrite)
    setRewrite(null)
    setMode('edit')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Write clearer English"
          title="Writing Coach"
          subtitle="Real-time readability feedback — bold, clear sentences win."
          back="/home"
          action={
            <div className="flex items-center gap-2">
              {canAuthorContent && (
                <button
                  onClick={() => setEditing('new')}
                  className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-1.5"
                >
                  <IconPlus className="w-4 h-4" /> Create writing task
                </button>
              )}
              {!showHelp && (
                <button
                  onClick={() => setShowHelp(true)}
                  className="inline-flex items-center gap-2 rounded-pill bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.09] px-3.5 py-2 text-sm font-medium transition"
                >
                  ℹ How it works
                </button>
              )}
            </div>
          }
        />

        {/* Writing-task bank (#A33) — pick a prompt to write against */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <SectionHeading title="Writing tasks" subtitle="Pick a prompt, then draft your answer below" />
            {activeTask && (
              <button onClick={() => { setActiveTaskId(null); setShowSample(false) }} className="text-xs font-semibold text-slate-400 hover:text-slate-200 shrink-0">Free write</button>
            )}
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400">No writing tasks yet.{canAuthorContent ? ' Create one to give learners a prompt.' : ' Free-write below — your text gets the same readability feedback.'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pickTask(t)}
                  className={cn(
                    'group rounded-xl border px-3 py-2 text-left transition max-w-[15rem]',
                    activeTaskId === t.id ? 'border-brand-400 bg-brand-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {activeTaskId === t.id && <IconCheck className="w-3.5 h-3.5 text-brand-300 shrink-0" />}
                    <span className="text-sm font-bold text-white truncate">{t.title}</span>
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    <span className="capitalize">{t.type}</span> · {levels.nameOf(t.level)}{t.targetWords ? ` · ${t.targetWords} words` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTask && (
            <div className="mt-3 rounded-xl border border-brand-400/25 bg-brand-500/[0.06] p-4">
              <div className="flex items-start gap-2">
                <IconClipboard className="w-4 h-4 text-brand-300 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{activeTask.prompt}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    {activeTask.targetWords && (
                      <span className={cn(a.words >= activeTask.targetWords ? 'text-emerald-300' : '')}>
                        {a.words}/{activeTask.targetWords} words
                      </span>
                    )}
                    {activeTask.sampleAnswer && (
                      <button onClick={() => setShowSample((s) => !s)} className="font-semibold text-brand-300 hover:text-brand-200">
                        {showSample ? 'Hide sample answer' : 'Show sample answer'}
                      </button>
                    )}
                    {canAuthorContent && (
                      <button onClick={() => setEditing(activeTask)} className="font-semibold text-slate-400 hover:text-slate-200 ml-auto">Edit task</button>
                    )}
                  </div>
                  {showSample && activeTask.sampleAnswer && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Sample answer</p>
                      <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{activeTask.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Peer feedback exchange — get a human to review your writing */}
        <button
          onClick={() => navigate('/feedback')}
          className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/10 to-transparent px-5 py-3.5 flex items-center gap-3 text-left hover:border-white/20 transition"
        >
          <span className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0"><IconUsers className="w-5 h-5" /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-white">Peer feedback exchange</span>
            <span className="block text-xs text-slate-400">Review others' writing and get yours reviewed — earn karma.</span>
          </span>
          <span className="text-violet-300 text-sm font-semibold shrink-0">Open →</span>
        </button>

        {/* How-it-works instructions */}
        {showHelp && (
          <div className="relative rounded-2xl border border-brand-400/25 bg-brand-500/[0.07] p-5">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 flex items-center justify-center transition"
              title="Dismiss"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-white">How Writing Coach works</h3>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Write or paste your English in <b className="text-white">Write</b> mode, then switch to{' '}
              <b className="text-white">Edit</b> to see what to improve. Each color points to one fix.
              A <b className="text-white">lower readability grade</b> means your writing is easier to read.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-4">
              {GUIDE.map((g) => (
                <div key={g.label} className="flex items-start gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-sm mt-0.5 shrink-0" style={{ background: g.color }} />
                  <p className="text-sm text-slate-300">
                    <b className="text-white">{g.label}</b> — {g.tip}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Tip: hover a <span className="text-violet-300 underline decoration-violet-400/40">purple</span> word to
              see a simpler alternative. Use <b className="text-white">Rewrite</b> to let AI simplify it for you.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Editor */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden flex flex-col min-h-[60vh]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <div className="inline-flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <span className="w-7 h-7 rounded-lg bg-write/15 text-write flex items-center justify-center">
                  <IconPencilEdit className="w-4 h-4" />
                </span>
                Editor
              </div>
              <div className="inline-flex items-center gap-1 p-1 rounded-pill bg-white/[0.05] border border-white/10">
                {(['write', 'edit'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'px-3.5 py-1 rounded-pill text-xs font-bold capitalize transition',
                      mode === m ? 'bg-white/12 text-white' : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'write' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or write something, then switch to Edit to see the highlights…"
                className="flex-1 w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-600 outline-none"
              />
            ) : (
              <div className="flex-1 px-5 py-4 text-[15px] leading-relaxed text-slate-100 overflow-y-auto">
                {a.sentences.length === 0 && <p className="text-slate-600">Nothing to analyze yet — switch to Write.</p>}
                {a.sentences.map((s, si) => (
                  <span key={si} className={cn('px-0.5', SENTENCE_BG[s.level])}>
                    {s.tokens.map((tk, ti) => (
                      <span key={ti}>
                        <span className={tk.issue ? WORD_CLS[tk.issue] : undefined} title={tk.hint ? `try: ${tk.hint}` : undefined}>
                          {tk.text}
                        </span>{' '}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            {/* Readability */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <SectionHeading title="Readability" />
              <p className={cn('text-3xl font-extrabold leading-none', gradeTone)}>
                {a.grade === 0 ? '—' : `Grade ${a.grade}`}
              </p>
              <p className="text-sm text-slate-400 mt-1">{a.gradeLabel}</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <MiniStat value={a.words} label="Words" />
                <MiniStat value={`${a.readingSec}s`} label="Read time" />
              </div>
            </div>

            {/* Highlights legend + counts */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <SectionHeading title="Highlights" subtitle="Switch to Edit to see them inline" />
              <div className="flex flex-col gap-2">
                {legend.map((row) => (
                  <div
                    key={row.label}
                    className={cn('flex items-center gap-2.5 text-sm', row.count === 0 ? 'opacity-40' : '')}
                  >
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: row.color }} />
                    <span className="text-slate-300">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI actions */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex flex-col gap-2">
              <SectionHeading title="AI help" subtitle="Powered by your cloud model" />
              <button
                onClick={() => void runAi('rewrite')}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-grad-brand text-white font-bold py-2.5 shadow-glow hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <IconBolt className="w-4 h-4" /> {busy === 'rewrite' ? 'Rewriting…' : 'Rewrite to simplify'}
              </button>
              <button
                onClick={() => void runAi('feedback')}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200 font-semibold py-2.5 hover:bg-white/[0.09] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <IconRefresh className={cn('w-4 h-4', busy === 'feedback' && 'animate-spin')} />{' '}
                {busy === 'feedback' ? 'Analyzing…' : 'Get feedback'}
              </button>
              {!aiReady && (
                <p className="text-[11px] text-amber-300/90 mt-1 leading-relaxed">
                  Add a cloud model in Settings → AI to enable the coach.
                </p>
              )}
              {aiError && <p className="text-[11px] text-rose-300 mt-1 leading-relaxed">⚠ {aiError}</p>}
            </div>

            {/* AI rewrite result */}
            {rewrite && (
              <div className="rounded-2xl border border-brand-400/30 bg-brand-500/[0.06] p-4 flex flex-col gap-3">
                <SectionHeading title="Simplified rewrite" subtitle="Clearer, bolder version" />
                <p className="text-[14px] leading-relaxed text-slate-100 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {rewrite}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={applyRewrite}
                    className="flex-1 rounded-xl bg-grad-brand text-white font-bold py-2 text-sm shadow-glow hover:brightness-110 transition"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setRewrite(null)}
                    className="rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 font-semibold py-2 px-4 text-sm hover:bg-white/[0.09] transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* AI feedback result */}
            {feedback && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex flex-col gap-3">
                <SectionHeading title="Coach feedback" subtitle="Clarity, tone & grammar" />
                {band && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-300 leading-none">{band.score}</span>
                    <span className="text-xs text-slate-400">est. IELTS band</span>
                  </div>
                )}
                <ul className="flex flex-col gap-2">
                  {feedback.map((f, i) => (
                    <li
                      key={i}
                      className={cn(
                        'text-sm leading-snug flex items-start gap-2',
                        f.startsWith('✓') ? 'text-emerald-200' : 'text-slate-200'
                      )}
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      {editing && (
        <WritingTaskEditor
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => { setEditing(null); refreshTasks(); pickTask(t) }}
        />
      )}
    </div>
  )
}

function MiniStat({ value, label }: { value: ReactNode; label: string }): JSX.Element {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2">
      <p className="text-lg font-bold text-white leading-none">{value}</p>
      <p className="text-[11px] text-slate-500 mt-1">{label}</p>
    </div>
  )
}
