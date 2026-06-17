import { useState } from 'react'
import { Input } from '../../components/ui'
import { cn } from '../../lib/classnames'
import { createId } from '../../lib/ids'
import { IconX } from '../../components/icons'
import LevelSelect from '../../components/ui/LevelSelect'
import { writing, type WritingTask, type WritingTaskType } from '../../services/writing/store'

const TYPES: { id: WritingTaskType; label: string }[] = [
  { id: 'essay', label: 'Essay' },
  { id: 'letter', label: 'Letter' },
  { id: 'report', label: 'Report' },
  { id: 'review', label: 'Review' },
  { id: 'story', label: 'Story' },
  { id: 'email', label: 'Email' },
  { id: 'other', label: 'Other' }
]

interface WritingTaskEditorProps {
  initial?: WritingTask
  authorId?: string
  onClose: () => void
  onSaved: (t: WritingTask) => void
}

/** Create/edit a standalone writing task: prompt, type, level, word target + optional sample answer. #A33 */
export default function WritingTaskEditor({ initial, authorId, onClose, onSaved }: WritingTaskEditorProps): JSX.Element {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [type, setType] = useState<WritingTaskType>(initial?.type ?? 'essay')
  const [level, setLevel] = useState(initial?.level ?? 'B1')
  const [targetWords, setTargetWords] = useState<number>(initial?.targetWords ?? 200)
  const [sampleAnswer, setSampleAnswer] = useState(initial?.sampleAnswer ?? '')
  const [busy, setBusy] = useState(false)

  const canSave = !!title.trim() && !!prompt.trim()

  const save = (): void => {
    if (!canSave) return
    setBusy(true)
    const task: WritingTask = {
      id: initial?.id ?? createId('wt'),
      title: title.trim(),
      prompt: prompt.trim(),
      type,
      level,
      targetWords: targetWords > 0 ? targetWords : undefined,
      sampleAnswer: sampleAnswer.trim() || undefined,
      builtIn: initial?.builtIn ?? false,
      authorId: initial?.authorId ?? authorId ?? 'me'
    }
    const saved = writing.upsert(task)
    setBusy(false)
    onSaved(saved)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}>
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between sticky top-0 bg-[#14182a]/90 backdrop-blur z-10">
          <h2 className="text-lg font-black tracking-tight text-white">{initial ? 'Edit writing task' : 'Create a writing task'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title (e.g. Opinion essay — social media) *" autoFocus />

          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Type</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button key={t.id} onClick={() => setType(t.id)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', type === t.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}>{t.label}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Target level</p>
            <LevelSelect value={level} onChange={setLevel} />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Prompt *</p>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="What should the learner write? Give the task, the audience and any constraints." rows={4} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white resize-none" />
          </div>

          <label className="text-xs text-slate-400 inline-flex items-center gap-2">
            Word-count target (optional)
            <input type="number" min={0} value={targetWords} onChange={(e) => setTargetWords(Number(e.target.value) || 0)} className="w-24 rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-white text-center" />
          </label>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Sample answer (optional)</p>
            <textarea value={sampleAnswer} onChange={(e) => setSampleAnswer(e.target.value)} placeholder="A model answer shown to the learner after they draft — leave blank if none." rows={4} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white resize-none" />
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2 sticky bottom-0 bg-[#14182a]/90 backdrop-blur">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : initial ? 'Save changes' : 'Create task'}</button>
        </footer>
      </div>
    </div>
  )
}
