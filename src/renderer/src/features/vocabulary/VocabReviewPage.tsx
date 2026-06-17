import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VocabItem } from '@shared/types'
import type { ReviewGrade } from '@shared/types/study.types'
import { cn } from '../../lib/classnames'
import { ProgressBar } from '../../components/ui'
import { IconCheck, IconVolume, IconX } from '../../components/icons'
import { useTargetLanguage } from '../../lib/language'
import { useVocab } from '../../services/study/useStudy'
import { formatInterval, previewIntervals } from '../../services/study/fsrs'

const GRADES: { grade: ReviewGrade; label: string; tone: string; key: string }[] = [
  { grade: 1, label: 'Again', tone: 'border-rose-400/50 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25', key: '1' },
  { grade: 2, label: 'Hard', tone: 'border-amber-400/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25', key: '2' },
  { grade: 3, label: 'Good', tone: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25', key: '3' },
  { grade: 4, label: 'Easy', tone: 'border-sky-400/50 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25', key: '4' }
]

function speak(text: string, lang: string): void {
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    /* no TTS available */
  }
}

export default function VocabReviewPage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const { due, review, loading } = useVocab(lang.code)

  // Freeze the queue for this session so cards we just graded don't vanish/reorder
  // mid-review. We snapshot the ids that were due when the session started.
  const [queueIds, setQueueIds] = useState<string[] | null>(null)
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [gradeTally, setGradeTally] = useState<Record<ReviewGrade, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 })
  // #B11 — cards re-queued within the session ("Again"): after grading they
  // leave `due` (rescheduled to tomorrow), so we keep a snapshot to re-render
  // them when they come back around in this session.
  const [requeued, setRequeued] = useState<Record<string, VocabItem>>({})

  // Initialise the session queue once cards have loaded.
  const activeQueue = useMemo(() => {
    if (queueIds === null) return due
    const byId = new Map(due.map((c) => [c.id, c] as const))
    return queueIds.map((id) => byId.get(id) ?? requeued[id]).filter(Boolean) as VocabItem[]
  }, [queueIds, due, requeued])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">Loading your cards…</div>
    )
  }

  // Lazy-init the frozen queue from the first non-loading render.
  if (queueIds === null && due.length > 0) {
    setQueueIds(due.map((c) => c.id))
  }

  const total = queueIds?.length ?? due.length
  const card = activeQueue[pos]
  const done = total === 0 || pos >= total || !card

  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 px-6 text-center max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full bg-grad-brand flex items-center justify-center shadow-glow">
          <IconCheck className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {reviewedCount > 0 ? 'Review complete!' : 'All caught up 🎉'}
          </h1>
          <p className="text-slate-400 mt-2">
            {reviewedCount > 0
              ? `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'}.`
              : 'No cards are due right now. Come back later or add new words.'}
          </p>
        </div>
        {reviewedCount > 0 && (
          <div className="flex items-center gap-2">
            {GRADES.map((g) => (
              <div key={g.grade} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center">
                <p className="text-lg font-bold text-white">{gradeTally[g.grade]}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{g.label}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => navigate('/vocabulary')} className="btn-primary px-8 mt-2">
          Back to vocabulary
        </button>
      </div>
    )
  }

  const intervals = previewIntervals(card, Date.now())
  const progress = (pos / total) * 100

  const grade = async (g: ReviewGrade): Promise<void> => {
    const updated = await review(card, g)
    setGradeTally((t) => ({ ...t, [g]: t[g] + 1 }))
    setReviewedCount((c) => c + 1)
    // #B11 — "Again" (grade 1) puts the card back at the END of the session so
    // the learner re-tests it before finishing, rather than it disappearing
    // until tomorrow. A later success commits the day-scale interval.
    if (g === 1) {
      setRequeued((r) => ({ ...r, [updated.id]: updated }))
      setQueueIds((ids) => (ids ? [...ids, updated.id] : [updated.id]))
    }
    setRevealed(false)
    setPos((p) => p + 1)
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/vocabulary')} className="text-slate-500 hover:text-white transition shrink-0" title="Exit review">
          <IconX className="w-6 h-6" />
        </button>
        <ProgressBar value={progress} className="h-2.5" />
        <span className="text-xs font-semibold text-slate-400 shrink-0 tabular-nums">{pos + 1}/{total}</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <span className="inline-flex items-center rounded-full bg-white/[0.06] text-slate-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 mb-5">
          {card.deck ?? 'Vocabulary'} · {card.state}
        </span>
        <div className="flex items-center gap-3">
          <h2 className="text-4xl font-black text-white">{card.term}</h2>
          <button
            onClick={() => speak(card.term, lang.code)}
            className="w-10 h-10 rounded-full bg-brand-500/15 hover:bg-brand-500/25 text-brand-200 flex items-center justify-center"
            title="Pronounce"
          >
            <IconVolume className="w-5 h-5" />
          </button>
        </div>

        {revealed ? (
          <div className="mt-6 animate-fade-in">
            <p className="text-xl text-slate-100 font-semibold">{card.translation}</p>
            {card.example && <p className="text-sm text-slate-400 italic mt-3 max-w-md">“{card.example}”</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-8">Recall the meaning, then reveal.</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6">
        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="btn-primary w-full py-3.5 text-base font-bold">
            Show answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                onClick={() => void grade(g.grade)}
                className={cn('rounded-2xl border px-2 py-3 font-bold transition flex flex-col items-center gap-1', g.tone)}
              >
                <span className="text-sm">{g.label}</span>
                <span className="text-[10px] font-medium opacity-80">{formatInterval(intervals[g.grade])}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
