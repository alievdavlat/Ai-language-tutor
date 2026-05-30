import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading } from '../../components/ui'
import { IconPencilEdit, IconBolt, IconRefresh } from '../../components/icons'
import { analyze, SAMPLE_TEXT, type WordIssue, type SentenceLevel } from './analyze'

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

export default function WritingCoachPage(): JSX.Element {
  const [text, setText] = useState(SAMPLE_TEXT)
  const [mode, setMode] = useState<Mode>('edit')
  const [aiNote, setAiNote] = useState<string | null>(null)

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

  const runAi = (kind: 'rewrite' | 'feedback'): void => {
    setAiNote(
      kind === 'rewrite'
        ? 'AI rewrite will simplify flagged sentences using your cloud model (Gemini). Wiring to the AI router is the next pass.'
        : 'AI feedback (clarity, tone, grammar) will run on your cloud model. Wiring to the AI router is the next pass.'
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Write clearer English"
          title="Writing Coach"
          subtitle="Real-time readability feedback — bold, clear sentences win."
          back="/home"
        />

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
                onClick={() => runAi('rewrite')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-grad-brand text-white font-bold py-2.5 shadow-glow hover:brightness-110 transition"
              >
                <IconBolt className="w-4 h-4" /> Rewrite to simplify
              </button>
              <button
                onClick={() => runAi('feedback')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200 font-semibold py-2.5 hover:bg-white/[0.09] transition"
              >
                <IconRefresh className="w-4 h-4" /> Get feedback
              </button>
              {aiNote && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{aiNote}</p>}
            </div>
          </aside>
        </div>
      </div>
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
