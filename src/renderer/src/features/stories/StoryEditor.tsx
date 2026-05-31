import { useState } from 'react'
import { Input } from '../../components/ui'
import { cn } from '../../lib/classnames'
import { createId } from '../../lib/ids'
import { IconPlus, IconX } from '../../components/icons'
import LevelSelect from '../../components/ui/LevelSelect'
import { stories, type StoredStory } from '../../services/stories/store'
import type { StoryPart, StoryQuestion } from '../../services/content/stories'

const KINDS: StoredStory['kind'][] = ['reading', 'listening', 'mixed']
const COVERS = ['from-rose-500 to-orange-500', 'from-sky-500 to-blue-700', 'from-violet-500 to-purple-700', 'from-emerald-500 to-teal-700', 'from-amber-500 to-orange-700']

const newPart = (): StoryPart => ({ title: '', paragraphs: [''] })
const newQ = (): StoryQuestion => ({ q: '', options: ['', '', '', ''], answer: 0 })

interface StoryEditorProps {
  initial?: StoredStory
  authorId?: string
  onClose: () => void
  onSaved: (s: StoredStory) => void
}

/** Create/edit a graded story: parts (paragraphs) + comprehension questions. #A32 */
export default function StoryEditor({ initial, authorId, onClose, onSaved }: StoryEditorProps): JSX.Element {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📖')
  const [level, setLevel] = useState(initial?.level ?? 'A2')
  const [kind, setKind] = useState<StoredStory['kind']>(initial?.kind ?? 'reading')
  const [blurb, setBlurb] = useState(initial?.blurb ?? '')
  const [cover, setCover] = useState(initial?.cover ?? COVERS[0])
  const [parts, setParts] = useState<StoryPart[]>(initial?.parts ?? [newPart()])
  const [questions, setQuestions] = useState<StoryQuestion[]>(initial?.questions ?? [newQ()])
  const [busy, setBusy] = useState(false)

  const canSave = !!title.trim() && parts.some((p) => p.paragraphs.some((x) => x.trim()))

  const save = (): void => {
    if (!canSave) return
    setBusy(true)
    const story: StoredStory = {
      id: initial?.id ?? createId('story'),
      title: title.trim(),
      emoji: emoji.trim() || '📖',
      level,
      kind,
      cover,
      xp: initial?.xp ?? 40,
      blurb: blurb.trim() || 'A short graded story.',
      parts: parts.map((p) => ({ title: p.title.trim() || 'Part', paragraphs: p.paragraphs.map((x) => x.trim()).filter(Boolean) })).filter((p) => p.paragraphs.length),
      questions: questions.filter((q) => q.q.trim()),
      builtIn: initial?.builtIn ?? false,
      authorId: initial?.authorId ?? authorId ?? 'me'
    }
    const saved = stories.upsert(story)
    setBusy(false)
    onSaved(saved)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}>
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between sticky top-0 bg-[#14182a]/90 backdrop-blur z-10">
          <h2 className="text-lg font-black tracking-tight text-white">{initial ? 'Edit story' : 'Create a story'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-14 text-center rounded-xl bg-white/[0.04] border border-white/10 text-2xl" title="emoji" />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story title *" className="flex-1" autoFocus />
          </div>
          <Input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Short blurb" />

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Level</p>
            <LevelSelect value={level} onChange={setLevel} />
            <div className="flex gap-1.5 pt-1">{KINDS.map((k) => <button key={k} onClick={() => setKind(k)} className={cn('rounded-pill px-3 py-1.5 text-xs font-bold capitalize border', kind === k ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300')}>{k}</button>)}</div>
          </div>
          <div className="flex gap-2">{COVERS.map((c) => <button key={c} onClick={() => setCover(c)} className={cn('h-8 w-12 rounded-lg bg-gradient-to-br ring-2', c, cover === c ? 'ring-white' : 'ring-transparent')} title="cover" />)}</div>

          {/* Parts */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Parts</p>
            {parts.map((p, pi) => (
              <div key={pi} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Part {pi + 1}</span>
                  <Input value={p.title} onChange={(e) => setParts((arr) => arr.map((x, i) => i === pi ? { ...x, title: e.target.value } : x))} placeholder="Part title" className="flex-1" />
                  {parts.length > 1 && <button onClick={() => setParts((arr) => arr.filter((_, i) => i !== pi))} className="text-rose-300"><IconX className="w-4 h-4" /></button>}
                </div>
                <textarea value={p.paragraphs.join('\n\n')} onChange={(e) => setParts((arr) => arr.map((x, i) => i === pi ? { ...x, paragraphs: e.target.value.split(/\n\s*\n/) } : x))} placeholder="Paragraphs (blank line between)" rows={4} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white resize-none" />
              </div>
            ))}
            <button onClick={() => setParts((p) => [...p, newPart()])} className="text-xs font-bold text-brand-300 inline-flex items-center gap-1"><IconPlus className="w-3.5 h-3.5" /> Add part</button>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Comprehension questions</p>
            {questions.map((q, qi) => (
              <div key={qi} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-500 mt-2">{qi + 1}.</span>
                  <Input value={q.q} onChange={(e) => setQuestions((arr) => arr.map((x, i) => i === qi ? { ...x, q: e.target.value } : x))} placeholder="Question" className="flex-1" />
                  {questions.length > 1 && <button onClick={() => setQuestions((arr) => arr.filter((_, i) => i !== qi))} className="text-rose-300"><IconX className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pl-5">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`ans-${qi}`} checked={q.answer === oi} onChange={() => setQuestions((arr) => arr.map((x, i) => i === qi ? { ...x, answer: oi } : x))} className="accent-emerald-400" />
                      <input value={opt} onChange={(e) => setQuestions((arr) => arr.map((x, i) => i === qi ? { ...x, options: x.options.map((o, k) => k === oi ? e.target.value : o) } : x))} placeholder={`Option ${oi + 1}`} className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-xs text-white" />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setQuestions((q) => [...q, newQ()])} className="text-xs font-bold text-brand-300 inline-flex items-center gap-1"><IconPlus className="w-3.5 h-3.5" /> Add question</button>
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2 sticky bottom-0 bg-[#14182a]/90 backdrop-blur">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : initial ? 'Save changes' : 'Create story'}</button>
        </footer>
      </div>
    </div>
  )
}
