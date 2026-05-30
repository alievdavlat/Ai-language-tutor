import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Spinner } from '../../components/ui'
import { IconChevronLeft, IconDownload, IconBookmark, IconHeart, IconPlay, IconVolume } from '../../components/icons'
import { cn } from '../../lib/classnames'
import { library } from '../../services/library/store'
import { useBackendQuery } from '../../services/backend/useBackend'
import { isImageCover } from '../../lib/cover'

export default function LibraryBookPage(): JSX.Element {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { data: book, loading } = useBackendQuery(() => library.get(id), [id], null)
  const [page, setPage] = useState(1)
  const [saved, setSaved] = useState(library.isSaved(id))
  const [liked, setLiked] = useState(library.isLiked(id))

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>
  if (!book || book.kind !== 'book') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-slate-400">Book not found.</p>
        <button onClick={() => navigate('/library')} className="btn-primary px-5 py-2">Back to Library</button>
      </div>
    )
  }

  // Media shown above the PDF: a per-page override wins, else the full-book media.
  const pm = book.pageMedia?.find((p) => p.page === page)
  const videoUrl = pm?.videoUrl ?? book.fullVideoUrl
  const audioUrl = pm?.audioUrl ?? book.fullAudioUrl

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-4xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/library')} className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 shrink-0">
            <IconChevronLeft className="w-5 h-5" />
          </button>
          {isImageCover(book.thumbnailUrl) && <img src={book.thumbnailUrl} alt="" className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10" />}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{book.level ?? ''} · Book</p>
            <h1 className="text-2xl font-black tracking-tight text-white">{book.title}</h1>
            {book.author && <p className="text-sm text-slate-400">{book.author}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={async () => setLiked(await library.toggleLike(id))} className={cn('w-10 h-10 rounded-full border flex items-center justify-center transition', liked ? 'bg-rose-500/15 border-rose-400/40 text-rose-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Like"><IconHeart className="w-5 h-5" /></button>
            <button onClick={async () => setSaved(await library.toggleSave(id))} className={cn('w-10 h-10 rounded-full border flex items-center justify-center transition', saved ? 'bg-brand-500/15 border-brand-400/40 text-brand-300' : 'border-white/15 text-slate-300 hover:bg-white/5')} title="Save"><IconBookmark className="w-5 h-5" /></button>
            {book.pdfUrl && <a href={book.pdfUrl} download className="w-10 h-10 rounded-full border border-white/15 text-slate-300 hover:bg-white/5 flex items-center justify-center" title="Download"><IconDownload className="w-5 h-5" /></a>}
          </div>
        </div>

        {book.description && <p className="text-sm text-slate-300">{book.description}</p>}

        {/* Video (per-page or full-book) sits ABOVE the page preview */}
        {videoUrl && (
          <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black aspect-video">
            {/^[\w-]{11}$/.test(videoUrl)
              ? <iframe title="video" src={`https://www.youtube.com/embed/${videoUrl}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              : <video src={videoUrl} controls className="w-full h-full" />}
          </div>
        )}

        {/* PDF page preview */}
        {book.pdfUrl ? (
          <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/[0.02]">
            <iframe title="pdf" src={`${book.pdfUrl}#page=${page}`} className="w-full h-[68vh] bg-white" />
          </div>
        ) : (
          <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.02] h-[40vh] flex items-center justify-center text-slate-500 text-sm">No PDF attached.</div>
        )}

        {/* Audio (per-page or full-book read-along) */}
        {audioUrl && (
          <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconVolume className="w-5 h-5" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Read-along audio{pm?.audioUrl ? ` · page ${page}` : ''}</p>
              <audio src={audioUrl} controls className="w-full mt-1.5 h-9" />
            </div>
          </div>
        )}

        {/* Page nav */}
        {book.pdfUrl && (book.pageCount ?? 1) > 1 && (
          <div className="flex items-center justify-between">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 inline-flex items-center gap-1.5"><IconChevronLeft className="w-4 h-4" /> Prev page</button>
            <span className="text-xs text-slate-400">Page {page} of {book.pageCount}</span>
            <button onClick={() => setPage((p) => Math.min(book.pageCount ?? 1, p + 1))} disabled={page >= (book.pageCount ?? 1)} className="btn-primary px-4 py-2 text-sm disabled:opacity-40 inline-flex items-center gap-1.5">Next page <IconPlay className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  )
}
