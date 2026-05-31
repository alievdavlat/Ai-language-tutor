/**
 * Personalized study plan (#A61) — turns a learner's real attempt history and
 * weak question types into a short, actionable plan. Pure function: given the
 * data, it returns ordered steps with a concrete in-app destination. No mock.
 */
import type { ExamAttempt, ExamKind } from '@shared/types'
import type { QType } from '../../features/exams/banks'
import type { TypeAccuracy } from './insights'

export interface PlanStep {
  id: string
  title: string
  /** Why this step is recommended (data-grounded). */
  reason: string
  /** CTA label + route. */
  cta: string
  to: string
  /** Loose tone hint for the UI accent. */
  tone: 'brand' | 'amber' | 'emerald' | 'violet'
}

/** Skill a question type best maps to for practice routing. */
function typeRoute(kind: ExamKind, qtype: QType): { to: string; skill: string } {
  const hub = kind === 'ielts' || kind === 'toefl' ? `/exams/${kind}` : '/exams'
  switch (qtype) {
    case 'grammar':
      return { to: '/grammar', skill: 'grammar' }
    case 'vocabulary':
      return { to: '/vocabulary', skill: 'vocabulary' }
    case 'math':
      return { to: '/exams', skill: 'math' }
    case 'detail':
    case 'main-idea':
    case 'inference':
    case 'reference':
    case 'purpose':
    default:
      return { to: `${hub}?skill=reading`, skill: 'reading' }
  }
}

/** Lowest-scoring section across recent attempts (normalised 0–100). */
function weakestSection(attempts: ExamAttempt[]): { id: string; pct: number } | null {
  const totals: Record<string, { sum: number; n: number }> = {}
  for (const a of attempts) {
    for (const [id, v] of Object.entries(a.sections)) {
      // IELTS bands 0–9 → %, others assumed already ~0–120/1600; normalise loosely.
      const pct = v <= 9 ? (v / 9) * 100 : v <= 30 ? (v / 30) * 100 : Math.min(100, v / 16)
      const t = totals[id] ?? { sum: 0, n: 0 }
      t.sum += pct
      t.n += 1
      totals[id] = t
    }
  }
  const rows = Object.entries(totals).map(([id, t]) => ({ id, pct: Math.round(t.sum / t.n) }))
  rows.sort((a, b) => a.pct - b.pct)
  return rows[0] ?? null
}

/**
 * Build the plan. `attempts` should already be filtered to `kind`. `weak` is the
 * learner's weakest question types (from the insights store).
 */
export function buildStudyPlan(kind: ExamKind, attempts: ExamAttempt[], weak: TypeAccuracy[]): PlanStep[] {
  const steps: PlanStep[] = []
  const hub = kind === 'ielts' || kind === 'toefl' ? `/exams/${kind}` : '/exams'

  // 1. No attempts → diagnostic first.
  if (attempts.length === 0) {
    steps.push({
      id: 'diagnostic',
      title: 'Take a diagnostic full mock',
      reason: 'You have no scored attempts yet — a full mock sets your baseline and unlocks the rest of your plan.',
      cta: 'Start a full mock',
      to: kind === 'ielts' || kind === 'toefl' ? `${hub}` : '/exams',
      tone: 'brand'
    })
    return steps
  }

  // 2. Weak question types → targeted practice (top 2).
  weak.slice(0, 2).forEach((w) => {
    const r = typeRoute(kind, w.qtype)
    steps.push({
      id: `weak-${w.qtype}`,
      title: `Drill ${w.label.toLowerCase()} questions`,
      reason: `You're at ${w.accuracy}% on ${w.label.toLowerCase()} (${w.correct}/${w.total}) — your weakest question type.`,
      cta: `Practise ${r.skill}`,
      to: r.to,
      tone: 'amber'
    })
  })

  // 3. Weakest section → focused section practice.
  const sec = weakestSection(attempts)
  if (sec && (kind === 'ielts' || kind === 'toefl')) {
    const label = sec.id.charAt(0).toUpperCase() + sec.id.slice(1)
    const route =
      sec.id === 'speaking' ? '/speaking' : sec.id === 'writing' ? `${hub}?skill=writing` : `${hub}?skill=${sec.id}`
    steps.push({
      id: `section-${sec.id}`,
      title: `Strengthen ${label}`,
      reason: `${label} is your lowest section (~${sec.pct}%). Focused practice raises your overall band fastest.`,
      cta: `Practise ${label}`,
      to: route,
      tone: 'violet'
    })
  }

  // 4. Speaking partner for fluency (always useful, capped list).
  if (steps.length < 4) {
    steps.push({
      id: 'speaking-partner',
      title: 'Talk with the AI speaking partner',
      reason: 'Regular spoken practice with instant examiner feedback builds the fluency the speaking section rewards.',
      cta: 'Open speaking partner',
      to: '/speaking',
      tone: 'emerald'
    })
  }

  // 5. Retake to measure progress.
  steps.push({
    id: 'retake',
    title: 'Retake a full mock to track progress',
    reason: `You've completed ${attempts.length} attempt${attempts.length === 1 ? '' : 's'}. Re-test after practice to see your trend.`,
    cta: 'Take another mock',
    to: kind === 'ielts' || kind === 'toefl' ? `${hub}` : '/exams',
    tone: 'brand'
  })

  return steps
}
