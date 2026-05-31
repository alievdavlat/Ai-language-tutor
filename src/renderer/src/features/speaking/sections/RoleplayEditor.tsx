import { useRef, useState } from 'react'
import { Input } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { isImageCover } from '../../../lib/cover'
import { uploadUrl } from '../../../services/backend'
import { IconPlus, IconX } from '../../../components/icons'
import {
  roleplays,
  coverFor,
  ROLEPLAY_SECTIONS,
  type Roleplay,
  type RoleplayDifficulty,
  type RoleplaySection
} from '../../../services/roleplay'

const DIFFICULTIES: { id: RoleplayDifficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' }
]

interface RoleplayEditorProps {
  /** Existing scenario to edit, or undefined to create a new one. */
  initial?: Roleplay
  authorId?: string
  onClose: () => void
  onSaved: (r: Roleplay) => void
}

/**
 * Create/edit a role-play scenario, with a thumbnail upload (data URL, exactly
 * like course covers). If no image is uploaded, a thematic Pollinations cover
 * is generated from the title so every scenario still has art. (#A26)
 */
export default function RoleplayEditor({ initial, authorId, onClose, onSaved }: RoleplayEditorProps): JSX.Element {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [blurb, setBlurb] = useState(initial?.blurb ?? '')
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [difficulty, setDifficulty] = useState<RoleplayDifficulty>(initial?.difficulty ?? 'easy')
  const [section, setSection] = useState<RoleplaySection>(initial?.section ?? 'daily')
  const [duration, setDuration] = useState(initial?.duration ?? '3-5 minutes')
  const [level, setLevel] = useState(initial?.level ?? 'A2')
  const [thumb, setThumb] = useState(initial?.thumbnailUrl ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💬')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const canSave = !!title.trim() && !!prompt.trim()

  const onPickFile = async (file?: File): Promise<void> => {
    if (!file) return
    setThumb(await uploadUrl(file, 'covers'))
  }

  const save = async (): Promise<void> => {
    if (!canSave) return
    setBusy(true)
    const saved = roleplays.upsert({
      id: initial?.id,
      title: title.trim(),
      blurb: blurb.trim() || 'Practice this conversation with the AI.',
      prompt: prompt.trim(),
      difficulty,
      section,
      duration: duration.trim() || '3-5 minutes',
      level: level.trim() || undefined,
      thumbnailUrl: isImageCover(thumb) ? thumb : undefined,
      cover: initial?.cover ?? coverFor(title || 'role'),
      emoji: emoji.trim() || '💬',
      visibility: 'public',
      authorId: initial?.authorId ?? authorId ?? 'me'
    })
    setBusy(false)
    onSaved(saved)
  }

  const cover = initial?.cover ?? coverFor(title || 'role')
  const hasImage = isImageCover(thumb)

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}
      >
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between sticky top-0 bg-[#14182a]/90 backdrop-blur">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">{initial ? 'Edit role-play' : 'Create a role-play'}</h2>
            <p className="text-xs text-slate-400">Design a scenario — the AI plays the other person.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>

        <div className="px-6 py-5 space-y-4">
          {/* Thumbnail */}
          <div className="flex items-center gap-4">
            <div className={cn('w-28 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 flex items-center justify-center bg-gradient-to-br', !hasImage && cover)}>
              {hasImage
                ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                : <span className="text-4xl select-none">{emoji || '💬'}</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="btn-ghost px-3 py-2 text-sm inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> Upload image</button>
                <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} placeholder="🙂" className="w-14 text-center rounded-lg bg-white/[0.04] border border-white/10 px-2 py-2 text-lg" title="Cover emoji" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">Upload a cover, or just pick an emoji — a themed gradient is used either way.</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onPickFile(e.target.files?.[0])} />
            </div>
          </div>

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Ordering at a restaurant) *" autoFocus />
          <Input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Short description" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="AI instruction * — e.g. “You are the waiter; greet me and take my order.”"
            rows={3}
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 resize-none"
          />

          {/* Difficulty */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Difficulty</p>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button key={d.id} onClick={() => setDifficulty(d.id)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', difficulty === d.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Section</p>
            <div className="flex flex-wrap gap-2">
              {ROLEPLAY_SECTIONS.filter((s) => s.id !== 'trending').map((s) => (
                <button key={s.id} onClick={() => setSection(s.id)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold transition', section === s.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (3-5 minutes)" />
            <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level (A2)" />
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2 sticky bottom-0 bg-[#14182a]/90 backdrop-blur">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => void save()} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : initial ? 'Save changes' : 'Create role-play'}</button>
        </footer>
      </div>
    </div>
  )
}
