import { useMemo, useState } from 'react'
import { Input } from '../../components/ui'
import { cn } from '../../lib/classnames'
import { IconBolt, IconRefresh, IconX, IconYouTube } from '../../components/icons'
import LevelSelect from '../../components/ui/LevelSelect'
import { clips } from '../../services/clips/store'
import { type Clip, type ClipKind, KIND_LABEL, countBlankableWords } from './data'
import { fetchVideoMeta, thumbnailFor, parseYouTubeId } from '../../services/studio/youtube'
import { fetchSyncedLyrics, parseLRC, formatLRC, autoTimeLines } from './lrclib'

const KINDS: ClipKind[] = ['song', 'movie', 'tv', 'talk']
const COVERS = [
  'from-sky-500 to-blue-700',
  'from-pink-500 to-rose-700',
  'from-fuchsia-500 to-purple-700',
  'from-amber-500 to-orange-700',
  'from-indigo-500 to-violet-700',
  'from-emerald-500 to-teal-700',
  'from-red-500 to-rose-800'
]

interface ClipEditorProps {
  initial?: Clip
  authorId?: string
  onClose: () => void
  onSaved: (c: Clip) => void
}

/**
 * Create/edit a fill-in-the-blank clip (#A63): a YouTube source + synced lyrics
 * (auto-fetched from LRCLIB, or hand-edited as LRC) + an optional crop window.
 * Lyrics are the heart of the game, so the editor makes them first-class:
 * fetch → review → tweak, with a live blank-word count.
 */
export default function ClipEditor({ initial, authorId, onClose, onSaved }: ClipEditorProps): JSX.Element {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [artist, setArtist] = useState(initial?.artist ?? '')
  const [kind, setKind] = useState<ClipKind>(initial?.kind ?? 'song')
  const [level, setLevel] = useState(initial?.level ?? 'A2')
  const [genre, setGenre] = useState(initial?.genre ?? '')
  const [accent, setAccent] = useState(initial?.accent ?? '🇬🇧')
  const [duration, setDuration] = useState(initial?.duration ?? '')
  const [cover, setCover] = useState(initial?.cover ?? COVERS[0])

  const [linkInput, setLinkInput] = useState(initial?.youtubeId ?? '')
  const [youtubeId, setYoutubeId] = useState(initial?.youtubeId ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '')
  const [fetchingYt, setFetchingYt] = useState(false)

  const [startSec, setStartSec] = useState(initial?.startSec ?? 0)
  const [endSec, setEndSec] = useState(initial?.endSec ?? 0)

  const [lrcText, setLrcText] = useState(() => (initial?.lines?.length ? formatLRC(initial.lines) : ''))
  const [fetchingLrc, setFetchingLrc] = useState(false)
  const [lrcNote, setLrcNote] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)

  const lines = useMemo(() => parseLRC(lrcText), [lrcText])
  const wordCount = useMemo(() => countBlankableWords(lines), [lines])
  const canSave = !!title.trim() && !!artist.trim()

  const loadYt = async (): Promise<void> => {
    const id = parseYouTubeId(linkInput) ?? linkInput.trim()
    if (!id) return
    setFetchingYt(true)
    const meta = await fetchVideoMeta(linkInput)
    setFetchingYt(false)
    if (meta) {
      setYoutubeId(meta.youtubeId)
      setThumbnailUrl(meta.thumbnail)
      if (!title.trim()) setTitle(meta.title)
      if (!artist.trim()) setArtist(meta.channelTitle)
    } else {
      setYoutubeId(id)
      setThumbnailUrl(thumbnailFor(id))
    }
  }

  const fetchLrc = async (): Promise<void> => {
    if (!title.trim()) {
      setLrcNote('Add a title (and artist) first so LRCLIB can match it.')
      return
    }
    setFetchingLrc(true)
    setLrcNote(null)
    const found = await fetchSyncedLyrics(title, artist)
    setFetchingLrc(false)
    if (found && found.length) {
      setLrcText(formatLRC(found))
      setLrcNote(`Fetched ${found.length} synced lines from LRCLIB ✓`)
    } else {
      setLrcNote('No LRCLIB match. Paste the transcript below and use “Auto-time lines”.')
    }
  }

  // Renderer-side fallback for movies/talks (no LRC): strip any timestamps and
  // distribute the plain lines evenly across the crop window (or 0→duration).
  const autoTime = (): void => {
    const plain = lrcText.replace(/\[(\d+):(\d+(?:\.\d+)?)\]/g, '').trim()
    const end = endSec > startSec ? endSec : parseClock(duration) || startSec + Math.max(8, plain.split('\n').filter(Boolean).length * 3)
    const timed = autoTimeLines(plain, startSec, end)
    if (timed.length) {
      setLrcText(formatLRC(timed))
      setLrcNote(`Auto-timed ${timed.length} lines across ${startSec}s → ${Math.round(end)}s.`)
    }
  }

  const save = (): void => {
    if (!canSave) return
    setBusy(true)
    const payload: Omit<Clip, 'id' | 'createdAt'> & { id?: string } = {
      id: initial?.id,
      title: title.trim(),
      artist: artist.trim() || 'Unknown',
      kind,
      level,
      genre: genre.trim() || undefined,
      accent: accent.trim() || '🌐',
      duration: duration.trim() || (lines.length ? clockFromLines(lines) : '0:00'),
      cover,
      thumbnailUrl: thumbnailUrl || (youtubeId ? thumbnailFor(youtubeId) : undefined),
      youtubeId,
      plays: initial?.plays ?? '0',
      playCount: initial?.playCount ?? 0,
      ago: initial?.ago ?? 'just now',
      lang: initial?.lang ?? 'en',
      startSec: startSec || undefined,
      endSec: endSec > startSec ? endSec : undefined,
      lines: lines.length ? lines : undefined,
      authorId: initial?.authorId ?? authorId ?? 'me',
      builtIn: initial?.builtIn ?? false,
      visibility: initial?.visibility ?? 'public'
    }
    const saved = clips.upsert(payload)
    setBusy(false)
    onSaved(saved)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}>
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between sticky top-0 bg-[#14182a]/90 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">{initial ? 'Edit clip' : 'Create a clip'}</h2>
            <p className="text-[11px] text-slate-400">Listen & fill the gaps — music, movies & talks</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>

        <div className="px-6 py-5 space-y-5">
          {/* Identity */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={accent} onChange={(e) => setAccent(e.target.value)} maxLength={4} className="w-14 text-center rounded-xl bg-white/[0.04] border border-white/10 text-2xl" title="accent flag" />
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clip title *" className="flex-1" autoFocus />
            </div>
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist / source *" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre (e.g. Pop)" />
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (e.g. 3:35)" />
            </div>
            <div className="flex gap-1.5">
              {KINDS.map((k) => (
                <button key={k} onClick={() => setKind(k)} className={cn('rounded-pill px-3 py-1.5 text-xs font-bold border', kind === k ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300')}>{KIND_LABEL[k]}</button>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Level</p>
              <LevelSelect value={level} onChange={setLevel} />
            </div>
            <div className="flex gap-2 items-center">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mr-1">Cover</p>
              {COVERS.map((c) => <button key={c} onClick={() => setCover(c)} className={cn('h-7 w-10 rounded-lg bg-gradient-to-br ring-2', c, cover === c ? 'ring-white' : 'ring-transparent')} title="cover" />)}
            </div>
          </div>

          {/* Source */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5"><IconYouTube className="w-4 h-4 text-red-500" /> YouTube source</p>
            <div className="flex gap-2">
              <Input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="YouTube URL or ID" className="flex-1" />
              <button onClick={() => void loadYt()} disabled={fetchingYt || !linkInput.trim()} className="btn-primary px-4 text-sm disabled:opacity-50">{fetchingYt ? '…' : 'Load'}</button>
            </div>
            {youtubeId && (
              <div className="flex items-center gap-3">
                <img src={thumbnailUrl || thumbnailFor(youtubeId)} alt="" className="w-28 aspect-video object-cover rounded-lg ring-1 ring-white/10" />
                <div className="text-[11px] text-slate-400">
                  <p className="text-emerald-300 font-semibold">Video linked ✓</p>
                  <p className="font-mono">{youtubeId}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                Crop start (sec)
                <input type="number" min={0} value={startSec} onChange={(e) => setStartSec(Math.max(0, Number(e.target.value) || 0))} className="input mt-1.5" />
              </label>
              <label className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                Crop end (sec)
                <input type="number" min={0} value={endSec} onChange={(e) => setEndSec(Number(e.target.value) || 0)} className="input mt-1.5" />
              </label>
            </div>
            <p className="text-[10px] text-slate-500">Leave crop at 0 to use the whole video. Crop trims the playable window in the game.</p>
          </div>

          {/* Synced lyrics */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Synced lyrics (LRC)</p>
              <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5', lines.length ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.06] text-slate-400')}>
                {lines.length} lines · {wordCount} blankable words
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void fetchLrc()} disabled={fetchingLrc} className="btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
                <IconRefresh className="w-3.5 h-3.5" /> {fetchingLrc ? 'Searching LRCLIB…' : 'Auto-fetch from LRCLIB'}
              </button>
              <button onClick={autoTime} className="btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5">
                <IconBolt className="w-3.5 h-3.5" /> Auto-time plain lines
              </button>
            </div>
            <textarea
              value={lrcText}
              onChange={(e) => setLrcText(e.target.value)}
              rows={8}
              placeholder={'[00:27.00] You know you love me, I know you care\n[00:31.00] Just shout whenever, and I\'ll be there\n\n…or paste the plain transcript (one line each) and press “Auto-time plain lines”.'}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white font-mono resize-none focus:border-brand-400/60 outline-none"
            />
            {lrcNote && <p className="text-[11px] text-slate-400">{lrcNote}</p>}
            <p className="text-[10px] text-slate-500">Songs match LRCLIB best. Movies/talks: paste the transcript and auto-time it (server-side transcript/Whisper alignment is a follow-up).</p>
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2 sticky bottom-0 bg-[#14182a]/90 backdrop-blur">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={!canSave || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : initial ? 'Save changes' : 'Create clip'}</button>
        </footer>
      </div>
    </div>
  )
}

/** "3:35" → 215 seconds (0 if unparseable). */
function parseClock(s: string): number {
  const m = s.match(/(\d+):(\d+)/)
  if (!m) return 0
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

/** Derive a "m:ss" duration from the last lyric line + a tail. */
function clockFromLines(lines: { t: number }[]): string {
  const last = lines[lines.length - 1]?.t ?? 0
  const total = Math.round(last + 4)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
