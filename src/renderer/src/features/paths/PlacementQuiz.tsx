import { useMemo, useState } from 'react'
import { cn } from '../../lib/classnames'
import { IconCheck, IconTarget, IconX } from '../../components/icons'
import type { LearningPath, PathGoal } from '../../services/paths/store'

/**
 * Short path-placement quiz (#A1). Asks two real questions — main goal and
 * current level — then recommends the best-matching path from the live store.
 * Wired to the "Take quiz" CTA on PathsPage; the result highlights + scrolls to
 * the recommended path. Distinct from the CEFR /level-test (that sets your
 * level; this picks a multi-course track).
 */

type LevelBand = 'beginner' | 'intermediate' | 'advanced'

const GOALS: { id: PathGoal; label: string; blurb: string; emoji: string }[] = [
  { id: 'exam', label: 'Pass an exam', blurb: 'IELTS, TOEFL or a band score', emoji: '🎯' },
  { id: 'business', label: 'Work & career', blurb: 'Meetings, emails, getting hired', emoji: '💼' },
  { id: 'travel', label: 'Travel & daily life', blurb: 'Restaurants, hotels, small talk', emoji: '✈️' },
  { id: 'foundations', label: 'Build my basics', blurb: 'Start from the ground up', emoji: '🧱' }
]

const LEVELS: { id: LevelBand; label: string; blurb: string }[] = [
  { id: 'beginner', label: 'Beginner', blurb: 'A1 – A2 · just starting' },
  { id: 'intermediate', label: 'Intermediate', blurb: 'B1 – B2 · can hold a conversation' },
  { id: 'advanced', label: 'Advanced', blurb: 'C1+ · refining & specializing' }
]

/** Pick the best path for a goal + level from the live path list. */
export function recommendPath(list: LearningPath[], goal: PathGoal, level: LevelBand): LearningPath | null {
  if (!list.length) return null
  // 1) Beginners are always best served by Foundations, whatever their goal.
  if (level === 'beginner') {
    const found = list.find((p) => p.goal === 'foundations')
    if (found) return found
  }
  // 2) Otherwise match the goal directly.
  const byGoal = list.find((p) => p.goal === goal)
  if (byGoal) return byGoal
  // 3) Fall back to the first path.
  return list[0]
}

interface Props {
  paths: LearningPath[]
  onClose: () => void
  onRecommend: (pathId: string) => void
}

export default function PlacementQuiz({ paths, onClose, onRecommend }: Props): JSX.Element {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<PathGoal | null>(null)
  const [level, setLevel] = useState<LevelBand | null>(null)

  const recommended = useMemo(
    () => (goal && level ? recommendPath(paths, goal, level) : null),
    [paths, goal, level]
  )

  const totalSteps = 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-card border border-white/10 bg-[#0e1016] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-grad-brand flex items-center justify-center">
              <IconTarget className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Find your path</p>
              <p className="text-[11px] text-slate-400">Two quick questions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition" aria-label="Close">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        {step < totalSteps && (
          <div className="flex items-center gap-1.5 px-5 pt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-brand-500' : 'bg-white/[0.08]')} />
            ))}
          </div>
        )}

        <div className="p-5">
          {/* Step 1 — goal */}
          {step === 0 && (
            <div>
              <h3 className="text-base font-bold text-white">What's your main goal?</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">We'll match you to the right track.</p>
              <div className="grid grid-cols-1 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setGoal(g.id); setStep(1) }}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      goal === g.id
                        ? 'border-brand-400 bg-brand-500/15'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                    )}
                  >
                    <span className="text-xl">{g.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white">{g.label}</span>
                      <span className="block text-xs text-slate-400">{g.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — level */}
          {step === 1 && (
            <div>
              <h3 className="text-base font-bold text-white">What's your current level?</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Be honest — it keeps the recommendation accurate.</p>
              <div className="grid grid-cols-1 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { setLevel(l.id); setStep(2) }}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                      level === l.id
                        ? 'border-brand-400 bg-brand-500/15'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white">{l.label}</span>
                      <span className="block text-xs text-slate-400">{l.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(0)}
                className="text-xs text-slate-500 hover:text-slate-300 mt-4"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Result */}
          {step === 2 && (
            <div className="text-center">
              {recommended ? (
                <>
                  <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">We recommend</p>
                  <div className={cn('mt-3 mx-auto h-24 w-full rounded-2xl bg-gradient-to-br relative overflow-hidden', recommended.cover)}>
                    {recommended.thumbnailUrl && (
                      <img src={recommended.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    )}
                    <div className="absolute inset-0 bg-black/25" />
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3">{recommended.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{recommended.subtitle}</p>
                  <button
                    onClick={() => { onRecommend(recommended.id); onClose() }}
                    className="btn-primary w-full py-2.5 mt-5 inline-flex items-center justify-center gap-2"
                  >
                    <IconCheck className="w-4 h-4" /> Show me this path
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400 py-6">No paths available yet.</p>
              )}
              <button
                onClick={() => { setStep(0); setGoal(null); setLevel(null) }}
                className="text-xs text-slate-500 hover:text-slate-300 mt-3"
              >
                Retake
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
