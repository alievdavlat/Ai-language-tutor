import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Spinner } from '../../components/ui'
import PdfViewer from '../../components/PdfViewer'
import { IconChevronLeft, IconChevronRight, IconDownload, IconBookmark, IconHeart, IconVolume, IconYouTube, IconPlus } from '../../components/icons'
import { cn } from '../../lib/classnames'
import { isImageCover } from '../../lib/cover'
import { uploadUrl } from '../../services/backend'
import { library } from '../../services/library/store'
import { backend, useBackendQuery } from '../../services/backend/useBackend'

export default function LibraryBookPage(): JSX.Element {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { data: book, loading, refresh } = useBackendQuery(() => library.get(id), [id], null)
  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [saved, setSaved] = useState(library.isSaved(id))
  const [liked, setLiked] = useState(library.isLiked(id))
  const audioRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>
  if (!book || book.kind !== 'book') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-slate-400">Book not found.</p>
        <button onClick={() => navigate('/library')} className="btn-primary px-5 py-2">Back to Library</button>
      </div>
    )
  }

  const isOwner = backend.currentUserId() === book.ownerId
  const pm = book.pageMedia?.find((p) => p.page === page)
  const videoUrl = pm?.videoUrl ?? book.fullVideoUrl
  const audioUrl = pm?.audioUrl ?? book.fullAudioUrl

  const attach = async (kind: 'audio' | 'video', file?: File): Promise<void> => {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) return
    const url = await uploadUrl(file, 'library')
    const list = [...(book.pageMedia ?? [])]
    const i = list.findIndex((p) => p.page === page)
    const entry = i >= 0 ? { ...list[i] } : { page }
    if (kind === 'audio') entry.audioUrl = url
    else entry.videoUrl = url
    if (i >= 0) list[i] = entry; else list.push(entry)
    await library.upsert({ ...book, pageMedia: list })
    refresh()
  }

  const clearPageMedia = async (): Promise<void> => {
    const list = (book.pageMedia ?? []).filter((p) => p.page !== page)
    await library.upsert({ ...book, pageMedia: list })
    refresh()
  }

  const pagesWithMedia = (book.pageMedia ?? []).map((p) => p.page).sort((a, b) => a - b)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/library')} className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 shrink-0">
            <IconChevronLeft className="w-5 h-5" />
          </button>
          {isImageCover(book.thumbnailUrl) && <img src={book.thumbnailUrl} alt="" className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10" />}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{book.level ?? ''} · Book</p>
            <h1 className="text-xl font-black tracking-tight text-white truncate">{book.title}</h1>
            {book.author && <p className="text-sm text-slate-400">{book.author}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={async () => setLiked(await library.toggleLike(id))} className={cn('w-10 h-10 rounded-full border flex items-center justify-center transition', liked ? 'bg-rose-500/15 border-rose-400/40 text-rose-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Like"><IconHeart className="w-5 h-5" /></button>
            <button onClick={async () => setSaved(await library.toggleSave(id))} className={cn('w-10 h-10 rounded-full border flex items-center justify-center transition', saved ? 'bg-brand-500/15 border-brand-400/40 text-brand-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Save"><IconBookmark className="w-5 h-5" /></button>
            {book.pdfUrl && <a href={book.pdfUrl} download className="w-10 h-10 rounded-full border border-white/15 text-slate-300 hover:bg-white/5 flex items-center justify-center" title="Download"><IconDownload className="w-5 h-5" /></a>}
          </div>
        </div>

        {/* Two-column on wide screens: page (left, dominant) + media rail (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* PDF page — dominant, full width of its column */}
          <div className="min-w-0">
            {book.pdfUrl
              ? <PdfViewer url={book.pdfUrl} page={page} onNumPages={setNumPages} />
              : <div className="rounded-xl ring-1 ring-white/10 bg-white/[0.02] h-[60vh] flex items-center justify-center text-slate-500 text-sm">No PDF attached.</div>}

            {/* Page nav */}
            {book.pdfUrl && numPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 inline-flex items-center gap-1.5"><IconChevronLeft className="w-4 h-4" /> Prev</button>
                <span className="text-xs text-slate-400">Page {page} / {numPages}</span>
                <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="btn-primary px-4 py-2 text-sm disabled:opacity-40 inline-flex items-center gap-1.5">Next <IconChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* Media rail */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
            {book.description && <p className="text-sm text-slate-300">{book.description}</p>}

            {/* Video for this page (per-page override or full-book) */}
            {videoUrl && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">{pm?.videoUrl ? `Video · page ${page}` : 'Video'}</p>
                <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black aspect-video">
                  {/^[\w-]{11}$/.test(videoUrl)
                    ? <iframe title="video" src={`https://www.youtube.com/embed/${videoUrl}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    : <video key={videoUrl} src={videoUrl} controls className="w-full h-full" />}
                </div>
              </div>
            )}

            {/* Audio for this page */}
            {audioUrl && (
              <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] p-3">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 flex items-center gap-1.5"><IconVolume className="w-3.5 h-3.5 text-brand-300" /> {pm?.audioUrl ? `Audio · page ${page}` : 'Read-along audio'}</p>
                <audio key={audioUrl} src={audioUrl} controls className="w-full h-9" />
              </div>
            )}

            {/* Creator: attach media to THIS page */}
            {isOwner && (
              <div className="rounded-2xl border border-brand-400/25 bg-brand-500/[0.07] p-4">
                <p className="text-xs font-bold text-brand-200 flex items-center gap-1.5"><IconPlus className="w-3.5 h-3.5" /> Page {page} media</p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Attach audio/video to <b>this exact page</b>. It overrides the whole-book media here.</p>
                <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={(e) => void attach('audio', e.target.files?.[0])} />
                <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => void attach('video', e.target.files?.[0])} />
                <div className="flex gap-2">
                  <button onClick={() => audioRef.current?.click()} className={cn('flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border px-3 py-2 transition', pm?.audioUrl ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/10')}><IconVolume className="w-3.5 h-3.5" /> {pm?.audioUrl ? 'Audio ✓' : 'Audio'}</button>
                  <button onClick={() => videoRef.current?.click()} className={cn('flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border px-3 py-2 transition', pm?.videoUrl ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/10')}><IconYouTube className="w-3.5 h-3.5" /> {pm?.videoUrl ? 'Video ✓' : 'Video'}</button>
                </div>
                {pm && (pm.audioUrl || pm.videoUrl) && (
                  <button onClick={() => void clearPageMedia()} className="text-[11px] text-rose-300 hover:text-rose-200 mt-2">Remove page {page} media</button>
                )}
                {pagesWithMedia.length > 0 && (
                  <p className="text-[10px] text-slate-500 mt-3">Pages with their own media: {pagesWithMedia.join(', ')}</p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
