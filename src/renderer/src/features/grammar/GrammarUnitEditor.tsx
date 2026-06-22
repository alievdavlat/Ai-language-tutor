import { useState } from 'react'
import { useT } from '../../i18n'
import { cn } from '../../lib/classnames'
import { IconPlus, IconX } from '../../components/icons'
import LevelSelect from '../../components/ui/LevelSelect'
import type { CEFRLevel } from '@shared/types'
import {
  allUnits,
  isSeedUnit,
  saveUnit,
  removeCustomUnit,
  type Exercise,
  type ExerciseKind,
  type GrammarLesson,
  type GrammarUnit
} from './curriculum'

/**
 * Grammar unit authoring (#A31) — teachers/admins create or override units
 * with repeatable lessons and exercises (mcq / fill / write), persisted via
 * the curriculum custom-unit store. No more hardcoded-only grammar content.
 */

const inputCls =
  'rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/60 w-full'
const labelCls = 'text-[10px] uppercase tracking-widest text-slate-400 font-bold'

function blankExercise(): Exercise {
  return { kind: 'mcq', prompt: '', options: ['', '', '', ''], correct: 0, explanation: '' }
}

function blankLesson(n: number): GrammarLesson {
  return { id: `lesson_${Date.now().toString(36)}_${n}`, title: '', kind: 'practice', duration: '5 min', exercises: [blankExercise()] }
}

export default function GrammarUnitEditor({
  unit,
  onClose,
  onSaved
}: {
  /** Existing unit to edit (seed units open as an override), or null to create. */
  unit: GrammarUnit | null
  onClose: () => void
  onSaved: () => void
}): JSX.Element {
  const t = useT()
  const [draft, setDraft] = useState<GrammarUnit>(() =>
    unit
      ? (JSON.parse(JSON.stringify(unit)) as GrammarUnit)
      : {
          id: `unit_${Date.now().toString(36)}`,
          number: allUnits().length + 1,
          title: '',
          about: '',
          level: 'A1',
          lessons: [blankLesson(0)]
        }
  )
  const editingSeed = unit ? isSeedUnit(unit.id) : false

  const patchLesson = (li: number, patch: Partial<GrammarLesson>): void =>
    setDraft((d) => ({ ...d, lessons: d.lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) }))

  const patchExercise = (li: number, ei: number, patch: Partial<Exercise>): void =>
    setDraft((d) => ({
      ...d,
      lessons: d.lessons.map((l, i) =>
        i === li ? { ...l, exercises: l.exercises.map((e, j) => (j === ei ? { ...e, ...patch } : e)) } : l
      )
    }))

  const valid =
    draft.title.trim().length > 0 &&
    draft.lessons.length > 0 &&
    draft.lessons.every(
      (l) =>
        l.title.trim() &&
        l.exercises.length > 0 &&
        l.exercises.every((e) =>
          e.kind === 'mcq'
            ? e.prompt.trim() && (e.options ?? []).filter((o) => o.trim()).length >= 2
            : e.prompt.trim() && (e.answers ?? []).some((a) => a.trim())
        )
    )

  const save = (): void => {
    if (!valid) return
    const clean: GrammarUnit = {
      ...draft,
      title: draft.title.trim(),
      about: draft.about.trim(),
      lessons: draft.lessons.map((l) => ({
        ...l,
        title: l.title.trim(),
        rule: l.kind === 'rule' ? (l.rule ?? []).map((r) => r.trim()).filter(Boolean) : undefined,
        exercises: l.exercises.map((e) =>
          e.kind === 'mcq'
            ? { ...e, prompt: e.prompt.trim(), options: (e.options ?? []).map((o) => o.trim()).filter(Boolean), answers: undefined }
            : { ...e, prompt: e.prompt.trim(), answers: (e.answers ?? []).map((a) => a.trim()).filter(Boolean), options: undefined, correct: undefined }
        )
      }))
    }
    saveUnit(clean)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card border border-white/10 bg-[#0f1424] p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{unit ? t('gr.editUnit') : t('gr.newGrammarUnit')}</h3>
            {editingSeed && <p className="text-[11px] text-amber-300 mt-0.5">{t('gr.editingBuiltIn')}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 flex items-center justify-center">
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Unit basics */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>{t('gr.unitTitle')}</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t('gr.unitTitlePlaceholder')} className={inputCls} />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={labelCls}>{t('gr.levelLabel')}</span>
            <LevelSelect value={draft.level} onChange={(level) => setDraft({ ...draft, level: level as CEFRLevel })} />
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{t('gr.aboutLabel')}</span>
          <input value={draft.about} onChange={(e) => setDraft({ ...draft, about: e.target.value })} placeholder={t('gr.aboutPlaceholder')} className={inputCls} />
        </label>

        {/* Lessons */}
        {draft.lessons.map((lesson, li) => (
          <div key={lesson.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-brand-300 uppercase tracking-widest">{t('gr.lessonWord')} {li + 1}</p>
              {draft.lessons.length > 1 && (
                <button onClick={() => setDraft((d) => ({ ...d, lessons: d.lessons.filter((_, i) => i !== li) }))} className="text-[11px] text-rose-300 hover:text-rose-200 font-semibold">
                  {t('gr.removeLesson')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
              <input value={lesson.title} onChange={(e) => patchLesson(li, { title: e.target.value })} placeholder={t('gr.lessonTitlePlaceholder')} className={inputCls} />
              <select
                value={lesson.kind}
                onChange={(e) => patchLesson(li, { kind: e.target.value as GrammarLesson['kind'] })}
                className={cn(inputCls, '[color-scheme:dark] w-auto')}
              >
                <option value="rule">{t('gr.kindRule')}</option>
                <option value="practice">{t('gr.kindPractice')}</option>
                <option value="quiz">{t('gr.kindQuiz')}</option>
              </select>
              <input value={lesson.duration} onChange={(e) => patchLesson(li, { duration: e.target.value })} placeholder={t('gr.durationPlaceholder')} className={cn(inputCls, 'w-24')} />
            </div>
            {lesson.kind === 'rule' && (
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>{t('gr.ruleBullets')}</span>
                <textarea
                  value={(lesson.rule ?? []).join('\n')}
                  onChange={(e) => patchLesson(li, { rule: e.target.value.split('\n') })}
                  rows={3}
                  className={cn(inputCls, 'resize-none')}
                />
              </label>
            )}

            {/* Exercises */}
            {lesson.exercises.map((ex, ei) => (
              <div key={ei} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <select
                    value={ex.kind}
                    onChange={(e) => patchExercise(li, ei, { kind: e.target.value as ExerciseKind })}
                    className={cn(inputCls, '[color-scheme:dark] w-auto py-1.5 text-xs')}
                  >
                    <option value="mcq">{t('gr.kindMcq')}</option>
                    <option value="fill">{t('gr.kindFill')}</option>
                    <option value="write">{t('gr.kindWrite')}</option>
                  </select>
                  {lesson.exercises.length > 1 && (
                    <button
                      onClick={() => patchLesson(li, { exercises: lesson.exercises.filter((_, j) => j !== ei) })}
                      className="text-[11px] text-rose-300 hover:text-rose-200 font-semibold"
                    >
                      {t('gr.removeWord')}
                    </button>
                  )}
                </div>
                <input
                  value={ex.prompt}
                  onChange={(e) => patchExercise(li, ei, { prompt: e.target.value })}
                  placeholder={ex.kind === 'mcq' ? t('gr.promptMcqPlaceholder') : t('gr.promptBlankPlaceholder')}
                  className={inputCls}
                />
                {ex.kind === 'mcq' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(ex.options ?? ['', '', '', '']).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={ex.correct === oi}
                          onChange={() => patchExercise(li, ei, { correct: oi })}
                          title={t('gr.correctAnswer')}
                          className="accent-emerald-400 shrink-0"
                        />
                        <input
                          value={opt}
                          onChange={(e) => {
                            const options = [...(ex.options ?? ['', '', '', ''])]
                            options[oi] = e.target.value
                            patchExercise(li, ei, { options })
                          }}
                          placeholder={`${t('gr.optionWord')} ${oi + 1}`}
                          className={cn(inputCls, 'py-1.5 text-xs')}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    value={(ex.answers ?? []).join(', ')}
                    onChange={(e) => patchExercise(li, ei, { answers: e.target.value.split(',').map((a) => a.trimStart()) })}
                    placeholder={t('gr.acceptedAnswers')}
                    className={cn(inputCls, 'text-xs')}
                  />
                )}
                <input
                  value={ex.explanation ?? ''}
                  onChange={(e) => patchExercise(li, ei, { explanation: e.target.value })}
                  placeholder={t('gr.explanationPlaceholder')}
                  className={cn(inputCls, 'py-1.5 text-xs')}
                />
              </div>
            ))}
            <button
              onClick={() => patchLesson(li, { exercises: [...lesson.exercises, blankExercise()] })}
              className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200"
            >
              <IconPlus className="w-3.5 h-3.5" /> {t('gr.addExercise')}
            </button>
          </div>
        ))}
        <button
          onClick={() => setDraft((d) => ({ ...d, lessons: [...d.lessons, blankLesson(d.lessons.length)] }))}
          className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200"
        >
          <IconPlus className="w-4 h-4" /> {t('gr.addLesson')}
        </button>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
          {unit && !editingSeed ? (
            <button onClick={() => { removeCustomUnit(unit.id); onSaved() }} className="text-xs font-semibold text-rose-300 hover:text-rose-200">
              {t('gr.deleteUnit')}
            </button>
          ) : unit && editingSeed ? (
            <button onClick={() => { removeCustomUnit(unit.id); onSaved() }} className="text-xs font-semibold text-amber-300 hover:text-amber-200">
              {t('gr.restoreBuiltIn')}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">{t('gr.cancel')}</button>
            <button onClick={save} disabled={!valid} className="btn-primary text-xs px-5 py-2 disabled:opacity-40">{t('gr.saveUnit')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
