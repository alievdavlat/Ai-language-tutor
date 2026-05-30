import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { InteractiveLesson } from '@shared/types/studio.types'
import { cn } from '../../../lib/classnames'
import { studio } from '../../../services/studio/store'
import { PageHeader } from '../../../components/ui'
import { IconCheck, IconTarget, IconX } from '../../../components/icons'

type Stage = 'begin' | 'think' | 'deeper' | 'discuss' | 'finally'
const STAGE_ORDER: Stage[] = ['begin', 'think', 'deeper', 'discuss', 'finally']
const STAGE_LABEL: Record<Stage, string> = { begin: "Let's Begin", think: 'Think', deeper: 'Dig Deeper', discuss: 'Discuss', finally: 'And Finally' }

interface Blank { answer: string }
function parseBlanks(text: string): { segments: string[]; blanks: Blank[] } {
  const segments: string[] = []
  const blanks: Blank[] = []
  const re = /\[\[(.+?)\]\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    segments.push(text.slice(last, m.index))
    blanks.push({ answer: m[1] })
    last = m.index + m[0].length
  }
  segments.push(text.slice(last))
  return { segments, blanks }
}

export default function LessonPlayerPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id')
  const [lesson, setLesson] = useState<InteractiveLesson | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [stage, setStage] = useState<Stage>('begin')

  // Think answers
  const [mcqPicks, setMcqPicks] = useState<Record<string, number>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [blankInputs, setBlankInputs] = useState<Record<number, string>>({})
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); return }
    void (async () => {
      const l = (await studio.getLessonByShareId(id)) ?? (await studio.getLesson(id))
      if (!l) { setNotFound(true); return }
      setLesson(l)
      void studio.recordLessonView(l.id)
    })()
  }, [id])

  const embedSrc = useMemo(() => {
    if (!lesson?.video) return null
    const { youtubeId, startSec, endSec } = lesson.video
    const q = new URLSearchParams({ rel: '0', modestbranding: '1' })
    if (startSec) q.set('start', String(Math.floor(startSec)))
    if (endSec) q.set('end', String(Math.floor(endSec)))
    return `https://www.youtube.com/embed/${youtubeId}?${q.toString()}`
  }, [lesson])

  if (notFound) {
    return (
      <div className="h-full grid place-items-center text-center">
        <div>
          <p className="text-lg font-bold text-white">Lesson not found</p>
          <p className="text-sm text-slate-400 mt-1">This lesson may be a draft or the link is wrong.</p>
          <button onClick={() => navigate('/courses')} className="btn-primary text-sm px-4 py-2 mt-4">Browse courses</button>
        </div>
      </div>
    )
  }
  if (!lesson) return <div className="h-full grid place-items-center text-slate-400">Loading lesson…</div>

  const blanks = lesson.fillBlank ? parseBlanks(lesson.fillBlank.text) : null
  const sIdx = STAGE_ORDER.indexOf(stage)

  const finish = (): void => {
    setDone(true)
    void studio.recordLessonCompletion(lesson.id)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-5">
        <PageHeader
          eyebrow={`Interactive lesson · ${lesson.level}${lesson.grammarFocus ? ` · ${lesson.grammarFocus}` : ''}`}
          title={lesson.title}
          back="/courses"
        />

        {/* Video */}
        <div className="rounded-card border border-white/10 bg-black/40 overflow-hidden">
          {embedSrc && <iframe title={lesson.title} src={embedSrc} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
        </div>

        {/* Stage stepper */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STAGE_ORDER.map((s, i) => (
            <button key={s} onClick={() => setStage(s)} className={cn(
              'rounded-full px-3 py-1.5 text-xs font-bold transition',
              s === stage ? 'bg-grad-brand text-white' : i < sIdx ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/[0.05] text-slate-400 hover:bg-white/10'
            )}>{STAGE_LABEL[s]}</button>
          ))}
        </div>

        <div className="rounded-card border border-white/10 bg-white/[0.025] p-6">
          {stage === 'begin' && <Prose text={lesson.letsBegin || 'Watch the video, then move on to the questions.'} />}

          {stage === 'think' && (
            <div className="flex flex-col gap-5">
              {lesson.think.length === 0 && <p className="text-sm text-slate-400">No questions for this lesson.</p>}
              {lesson.think.map((q, qi) => (
                <div key={q.id}>
                  <p className="text-sm font-semibold text-white mb-2">{qi + 1}. {q.prompt}</p>
                  {q.kind === 'mcq' ? (
                    <div className="flex flex-col gap-1.5">
                      {(q.options ?? []).map((opt, oi) => {
                        const picked = mcqPicks[q.id] === oi
                        const isCorrect = q.answerIndex === oi
                        const answered = mcqPicks[q.id] !== undefined
                        return (
                          <button key={oi} onClick={() => setMcqPicks((p) => ({ ...p, [q.id]: oi }))}
                            className={cn('text-left rounded-xl border px-3.5 py-2.5 text-sm transition flex items-center justify-between',
                              answered && isCorrect ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' :
                              picked && !isCorrect ? 'border-rose-400/40 bg-rose-500/10 text-rose-100' :
                              'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]')}>
                            {opt || `Option ${oi + 1}`}
                            {answered && isCorrect && <IconCheck className="w-4 h-4 text-emerald-300" />}
                            {picked && !isCorrect && <IconX className="w-4 h-4 text-rose-300" />}
                          </button>
                        )
                      })}
                      {mcqPicks[q.id] !== undefined && q.answerIndex !== mcqPicks[q.id] && q.hint && (
                        <p className="text-xs text-amber-300/90 mt-1">💡 {q.hint}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea placeholder="Type your answer…" className="input min-h-[80px] resize-y text-sm w-full" />
                      {q.sampleAnswer && (
                        <>
                          <button onClick={() => setRevealed((r) => ({ ...r, [q.id]: !r[q.id] }))} className="text-xs font-semibold text-brand-300 hover:text-brand-200 mt-1.5">
                            {revealed[q.id] ? 'Hide' : 'Show'} model answer
                          </button>
                          {revealed[q.id] && <p className="text-sm text-slate-300 mt-1.5 rounded-lg bg-white/[0.04] p-3 border border-white/10">{q.sampleAnswer}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {blanks && lesson.fillBlank && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
                  <p className="text-sm font-bold text-emerald-200 inline-flex items-center gap-2 mb-2"><IconTarget className="w-4 h-4" /> Fill in the blanks</p>
                  {lesson.fillBlank.instructions && <p className="text-xs text-slate-400 mb-2">{lesson.fillBlank.instructions}</p>}
                  <p className="text-sm text-slate-100 leading-loose">
                    {blanks.segments.map((seg, i) => (
                      <span key={i}>
                        {seg}
                        {i < blanks.blanks.length && (() => {
                          const val = blankInputs[i] ?? ''
                          const correct = val.trim().toLowerCase() === blanks.blanks[i].answer.trim().toLowerCase()
                          return (
                            <input value={val} onChange={(e) => setBlankInputs((b) => ({ ...b, [i]: e.target.value }))}
                              className={cn('inline-block w-28 mx-1 rounded-md border bg-black/30 px-2 py-0.5 text-sm text-center focus:outline-none',
                                !val ? 'border-white/20' : correct ? 'border-emerald-400/60 text-emerald-200' : 'border-rose-400/50 text-rose-200')}
                              placeholder="…" />
                          )
                        })()}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>
          )}

          {stage === 'deeper' && <Prose text={lesson.digDeeper || 'No extra resources for this lesson.'} />}
          {stage === 'discuss' && (
            <div>
              <Prose text={lesson.discuss || 'Discuss with your community.'} />
              <button onClick={() => navigate('/community')} className="btn-ghost text-sm px-4 py-2 mt-4">Open the community discussion →</button>
            </div>
          )}
          {stage === 'finally' && (
            <div>
              <Prose text={lesson.andFinally || 'Great work — you finished the lesson!'} />
              {lesson.targetVocab.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Words you practiced</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.targetVocab.map((w) => <span key={w} className="rounded-full bg-emerald-500/15 text-emerald-200 text-xs font-semibold px-2.5 py-1">{w}</span>)}
                  </div>
                </div>
              )}
              {!done ? (
                <button onClick={finish} className="btn-primary px-5 py-2.5 mt-5">Mark lesson complete</button>
              ) : (
                <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
                  <p className="text-2xl">🎉</p>
                  <p className="text-sm font-bold text-emerald-200 mt-1">Lesson complete!</p>
                  <button onClick={() => navigate('/courses')} className="btn-ghost text-sm px-4 py-2 mt-3">Back to courses</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => sIdx > 0 && setStage(STAGE_ORDER[sIdx - 1])} disabled={sIdx === 0} className="btn-ghost text-sm px-4 py-2 disabled:opacity-40">← Previous</button>
          {sIdx < STAGE_ORDER.length - 1
            ? <button onClick={() => setStage(STAGE_ORDER[sIdx + 1])} className="btn-primary text-sm px-4 py-2">Next →</button>
            : <button onClick={finish} className="btn-primary text-sm px-4 py-2">Finish</button>}
        </div>
      </div>
    </div>
  )
}

/** Tiny markdown-ish renderer: **bold**, line breaks, and bullet lines. */
function Prose({ text }: { text: string }): JSX.Element {
  const lines = text.split('\n')
  return (
    <div className="text-sm text-slate-200 leading-relaxed flex flex-col gap-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <span key={i} className="h-1" />
        const html = line.replace(/\*\*(.+?)\*\*/g, '<b class="text-white">$1</b>')
        const bullet = line.trimStart().startsWith('- ')
        return <p key={i} className={bullet ? 'pl-4' : ''} dangerouslySetInnerHTML={{ __html: bullet ? '• ' + html.replace(/^\s*-\s/, '') : html }} />
      })}
    </div>
  )
}
