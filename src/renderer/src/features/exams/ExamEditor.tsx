import { useState } from 'react'
import type { ExamKind } from '@shared/types'
import { Input } from '../../components/ui'
import { useT } from '../../i18n'
import { cn } from '../../lib/classnames'
import { createId } from '../../lib/ids'
import { IconPlus, IconX, IconHeadphones } from '../../components/icons'
import { exams, type StoredExam } from '../../services/exams/store'
import { uploadUrl } from '../../services/backend/storage'
import type { ExamSection, MCQSection, WritingSection } from './banks'

const KINDS: { id: ExamKind; label: string; scale: string }[] = [
  { id: 'ielts', label: 'IELTS', scale: 'Band 0–9' },
  { id: 'toefl', label: 'TOEFL', scale: 'Score 0–120' },
  { id: 'cefr', label: 'CEFR', scale: 'A1–C2' },
  { id: 'sat', label: 'SAT', scale: 'Score 400–1600' },
  { id: 'gmat', label: 'GMAT', scale: 'Score 200–800' },
  { id: 'custom', label: 'Custom', scale: 'Score' }
]

function newMcq(): MCQSection {
  return { id: createId('sec'), label: 'New section', kind: 'mcq', minutes: 10, items: [newItem()] }
}
function newItem(): MCQSection['items'][number] {
  return { id: createId('q'), prompt: '', options: ['', '', '', ''], correct: 0 }
}
function newWriting(): WritingSection {
  return { id: createId('sec'), label: 'Writing task', kind: 'writing', minutes: 20, prompt: '', minWords: 150 }
}

interface ExamEditorProps {
  initial?: StoredExam
  authorId?: string
  onClose: () => void
  onSaved: (e: StoredExam) => void
}

/** Create/edit an exam: title, family, sections (MCQ with answer keys + writing). #A30 */
export default function ExamEditor({ initial, authorId, onClose, onSaved }: ExamEditorProps): JSX.Element {
  const t = useT()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [kind, setKind] = useState<ExamKind>(initial?.kind ?? 'custom')
  const [sections, setSections] = useState<ExamSection[]>(initial?.sections ?? [newMcq()])
  const [busy, setBusy] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const canSave = !!title.trim() && sections.length > 0 &&
    sections.every((s) => s.kind !== 'mcq' || s.items.every((i) => i.prompt.trim() && i.options.filter((o) => o.trim()).length >= 2))

  const patch = (id: string, fn: (s: ExamSection) => ExamSection): void =>
    setSections((prev) => prev.map((s) => (s.id === id ? fn(s) : s)))

  const save = (): void => {
    if (!canSave) return
    setBusy(true)
    const scale = KINDS.find((k) => k.id === kind)?.scale ?? 'Score'
    const exam: StoredExam = {
      id: initial?.id ?? createId('exam'),
      kind,
      title: title.trim(),
      scaleLabel: scale,
      sections,
      builtIn: initial?.builtIn ?? false,
      authorId: initial?.authorId ?? authorId ?? 'me'
    }
    const saved = exams.upsert(exam)
    setBusy(false)
    onSaved(saved)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}>
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between sticky top-0 bg-[#14182a]/90 backdrop-blur z-10">
          <h2 className="text-lg font-black tracking-tight text-white">{initial ? t('exm.editExam') : t('exm.createExam')}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('exm.examTitlePh')} autoFocus />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">{t('exm.familyScoring')}</p>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button key={k.id} onClick={() => setKind(k.id)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', kind === k.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}>{k.label}</button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {sections.map((s, si) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider rounded px-1.5 py-0.5 bg-brand-500/20 text-brand-200">{s.kind}</span>
                  <Input value={s.label} onChange={(e) => patch(s.id, (x) => ({ ...x, label: e.target.value }))} placeholder={t('exm.sectionLabelPh')} className="flex-1" />
                  <input type="number" value={s.minutes} onChange={(e) => patch(s.id, (x) => ({ ...x, minutes: Number(e.target.value) || 1 }))} className="w-16 rounded-lg bg-white/[0.04] border border-white/10 px-2 py-2 text-sm text-white text-center" title={t('exm.minutes')} />
                  <button onClick={() => setSections((p) => p.filter((_, i) => i !== si))} className="text-rose-300 hover:text-rose-200 text-xs font-bold px-2">{t('exm.remove')}</button>
                </div>

                {s.kind === 'mcq' && (
                  <div className="space-y-3">
                    {/* Reading stimulus (optional) */}
                    <textarea
                      value={(s as MCQSection).passage ?? ''}
                      onChange={(e) => patch(s.id, (x) => ({ ...x, passage: e.target.value || undefined }) as ExamSection)}
                      placeholder={t('exm.passagePh')}
                      rows={2}
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white resize-none"
                    />

                    {/* Listening audio (optional) — upload a recording, or a script read aloud by neural TTS */}
                    <div className="rounded-xl bg-brand-500/[0.06] border border-brand-400/20 p-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-brand-200 font-bold flex items-center gap-1.5"><IconHeadphones className="w-3.5 h-3.5" /> {t('exm.listeningAudioOptional')}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className={cn('inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-white/[0.08]', uploadingId === s.id && 'opacity-60 pointer-events-none')}>
                          {uploadingId === s.id ? t('exm.uploading') : (s as MCQSection).audioUrl ? t('exm.replaceRecording') : t('exm.uploadRecording')}
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const input = e.target
                              const file = input.files?.[0]
                              if (!file) return
                              setUploadingId(s.id)
                              void (async () => {
                                try {
                                  const url = await uploadUrl(file, 'exam-audio')
                                  patch(s.id, (x) => ({ ...x, audioUrl: url }) as ExamSection)
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : t('exm.uploadFailed'))
                                } finally {
                                  setUploadingId(null)
                                  input.value = ''
                                }
                              })()
                            }}
                          />
                        </label>
                        {(s as MCQSection).audioUrl && (
                          <button onClick={() => patch(s.id, (x) => ({ ...x, audioUrl: undefined }) as ExamSection)} className="text-rose-300 hover:text-rose-200 text-xs font-bold">{t('exm.removeRecording')}</button>
                        )}
                        {(s as MCQSection).audioUrl && <span className="text-[11px] text-emerald-300">✓ {t('exm.recordingAttached')}</span>}
                      </div>
                      <textarea
                        value={(s as MCQSection).audioTranscript ?? ''}
                        onChange={(e) => patch(s.id, (x) => ({ ...x, audioTranscript: e.target.value || undefined }) as ExamSection)}
                        placeholder={t('exm.transcriptPh')}
                        rows={2}
                        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white resize-none"
                      />
                      <p className="text-[10px] text-slate-500">{t('exm.listeningSectionNote')}</p>
                    </div>

                    {s.items.map((it, ii) => (
                      <div key={it.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-slate-500 mt-2">{ii + 1}.</span>
                          <Input value={it.prompt} onChange={(e) => patch(s.id, (x) => ({ ...x, items: (x as MCQSection).items.map((q) => q.id === it.id ? { ...q, prompt: e.target.value } : q) }) as ExamSection)} placeholder={t('exm.questionPromptPh')} className="flex-1" />
                          <button onClick={() => patch(s.id, (x) => ({ ...x, items: (x as MCQSection).items.filter((q) => q.id !== it.id) }) as ExamSection)} className="text-slate-500 hover:text-rose-300"><IconX className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pl-5">
                          {it.options.map((opt, oi) => (
                            <label key={oi} className="flex items-center gap-2">
                              <input type="radio" name={`correct-${it.id}`} checked={it.correct === oi} onChange={() => patch(s.id, (x) => ({ ...x, items: (x as MCQSection).items.map((q) => q.id === it.id ? { ...q, correct: oi } : q) }) as ExamSection)} className="accent-emerald-400" title={t('exm.correctAnswer')} />
                              <input value={opt} onChange={(e) => patch(s.id, (x) => ({ ...x, items: (x as MCQSection).items.map((q) => q.id === it.id ? { ...q, options: q.options.map((o, k) => k === oi ? e.target.value : o) } : q) }) as ExamSection)} placeholder={`${t('exm.option')} ${oi + 1}`} className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-xs text-white" />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => patch(s.id, (x) => ({ ...x, items: [...(x as MCQSection).items, newItem()] }) as ExamSection)} className="text-xs font-bold text-brand-300 inline-flex items-center gap-1"><IconPlus className="w-3.5 h-3.5" /> {t('exm.addQuestion')}</button>
                    <p className="text-[10px] text-slate-500">{t('exm.selectRadioNote')}</p>
                  </div>
                )}

                {s.kind === 'writing' && (
                  <div className="space-y-2">
                    <textarea value={(s as WritingSection).prompt} onChange={(e) => patch(s.id, (x) => ({ ...x, prompt: e.target.value }) as ExamSection)} placeholder={t('exm.writingPromptPh')} rows={2} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white resize-none" />
                    <label className="text-xs text-slate-400 inline-flex items-center gap-2">{t('exm.minWords')} <input type="number" value={(s as WritingSection).minWords} onChange={(e) => patch(s.id, (x) => ({ ...x, minWords: Number(e.target.value) || 0 }) as ExamSection)} className="w-20 rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-white text-center" /></label>
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setSections((p) => [...p, newMcq()])} className="btn-ghost px-3 py-2 text-sm inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> {t('exm.mcqSection')}</button>
              <button onClick={() => setSections((p) => [...p, newWriting()])} className="btn-ghost px-3 py-2 text-sm inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> {t('exm.writingTask')}</button>
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2 sticky bottom-0 bg-[#14182a]/90 backdrop-blur">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">{t('exm.cancel')}</button>
          <button onClick={save} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? t('exm.saving') : initial ? t('exm.saveChanges') : t('exm.createExam')}</button>
        </footer>
      </div>
    </div>
  )
}
