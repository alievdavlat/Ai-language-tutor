import { useRef, useState } from 'react'
import type { LibraryKind, TargetLanguage } from '@shared/types'
import { cn } from '../../lib/classnames'
import { isImageCover } from '../../lib/cover'
import { uploadUrl } from '../../services/backend'
import { library } from '../../services/library/store'
import { Input } from '../../components/ui'
import { IconBook, IconCheck, IconChevronRight, IconHeadphones, IconPlus, IconX, IconYouTube } from '../../components/icons'

const KINDS: { id: LibraryKind; label: string; sub: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: 'book', label: 'Book', sub: 'PDF', Icon: IconBook },
  { id: 'video', label: 'Video', sub: 'YouTube / file', Icon: IconYouTube },
  { id: 'audio', label: 'Audio', sub: 'podcast / track', Icon: IconHeadphones }
]
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function parseYouTubeId(s: string): string | null {
  const t = s.trim()
  if (/^[\w-]{11}$/.test(t)) return t
  const m = t.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

/** Compact styled dropdown (the native <select> looked broken on dark). */
function LevelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-full flex items-center justify-between rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white hover:bg-white/[0.08]">
        <span>{value}</span>
        <IconChevronRight className={cn('w-4 h-4 text-slate-400 transition', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-800 shadow-2xl overflow-hidden">
          {LEVELS.map((l) => (
            <button key={l} type="button" onMouseDown={() => { onChange(l); setOpen(false) }}
              className={cn('w-full text-left px-3 py-2 text-sm hover:bg-brand-500/20', l === value ? 'text-brand-200 font-semibold bg-brand-500/10' : 'text-slate-200')}>
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** A polished upload dropzone that shows its filled state. */
function DropZone({ label, filled, accept, onPick, icon }: { label: string; filled: boolean; accept: string; onPick: (f?: File) => void; icon?: string }): JSX.Element {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      <button type="button" onClick={() => ref.current?.click()}
        className={cn('w-full rounded-xl border border-dashed px-4 py-3 text-sm flex items-center gap-2.5 transition',
          filled ? 'border-emerald-400/40 bg-emerald-500/[0.07] text-emerald-200' : 'border-white/15 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] hover:border-white/25')}>
        {filled ? <IconCheck className="w-4 h-4 shrink-0" /> : <span className="text-base leading-none shrink-0">{icon ?? '＋'}</span>}
        <span className="font-medium">{filled ? `${label} attached` : label}</span>
      </button>
    </div>
  )
}

export default function LibraryUploadModal({ language, onClose, onSaved }: { language: TargetLanguage; onClose: () => void; onSaved: (item: import('@shared/types').LibraryItem) => void }): JSX.Element {
  const [kind, setKind] = useState<LibraryKind>('book')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [level, setLevel] = useState('A2')
  const [thumb, setThumb] = useState('')
  const [pdf, setPdf] = useState('')
  const [fullAudio, setFullAudio] = useState('')
  const [fullVideo, setFullVideo] = useState('')
  const [videoLink, setVideoLink] = useState('')
  const [audio, setAudio] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const thumbRef = useRef<HTMLInputElement>(null)

  const readFile = async (file: File | undefined, set: (v: string) => void, max = 8): Promise<void> => {
    setErr(null)
    if (!file) return
    if (file.size > max * 1024 * 1024) { setErr(`File must be under ${max} MB (offline storage limit).`); return }
    set(await uploadUrl(file, 'library'))
  }

  const canSave = !!title.trim() && (kind === 'book' ? !!pdf : kind === 'video' ? !!(videoLink || fullVideo) : !!audio)

  const save = async (): Promise<void> => {
    if (!canSave) { setErr('Fill the title and attach the required file.'); return }
    setBusy(true)
    const ytId = kind === 'video' ? parseYouTubeId(videoLink) : null
    const created = await library.upsert({
      kind, title: title.trim(), author: author.trim() || undefined, level, language,
      thumbnailUrl: thumb || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : undefined),
      pdfUrl: kind === 'book' ? pdf : undefined,
      fullAudioUrl: kind === 'book' ? (fullAudio || undefined) : undefined,
      fullVideoUrl: kind === 'book' ? (fullVideo || undefined) : undefined,
      youtubeId: ytId ?? undefined,
      videoUrl: kind === 'video' ? (ytId ?? (fullVideo || undefined)) : undefined,
      audioUrl: kind === 'audio' ? audio : undefined
    })
    setBusy(false)
    onSaved(created)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gradient-to-b from-slate-850 to-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}>
        <header className="sticky top-0 z-10 bg-[#0c0f1a]/90 backdrop-blur px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Add to Library</h2>
            <p className="text-xs text-slate-400">Upload a book, video or audio — it appears instantly.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>

        <div className="px-6 py-5 space-y-5">
          {/* Kind selector */}
          <div className="grid grid-cols-3 gap-2.5">
            {KINDS.map((k) => {
              const Icon = k.Icon
              return (
                <button key={k.id} onClick={() => { setKind(k.id); setErr(null) }}
                  className={cn('rounded-2xl border p-3.5 text-center transition group', kind === k.id ? 'border-brand-400/50 bg-brand-500/15 shadow-glow-sm' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]')}>
                  <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition', kind === k.id ? 'bg-brand-500/25 text-brand-200' : 'bg-white/[0.06] text-slate-300')}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <p className="text-sm font-bold text-white">{k.label}</p>
                  <p className="text-[10px] text-slate-400">{k.sub}</p>
                </button>
              )
            })}
          </div>

          {/* Thumbnail + title row */}
          <div className="flex gap-4">
            <div className="shrink-0">
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => void readFile(e.target.files?.[0], setThumb, 4)} />
              {isImageCover(thumb) ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-1 ring-white/15 group">
                  <img src={thumb} alt="thumbnail" className="w-full h-full object-cover" />
                  <button onClick={() => setThumb('')} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><IconX className="w-3.5 h-3.5" /></button>
                  <button onClick={() => thumbRef.current?.click()} className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-semibold py-1 opacity-0 group-hover:opacity-100 transition">Replace</button>
                </div>
              ) : (
                <button onClick={() => thumbRef.current?.click()} className="w-24 h-24 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center gap-1 text-slate-400">
                  <IconPlus className="w-5 h-5" />
                  <span className="text-[10px]">Thumbnail</span>
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" />
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author / channel" />
                <LevelSelect value={level} onChange={setLevel} />
              </div>
            </div>
          </div>

          {/* Per-kind fields */}
          {kind === 'book' && (
            <div className="space-y-3">
              <DropZone label="PDF file *" filled={!!pdf} accept="application/pdf" onPick={(f) => void readFile(f, setPdf, 8)} icon="📄" />
              <div>
                <p className="text-[11px] text-slate-500 mb-2">Optional whole-book read-along (plays on pages without their own media — you can also attach media per page inside the reader):</p>
                <div className="grid grid-cols-2 gap-3">
                  <DropZone label="Full audio" filled={!!fullAudio} accept="audio/*" onPick={(f) => void readFile(f, setFullAudio, 8)} icon="🎧" />
                  <DropZone label="Full video" filled={!!fullVideo} accept="video/*" onPick={(f) => void readFile(f, setFullVideo, 8)} icon="🎬" />
                </div>
              </div>
            </div>
          )}
          {kind === 'video' && (
            <div className="space-y-3">
              <Input value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="YouTube link or ID" />
              <p className="text-[11px] text-slate-500">…or upload a video file:</p>
              <DropZone label="Video file" filled={!!fullVideo} accept="video/*" onPick={(f) => void readFile(f, setFullVideo, 8)} icon="🎬" />
            </div>
          )}
          {kind === 'audio' && (
            <DropZone label="Audio file *" filled={!!audio} accept="audio/*" onPick={(f) => void readFile(f, setAudio, 8)} icon="🎧" />
          )}

          {err && <p className="text-[12px] text-rose-400">⚠ {err}</p>}
        </div>

        <footer className="sticky bottom-0 bg-[#0c0f1a]/90 backdrop-blur px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => void save()} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : 'Add to Library'}</button>
        </footer>
      </div>
    </div>
  )
}
