import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar } from '../../components/ui'
import { IconBolt, IconCheck, IconHeart, IconX } from '../../components/icons'
import {
  UNITS,
  buildChallenge,
  checkAnswer,
  getLesson,
  type Exercise,
  type ExerciseKind,
  type GrammarLesson
} from '../grammar/curriculum'
import { CEFR_ORDER, type CEFRLevel } from '@shared/types'
import { backend } from '../../services/backend'
import { currentUserId } from '../../services/study/useStudy'
import { completeChallengeDay, completeLesson } from '../../services/study/grammarProgress'
import { recordActivity } from '../../services/progress'

// Legacy fallback drills — used when the player is opened without a lesson.
const FALLBACK: Exercise[] = [
  { kind: 'mcq', prompt: 'She ___ to work every morning.', hint: 'Present simple · third person', options: ['go', 'goes', 'going', 'gone'], correct: 1 },
  { kind: 'mcq', prompt: "Don't call me now — I ___ dinner.", hint: 'Present continuous', options: ['have', 'has', 'am having', 'had'], correct: 2 },
  { kind: 'fill', prompt: 'We ___ (go) to London last year.', hint: 'Past simple', answers: ['went'] }
]

/** Render **bold** segments in a rule bullet. */
function RuleText({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <b key={i} className="text-white">{p.slice(2, -2)}</b>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}

interface LoadedSession {
  title: string
  subtitle: string
  rule?: string[]
  exercises: Exercise[]
  /** Called when the whole session is finished with a 0–100 score. */
  onComplete: (score: number) => void
  /** Where the exit/finish button returns to. */
  back: string
}

export default function ExercisePlayer(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Resolve what to play from the URL: a grammar lesson, a challenge day, or the fallback.
  const session = useMemo<LoadedSession>(() => {
    const unitId = params.get('unit')
    const lessonId = params.get('lesson')
    const challengeId = params.get('challenge')
    const dayParam = params.get('day')

    if (unitId && lessonId) {
      const found = getLesson(unitId, lessonId)
      if (found) {
        const { unit, lesson } = found
        return {
          title: lesson.title,
          subtitle: `${unit.title} · ${unit.level}`,
          rule: lesson.kind === 'rule' ? lesson.rule : undefined,
          exercises: lesson.exercises,
          back: '/grammar',
          onComplete: (score) => {
            completeLesson(unit.id, lesson.id, score)
            void backend.recordActivity({
              userId: currentUserId(),
              kind: 'lesson_complete',
              xp: Math.round(score / 10) + 5,
              meta: { unit: unit.id, lesson: lesson.id, score }
            })
          }
        }
      }
    }

    if (challengeId && dayParam) {
      const day = Number(dayParam)
      const built = buildChallenge(challengeId)
      const challengeDay = built?.days.find((d) => d.day === day)
      if (built && challengeDay) {
        return {
          title: `Day ${day} — ${built.unit.title}`,
          subtitle: challengeDay.focus,
          exercises: challengeDay.exercises,
          back: `/grammar/challenge/${challengeId}`,
          onComplete: (score) => {
            completeChallengeDay(challengeId, day)
            void backend.recordActivity({
              userId: currentUserId(),
              kind: 'practice_session',
              xp: 10,
              meta: { challenge: challengeId, day, score }
            })
          }
        }
      }
    }

    // Level / skill practice launched from the CEFR hub. Grammar is the only
    // exercise pool we have, so a `level` filters the units by CEFR level and a
    // `skill` maps to the exercise kinds that grammar can genuinely drill
    // (writing → the `write`/`fill` production exercises).
    const levelParam = params.get('level')
    const skillParam = params.get('skill')
    if (levelParam || skillParam) {
      const wantLevel = levelParam && (CEFR_ORDER as readonly string[]).includes(levelParam)
        ? (levelParam as CEFRLevel)
        : null
      const skillKinds: Record<string, ExerciseKind[]> = { writing: ['write', 'fill'] }
      const wantKinds = skillParam ? skillKinds[skillParam] : undefined

      let pool = UNITS
        .filter((u) => !wantLevel || u.level === wantLevel)
        .flatMap((u) => u.lessons.flatMap((l) => l.exercises))
      if (wantKinds) pool = pool.filter((e) => wantKinds.includes(e.kind))

      const label = skillParam
        ? skillParam.charAt(0).toUpperCase() + skillParam.slice(1)
        : wantLevel
      return {
        title: `${label} practice`,
        subtitle: wantLevel ? `Targeted grammar · ${wantLevel}` : 'Grammar drills',
        // Cap the session so a level set stays a few-minute drill, not a marathon.
        exercises: pool.length > 0 ? pool.slice(0, 12) : FALLBACK,
        back: '/exams/cefr',
        onComplete: (score) => {
          void backend.recordActivity({
            userId: currentUserId(),
            kind: 'practice_session',
            xp: 10,
            meta: { level: wantLevel ?? null, skill: skillParam ?? null, score }
          })
        }
      }
    }

    return {
      title: 'Quick practice',
      subtitle: 'Grammar drills',
      exercises: FALLBACK,
      back: '/grammar',
      onComplete: () => {}
    }
  }, [params])

  const exercises = session.exercises
  const [showRule, setShowRule] = useState<boolean>(!!session.rule && session.rule.length > 0)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [hearts, setHearts] = useState(5)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const q = exercises[index]

  const isCorrect = checked
    ? q.kind === 'mcq'
      ? selected === q.correct
      : checkAnswer(q, typed)
    : false

  const canCheck = q.kind === 'mcq' ? selected !== null : typed.trim().length > 0

  const onCheck = (): void => {
    if (!canCheck) return
    setChecked(true)
    const right = q.kind === 'mcq' ? selected === q.correct : checkAnswer(q, typed)
    if (right) setCorrectCount((c) => c + 1)
    else setHearts((h) => Math.max(0, h - 1))
  }

  const onContinue = (): void => {
    if (index + 1 >= exercises.length) {
      const score = Math.round((correctCount / exercises.length) * 100)
      session.onComplete(score)
      // Gamification — feed the progress store so XP / streak / mastery update.
      recordActivity('lesson_complete', { skill: 'grammar', accuracy: score, xp: correctCount * 10 + 5 })
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setTyped('')
    setChecked(false)
  }

  // ── Rule intro screen ──
  if (showRule && session.rule) {
    return (
      <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-6">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(session.back)} className="text-slate-500 hover:text-white transition shrink-0" title="Exit">
            <IconX className="w-6 h-6" />
          </button>
          <p className="text-sm font-bold">{session.title}</p>
        </div>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-semibold mb-2">{session.subtitle}</p>
          <h2 className="text-2xl font-bold leading-snug mb-6">How it works</h2>
          <div className="flex flex-col gap-3">
            {session.rule.map((r, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 leading-relaxed">
                <RuleText text={r} />
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setShowRule(false)} className="btn-primary w-full py-3 mt-6">
          Start practice →
        </button>
      </div>
    )
  }

  // ── Completion screen ──
  if (done) {
    const xp = correctCount * 10
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-grad-brand flex items-center justify-center shadow-glow animate-fade-in">
          <IconBolt className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson complete!</h1>
          <p className="text-slate-400 mt-2">{correctCount} / {exercises.length} correct</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
            <p className="text-2xl font-bold text-brand-300">+{xp}</p>
            <p className="text-xs text-slate-400">XP earned</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center">
            <p className="text-2xl font-bold text-amber-300">{hearts}</p>
            <p className="text-xs text-slate-400">Hearts left</p>
          </div>
        </div>
        <button onClick={() => navigate(session.back)} className="btn-primary px-8 mt-2">Continue</button>
      </div>
    )
  }

  const progress = ((index + (checked ? 1 : 0)) / exercises.length) * 100
  const modelAnswer = q.kind !== 'mcq' ? q.answers?.[0] : q.options?.[q.correct ?? 0]

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(session.back)} className="text-slate-500 hover:text-white transition shrink-0" title="Exit lesson">
          <IconX className="w-6 h-6" />
        </button>
        <ProgressBar value={progress} className="h-2.5" />
        <span className="inline-flex items-center gap-1 text-rose-300 font-bold shrink-0">
          <IconHeart className="w-5 h-5" /> {hearts}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-semibold mb-2">
          {q.hint ?? session.subtitle}
          {q.phase && <span className="ml-2 text-slate-500 normal-case tracking-normal">· {q.phase}</span>}
        </p>
        <h2 className="text-2xl font-bold leading-snug mb-8">{q.prompt}</h2>

        {q.kind === 'mcq' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(q.options ?? []).map((opt, i) => {
              const isSel = selected === i
              const showCorrect = checked && i === q.correct
              const showWrong = checked && isSel && i !== q.correct
              return (
                <button
                  key={opt}
                  disabled={checked}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left font-semibold transition',
                    showCorrect
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                      : showWrong
                        ? 'border-rose-400/60 bg-rose-500/15 text-rose-200'
                        : isSel
                          ? 'border-brand-400 bg-brand-500/15 text-white'
                          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]'
                  )}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <input
              autoFocus
              value={typed}
              disabled={checked}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') (checked ? onContinue() : onCheck()) }}
              placeholder={q.kind === 'write' ? 'Rewrite the full sentence…' : 'Type the missing word…'}
              className={cn(
                'w-full rounded-2xl bg-white/[0.04] border px-4 py-4 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none transition',
                checked ? (isCorrect ? 'border-emerald-400/60' : 'border-rose-400/60') : 'border-white/10 focus:border-brand-400/70'
              )}
            />
            {q.kind === 'write' && <p className="text-[11px] text-slate-500 mt-2">Tip: write the complete sentence; minor punctuation is ignored.</p>}
          </div>
        )}
      </div>

      {/* Feedback + action */}
      <div className="mt-6">
        {checked && (
          <div className={cn('rounded-xl px-4 py-3 mb-3 text-sm font-semibold', isCorrect ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300')}>
            <div className="flex items-center gap-2">
              <IconCheck className="w-4 h-4" />
              {isCorrect ? 'Correct!' : `Answer: ${modelAnswer ?? ''}`}
            </div>
            {q.explanation && <p className="text-[12px] font-normal text-slate-400 mt-1.5 pl-6">{q.explanation}</p>}
          </div>
        )}
        {!checked ? (
          <button onClick={onCheck} disabled={!canCheck} className="btn-primary w-full py-3 disabled:opacity-40">Check</button>
        ) : (
          <button onClick={onContinue} className="btn-primary w-full py-3">
            {index + 1 >= exercises.length ? 'Finish' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}
