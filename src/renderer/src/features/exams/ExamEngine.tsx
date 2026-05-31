import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { SectionResult } from '@shared/types/study.types'
import { cn } from '../../lib/classnames'
import { ProgressBar } from '../../components/ui'
import { IconHeadphones, IconMic, IconX } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { useChatStream } from '../../hooks/useChatStream'
import { useTargetLanguage } from '../../lib/language'
import { backend } from '../../services/backend'
import { logActivity } from '../../services/activity'
import { currentUserId } from '../../services/study/useStudy'
import {
  BANKS,
  scoreExam,
  scoreMcqSection,
  type ExamBank,
  type ExamSection,
  type MCQSection,
  type SpeakingSection,
  type WritingSection
} from './banks'
import { scoreWriting } from './writingScore'
import { scoreSpeaking } from './speakingScore'
import { exams } from '../../services/exams/store'
import ListeningAudio from './ListeningAudio'

type Phase = 'intro' | 'running' | 'grading' | 'report'

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── Lightweight Web Speech STT for the speaking section (optional) ──
type SpeechRec = { start: () => void; stop: () => void; onresult: ((e: unknown) => void) | null; onend: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string }
function getRecognition(lang: string): SpeechRec | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!Ctor) return null
  const r = new Ctor()
  r.continuous = true
  r.interimResults = false
  r.lang = lang
  return r
}

export default function ExamEngine({ bankId }: { bankId: string }): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Resolve from the editable store first (authored edits + custom exams),
  // falling back to the built-in bank.
  const rawBank = exams.get(bankId) ?? BANKS[bankId]
  // `?section=<id>` runs just that section as focused skill practice (launched
  // from the practice hub). A focused run is graded and reported like normal,
  // but is NOT persisted as a full exam attempt — that would skew best-score
  // stats, which should only reflect complete mocks.
  const focusId = params.get('section')
  const focused = !!(focusId && rawBank?.sections.some((s) => s.id === focusId))
  const bank: ExamBank | undefined = useMemo(() => {
    if (!rawBank) return undefined
    if (focused) return { ...rawBank, sections: rawBank.sections.filter((s) => s.id === focusId) }
    return rawBank
  }, [rawBank, focused, focusId])
  const profile = useAppStore((s) => s.profile)
  const lang = useTargetLanguage()
  const { send } = useChatStream(profile?.settings.llmModel ?? '')

  const [phase, setPhase] = useState<Phase>('intro')
  const [secIdx, setSecIdx] = useState(0)
  const [itemIdx, setItemIdx] = useState(0)
  const [secs, setSecs] = useState(0)
  // captured answers
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({})
  const [essays, setEssays] = useState<Record<string, string>>({})
  const [transcripts, setTranscripts] = useState<Record<string, string>>({})
  // results
  const [results, setResults] = useState<SectionResult[]>([])
  const [overall, setOverall] = useState<{ overall: string; scaleLabel: string; numeric: number } | null>(null)
  const [feedback, setFeedback] = useState<string[]>([])
  const startedAt = useRef<number>(0)
  const [recording, setRecording] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const recRef = useRef<SpeechRec | null>(null)
  // Always points at the latest `nextSection` so the timer can auto-submit.
  const nextSectionRef = useRef<() => void>(() => undefined)

  const section = bank?.sections[secIdx]

  // Per-section countdown timer with auto-submit. When the clock reaches zero
  // the current section is submitted automatically and the engine advances
  // (or grades, if it was the last section) — a real timed-exam behaviour.
  useEffect(() => {
    if (phase !== 'running' || !section) return
    let remaining = section.minutes * 60
    setSecs(remaining)
    const iv = setInterval(() => {
      remaining -= 1
      setSecs(remaining > 0 ? remaining : 0)
      if (remaining <= 0) {
        clearInterval(iv)
        nextSectionRef.current()
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [phase, secIdx, section])

  // Stop any recognition on unmount.
  useEffect(() => () => { try { recRef.current?.stop() } catch { /* noop */ } }, [])

  if (!bank) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-lg font-bold">Unknown exam</p>
        <button onClick={() => navigate('/exams')} className="btn-primary mt-4 px-6 py-2">Back to exams</button>
      </div>
    )
  }

  const gradeAll = async (): Promise<void> => {
    setPhase('grading')
    const out: SectionResult[] = []
    const fb: string[] = []
    const llmKind = bank.kind === 'ielts' ? 'ielts' : bank.kind === 'toefl' ? 'toefl' : null

    for (const sec of bank.sections) {
      if (sec.kind === 'mcq') {
        const correct = sec.items.reduce((n, it) => n + (mcqAnswers[it.id] === it.correct ? 1 : 0), 0)
        out.push(scoreMcqSection(bank, sec, correct))
      } else if (sec.kind === 'writing') {
        const essay = essays[sec.id] ?? ''
        let res: SectionResult | null = null
        if (llmKind) {
          const graded = await scoreWriting(llmKind, essay, send)
          if (graded) {
            res = { id: sec.id, label: sec.label, score: graded.score, numeric: Number(graded.score), pct: graded.pct, aiGraded: true }
            graded.feedback.forEach((f) => fb.push(`Writing — ${f.replace(/^[✓!]\s*/, '')}`))
          }
        }
        if (!res) {
          // Neutral fallback when too short / no LLM.
          const numeric = bank.kind === 'toefl' ? 18 : 5
          res = { id: sec.id, label: sec.label, score: bank.kind === 'toefl' ? '18' : '5.0', numeric, pct: bank.kind === 'toefl' ? 60 : 56 }
          fb.push('Writing — write at least the required word count to get an AI-graded band.')
        }
        out.push(res)
      } else if (sec.kind === 'speaking') {
        const transcript = transcripts[sec.id] ?? ''
        let res: SectionResult | null = null
        if (llmKind) {
          const graded = await scoreSpeaking(llmKind, transcript, send)
          if (graded) {
            res = { id: sec.id, label: sec.label, score: graded.score, numeric: graded.numeric, pct: graded.pct, aiGraded: true }
            graded.feedback.forEach((f) => fb.push(`Speaking — ${f.replace(/^[✓!]\s*/, '')}`))
          }
        }
        if (!res) {
          const numeric = bank.kind === 'toefl' ? 18 : 5
          res = { id: sec.id, label: sec.label, score: bank.kind === 'toefl' ? '18' : '5.0', numeric, pct: bank.kind === 'toefl' ? 60 : 56 }
          fb.push('Speaking — record or type at least a few sentences to get an AI-graded band.')
        }
        out.push(res)
      }
    }

    const scored = scoreExam(bank, out)
    if (fb.length === 0) fb.push('Solid work — review the sections where you lost the most marks.')

    setResults(scored.sections)
    setOverall({ overall: scored.overall, scaleLabel: scored.scaleLabel, numeric: scored.overallNumeric })
    setFeedback(fb)
    setPhase('report')

    // Persist through the Foundation backend. A focused single-section run is
    // logged as practice (XP only) — only a complete mock is recorded as an
    // exam attempt so best-score / tests-taken stats stay honest.
    const durationMin = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000))
    const sectionsMap: Record<string, number> = {}
    scored.sections.forEach((s) => { sectionsMap[s.id] = s.numeric })
    try {
      if (focused) {
        await logActivity({
          userId: currentUserId(),
          kind: 'practice_session',
          language: lang.code,
          minutes: durationMin,
          xp: 10,
          meta: { exam: bank.kind, section: bank.sections[0]?.id }
        })
      } else {
        await backend.recordExamAttempt({
          userId: currentUserId(),
          kind: bank.kind,
          language: lang.code,
          overall: scored.overallNumeric,
          sections: sectionsMap,
          cefr: bank.kind === 'cefr' ? (scored.overall as never) : undefined,
          feedback: fb.join(' • '),
          durationMin
        })
        await logActivity({
          userId: currentUserId(),
          kind: 'exam_attempt',
          language: lang.code,
          minutes: durationMin,
          xp: 20,
          meta: { exam: bank.kind, overall: scored.overall }
        })
      }
    } catch {
      /* persistence is best-effort in preview */
    }
  }

  const nextSection = (): void => {
    try { recRef.current?.stop() } catch { /* noop */ }
    setRecording(false)
    if (secIdx + 1 >= bank.sections.length) void gradeAll()
    else { setSecIdx((i) => i + 1); setItemIdx(0) }
  }
  nextSectionRef.current = nextSection

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">{bank.title}</h1>
        <p className="text-slate-400 mt-2">
          {focused
            ? `Section practice · ${bank.sections[0]?.label} · timed.`
            : `Full mock · ${bank.sections.length} sections · timed. Complete each section in order.`}
        </p>
        <div className="w-full mt-6 flex flex-col gap-2">
          {bank.sections.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="flex-1 text-left text-sm font-semibold text-white">{s.label}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-500">{s.kind}</span>
              <span className="text-xs text-slate-400">{s.minutes} min</span>
            </div>
          ))}
        </div>
        <button onClick={() => { startedAt.current = Date.now(); setPhase('running') }} className="btn-primary px-10 py-3 mt-7">Start exam</button>
        <button onClick={() => navigate(-1)} className="text-xs text-slate-500 hover:text-slate-300 mt-4">Cancel</button>
      </div>
    )
  }

  // ── Grading ──
  if (phase === 'grading') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin" />
        <p className="text-base font-semibold text-white mt-5">Grading your answers…</p>
        <p className="text-sm text-slate-400 mt-1">Objective sections scored from the answer key; writing & speaking graded by the AI examiner.</p>
      </div>
    )
  }

  // ── Report ──
  if (phase === 'report' && overall) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">{overall.scaleLabel}</p>
          <div className="text-6xl font-bold tracking-tight mt-2 bg-grad-brand bg-clip-text text-transparent">{overall.overall}</div>
          <p className="text-sm text-slate-400 mt-1">{bank.title}</p>

          <div className="w-full mt-7 flex flex-col gap-3">
            {results.map((b) => (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-200 font-medium">
                    {b.label}
                    {typeof b.correct === 'number' && <span className="text-[11px] text-slate-500 ml-2">{b.correct}/{b.total} correct</span>}
                    {b.aiGraded && <span className="text-[10px] text-emerald-300 ml-2">AI-graded</span>}
                  </span>
                  <span className="font-bold text-white">{b.score}</span>
                </div>
                <ProgressBar value={b.pct} />
              </div>
            ))}
          </div>

          <div className="w-full mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold mb-2">Examiner feedback</p>
            <ul className="flex flex-col gap-2">
              {feedback.map((f, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-brand-400">•</span>{f}</li>
              ))}
            </ul>
          </div>

          <div className="w-full mt-4">
            <button
              onClick={() => setShowReview((v) => !v)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.06] transition flex items-center justify-between"
            >
              <span>Review answers & transcripts</span>
              <span className="text-slate-500">{showReview ? '−' : '+'}</span>
            </button>
            {showReview && (
              <div className="mt-3 text-left">
                <ReviewPanel bank={bank} mcqAnswers={mcqAnswers} essays={essays} transcripts={transcripts} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-7 w-full">
            <button onClick={() => navigate('/exams')} className="btn-ghost flex-1 py-3">Back to exams</button>
            <button onClick={() => { setPhase('intro'); setSecIdx(0); setItemIdx(0); setMcqAnswers({}); setEssays({}); setTranscripts({}); setResults([]); setShowReview(false) }} className="btn-primary flex-1 py-3">Retake</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Running a section ──
  if (!section) return <div className="h-full" />
  const isLast = secIdx + 1 >= bank.sections.length

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-5">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white transition shrink-0" title="Exit exam"><IconX className="w-6 h-6" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{section.label}</p>
          <p className="text-[11px] text-slate-400">Section {secIdx + 1} of {bank.sections.length}</p>
        </div>
        <span className={cn('font-mono font-bold tabular-nums px-3 py-1 rounded-lg', secs < 60 ? 'text-rose-300 bg-rose-500/10' : 'text-slate-200 bg-white/[0.06]')}>{fmt(secs)}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {section.kind === 'mcq' && (
          <McqBody
            section={section}
            itemIdx={itemIdx}
            setItemIdx={setItemIdx}
            answers={mcqAnswers}
            onAnswer={(id, opt) => setMcqAnswers((a) => ({ ...a, [id]: opt }))}
          />
        )}
        {section.kind === 'writing' && (
          <WritingBody section={section} value={essays[section.id] ?? ''} onChange={(v) => setEssays((e) => ({ ...e, [section.id]: v }))} />
        )}
        {section.kind === 'speaking' && (
          <SpeakingBody
            section={section}
            value={transcripts[section.id] ?? ''}
            onChange={(v) => setTranscripts((t) => ({ ...t, [section.id]: v }))}
            recording={recording}
            onToggleRecord={() => {
              if (recording) { try { recRef.current?.stop() } catch { /* noop */ } setRecording(false); return }
              const rec = getRecognition(lang.code === 'en' ? 'en-US' : lang.code)
              if (!rec) { setRecording(false); return }
              recRef.current = rec
              rec.onresult = (e: unknown) => {
                const ev = e as { results: ArrayLike<ArrayLike<{ transcript: string }>> }
                let text = ''
                for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript + ' '
                setTranscripts((t) => ({ ...t, [section.id]: text.trim() }))
              }
              rec.onend = () => setRecording(false)
              try { rec.start(); setRecording(true) } catch { setRecording(false) }
            }}
          />
        )}
      </div>

      <button onClick={nextSection} className="btn-primary w-full py-3 mt-5">
        {isLast ? 'Finish & see score' : `Next: ${bank.sections[secIdx + 1].label}`}
      </button>
    </div>
  )
}

// ─── Section bodies ──────────────────────────────────────────────────────────

function McqBody({
  section,
  itemIdx,
  setItemIdx,
  answers,
  onAnswer
}: {
  section: MCQSection
  itemIdx: number
  setItemIdx: (n: number) => void
  answers: Record<string, number>
  onAnswer: (id: string, opt: number) => void
}): JSX.Element {
  const item = section.items[itemIdx]
  const answered = section.items.filter((it) => answers[it.id] !== undefined).length
  return (
    <div className="flex flex-col gap-5">
      {section.passage && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 max-h-48 overflow-y-auto text-sm text-slate-300 leading-relaxed">
          {section.passage}
        </div>
      )}
      {(section.audioUrl || section.audioTranscript) && (
        <ListeningAudio audioUrl={section.audioUrl} transcript={section.audioTranscript} />
      )}

      {/* Item navigation dots */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {section.items.map((it, i) => (
          <button
            key={it.id}
            onClick={() => setItemIdx(i)}
            className={cn('w-7 h-7 rounded-lg text-xs font-bold transition', i === itemIdx ? 'bg-brand-500 text-white' : answers[it.id] !== undefined ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.12]')}
          >
            {i + 1}
          </button>
        ))}
        <span className="text-[11px] text-slate-500 ml-2">{answered}/{section.items.length} answered</span>
      </div>

      <div>
        <p className="text-base font-bold mb-4">Q{itemIdx + 1}. {item.prompt}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {item.options.map((o, i) => (
            <button
              key={o}
              onClick={() => { onAnswer(item.id, i); if (itemIdx + 1 < section.items.length) setItemIdx(itemIdx + 1) }}
              className={cn('rounded-2xl border px-4 py-3 text-left font-medium transition', answers[item.id] === i ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]')}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function WritingBody({ section, value, onChange }: { section: WritingSection; value: string; onChange: (v: string) => void }): JSX.Element {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        <span className="font-semibold text-white">Task. </span>{section.prompt}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your response here…"
        className="w-full min-h-[260px] rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/70 focus:outline-none resize-none"
      />
      <div className="flex justify-end">
        <span className={cn('text-xs font-medium', words >= section.minWords ? 'text-emerald-300' : 'text-slate-500')}>{words} / {section.minWords} words</span>
      </div>
    </div>
  )
}

function SpeakingBody({
  section,
  value,
  onChange,
  recording,
  onToggleRecord
}: {
  section: SpeakingSection
  value: string
  onChange: (v: string) => void
  recording: boolean
  onToggleRecord: () => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {section.prompts.map((p) => (
        <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-semibold mb-1">{p.part}</p>
          <p className="text-sm font-semibold text-white">{p.prompt}</p>
        </div>
      ))}
      <div className="flex items-center justify-center gap-3 py-2">
        <button
          onClick={onToggleRecord}
          className={cn('w-16 h-16 rounded-full text-white flex items-center justify-center transition', recording ? 'bg-rose-500 animate-pulse' : 'bg-grad-brand hover:scale-105')}
          title={recording ? 'Stop recording' : 'Record answer'}
        >
          <IconMic className="w-7 h-7" />
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center -mt-1">{recording ? 'Listening… speak your answer.' : 'Tap to record (speech-to-text), or type your answer below.'}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your spoken answer appears here — or type it. The AI examiner grades this transcript."
        className="w-full min-h-[140px] rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/70 focus:outline-none resize-none"
      />
    </div>
  )
}

// ─── Post-test review ──────────────────────────────────────────────────────────

/**
 * Shown only after grading. Reveals each section's stimulus — including the
 * listening transcript that was hidden during the attempt — alongside the
 * learner's answer vs. the correct one, so a listening section can be checked
 * against the script after the fact (Listening ≠ Reading during the attempt).
 */
function ReviewPanel({
  bank,
  mcqAnswers,
  essays,
  transcripts
}: {
  bank: ExamBank
  mcqAnswers: Record<string, number>
  essays: Record<string, string>
  transcripts: Record<string, string>
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {bank.sections.map((sec) => (
        <div key={sec.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-bold text-white mb-2">{sec.label}</p>

          {sec.kind === 'mcq' && (
            <>
              {sec.passage && (
                <p className="text-[13px] text-slate-300 leading-relaxed mb-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">{sec.passage}</p>
              )}
              {sec.audioTranscript && (
                <div className="text-[13px] text-slate-300 leading-relaxed mb-3 rounded-xl bg-brand-500/[0.06] border border-brand-400/20 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-brand-200 font-bold mb-1.5 flex items-center gap-2"><IconHeadphones className="w-3.5 h-3.5" /> Audio transcript</p>
                  {sec.audioTranscript}
                </div>
              )}
              <ul className="flex flex-col gap-3">
                {sec.items.map((it, i) => {
                  const chosen = mcqAnswers[it.id]
                  const ok = chosen === it.correct
                  return (
                    <li key={it.id}>
                      <p className="text-[13px] font-semibold text-slate-200">
                        <span className={cn('mr-1.5', ok ? 'text-emerald-400' : 'text-rose-400')}>{ok ? '✓' : '✕'}</span>
                        Q{i + 1}. {it.prompt}
                      </p>
                      <div className="pl-5 mt-1 text-[12px] leading-relaxed">
                        <p className={ok ? 'text-emerald-300' : 'text-rose-300'}>
                          Your answer: {chosen === undefined ? '— (skipped)' : it.options[chosen]}
                        </p>
                        {!ok && <p className="text-emerald-300">Correct: {it.options[it.correct]}</p>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {sec.kind === 'writing' && (
            <>
              <p className="text-[12px] text-slate-400 mb-1.5">{sec.prompt}</p>
              <p className="text-[13px] text-slate-200 whitespace-pre-wrap rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">{essays[sec.id]?.trim() || '— (no response)'}</p>
            </>
          )}

          {sec.kind === 'speaking' && (
            <>
              {sec.prompts.map((p) => (
                <p key={p.id} className="text-[12px] text-slate-400 mb-1"><span className="text-brand-300 font-semibold">{p.part}:</span> {p.prompt}</p>
              ))}
              <p className="text-[13px] text-slate-200 whitespace-pre-wrap rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mt-1.5">{transcripts[sec.id]?.trim() || '— (no response)'}</p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
