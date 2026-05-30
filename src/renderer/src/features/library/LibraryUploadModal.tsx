import { useRef, useState } from 'react'
import type { LibraryKind, TargetLanguage } from '@shared/types'
import { cn } from '../../lib/classnames'
import { fileToDataUrl, isImageCover } from '../../lib/cover'
import { library } from '../../services/library/store'
import { Input } from '../../components/ui'
import { IconX } from '../../components/icons'

const KINDS: { id: LibraryKind; label: string; emoji: string }[] = [
  { id: 'book', label: 'Book (PDF)', emoji: '📚' },
  { id: 'video', label: 'Video', emoji: '🎬' },
  { id: 'audio', label: 'Audio', emoji: '🎧' }
]
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function parseYouTubeId(s: string): string | null {
  const t = s.trim()
  if (/^[\w-]{11}$/.test(t)) return t
  const m = t.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

export default function LibraryUploadModal({ language, onClose, onSaved }: { language: TargetLanguage; onClose: () => void; onSaved: () => void }): JSX.Element {
  const [kind, setKind] = useState<LibraryKind>('book')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [level, setLevel] = useState('A2')
  const [thumb, setThumb] = useState('')
  const [pdf, setPdf] = useState('')
  const [pageCount, setPageCount] = useState('1')
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
    set(await fileToDataUrl(file))
  }

  const canSave = title.trim() && (kind === 'book' ? !!pdf : kind === 'video' ? !!(videoLink || fullVideo) : !!audio)

  const save = async (): Promise<void> => {
    if (!canSave) { setErr('Fill the title and attach the required file.'); return }
    setBusy(true)
    const ytId = kind === 'video' ? parseYouTubeId(videoLink) : null
    await library.upsert({
      kind, title: title.trim(), author: author.trim() || undefined, level, language,
      thumbnailUrl: thumb || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : undefined),
      pdfUrl: kind === 'book' ? pdf : undefined,
      pageCount: kind === 'book' ? Math.max(1, Number(pageCount) || 1) : undefined,
      fullAudioUrl: kind === 'book' ? (fullAudio || undefined) : undefined,
      fullVideoUrl: kind === 'book' ? (fullVideo || undefined) : undefined,
      youtubeId: ytId ?? undefined,
      videoUrl: kind === 'video' ? (ytId ?? (fullVideo || undefined)) : undefined,
      audioUrl: kind === 'audio' ? audio : undefined
    })
    setBusy(false)
    onSaved()
    onClose()
  }

  const FileBtn = ({ label, value, accept, onPick, max }: { label: string; value: string; accept: string; onPick: (f?: File) => void; max?: number }): JSX.Element => {
    const ref = useRef<HTMLInputElement>(null)
    return (
      <div>
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        <button onClick={() => ref.current?.click()} className={cn('w-full rounded-xl border border-dashed px-3 py-2.5 text-sm text-left transition', value ? 'border-emerald-400/40 bg-emerald-500/[0.06] text-emerald-200' : 'border-white/15 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]')}>
          {value ? `✓ ${label} attached` : `+ ${label}${max ? ` (≤${max} MB)` : ''}`}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <header className="sticky top-0 bg-slate-900/95 backdrop-blur px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add to Library</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>
        <div className="px-6 py-5 space-y-4">
          {/* Kind */}
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button key={k.id} onClick={() => setKind(k.id)} className={cn('rounded-xl border p-3 text-center transition', kind === k.id ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]')}>
                <div className="text-xl">{k.emoji}</div>
                <p className="text-xs font-bold text-white mt-1">{k.label}</p>
              </button>
            ))}
          </div>

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author / channel" />
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="input">{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          </div>

          {/* Thumbnail */}
          <div className="flex items-center gap-3">
            <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => void readFile(e.target.files?.[0], setThumb, 4)} />
            {isImageCover(thumb)
              ? <img src={thumb} alt="" className="w-16 h-16 rounded-xl object-cover ring-1 ring-white/10" />
              : <div className="w-16 h-16 rounded-xl bg-white/[0.05] flex items-center justify-center text-2xl">{KINDS.find((k) => k.id === kind)?.emoji}</div>}
            <button onClick={() => thumbRef.current?.click()} className="btn-ghost px-3 py-2 text-sm">{thumb ? 'Replace thumbnail' : 'Add thumbnail (optional)'}</button>
          </div>

          {/* Per-kind fields */}
          {kind === 'book' && (
            <div className="space-y-3">
              <FileBtn label="PDF file *" value={pdf} accept="application/pdf" onPick={(f) => void readFile(f, setPdf, 8)} max={8} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} placeholder="Page count" />
              </div>
              <p className="text-[11px] text-slate-500">Optional read-along media (plays on every page):</p>
              <div className="grid grid-cols-2 gap-3">
                <FileBtn label="Full audio" value={fullAudio} accept="audio/*" onPick={(f) => void readFile(f, setFullAudio, 8)} />
                <FileBtn label="Full video" value={fullVideo} accept="video/*" onPick={(f) => void readFile(f, setFullVideo, 8)} />
              </div>
            </div>
          )}
          {kind === 'video' && (
            <div className="space-y-3">
              <Input value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="YouTube link or ID" />
              <p className="text-[11px] text-slate-500">…or upload a video file:</p>
              <FileBtn label="Video file" value={fullVideo} accept="video/*" onPick={(f) => void readFile(f, setFullVideo, 8)} />
            </div>
          )}
          {kind === 'audio' && (
            <FileBtn label="Audio file *" value={audio} accept="audio/*" onPick={(f) => void readFile(f, setAudio, 8)} max={8} />
          )}

          {err && <p className="text-[12px] text-rose-400">⚠ {err}</p>}
        </div>
        <footer className="sticky bottom-0 bg-slate-900/95 backdrop-blur px-6 py-4 border-t border-white/10 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => void save()} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : 'Add to Library'}</button>
        </footer>
      </div>
    </div>
  )
}
