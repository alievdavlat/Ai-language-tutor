import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { cn } from '../lib/classnames'
import { Spinner } from './ui'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Renders a single PDF page to a full-width canvas via pdf.js. Works for
 * uploaded data: URLs (offline) and CORS-enabled remote URLs. No browser
 * PDF-viewer chrome — just the page, so it fits the app design.
 */
export default function PdfViewer({ url, page, onNumPages, className }: {
  url: string
  page: number
  onNumPages?: (n: number) => void
  className?: string
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load the document when the URL changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    docRef.current = null
    const task = pdfjsLib.getDocument(url)
    task.promise
      .then((doc) => {
        if (cancelled) return
        docRef.current = doc
        onNumPages?.(doc.numPages)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setError('Could not load this PDF.'); setLoading(false) } })
    return () => { cancelled = true; try { task.destroy() } catch { /* noop */ } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  // Render the requested page (re-runs after load + on page change).
  useEffect(() => {
    let cancelled = false
    const draw = async (): Promise<void> => {
      const doc = docRef.current
      const canvas = canvasRef.current
      if (!doc || !canvas) return
      try { renderRef.current?.cancel() } catch { /* noop */ }
      const pg = await doc.getPage(Math.min(Math.max(1, page), doc.numPages))
      if (cancelled) return
      const containerW = wrapRef.current?.clientWidth ?? 800
      const base = pg.getViewport({ scale: 1 })
      const viewport = pg.getViewport({ scale: Math.max(0.2, containerW / base.width) })
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      const task = pg.render({ canvasContext: ctx, viewport })
      renderRef.current = task
      await task.promise.catch(() => { /* cancelled */ })
    }
    void draw()
    return () => { cancelled = true; try { renderRef.current?.cancel() } catch { /* noop */ } }
  }, [page, loading])

  return (
    <div ref={wrapRef} className={cn('w-full', className)}>
      {loading && <div className="h-[60vh] flex items-center justify-center"><Spinner /></div>}
      {error && <div className="h-[40vh] flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">📄 {error}</div>}
      <canvas ref={canvasRef} className={cn('w-full rounded-xl shadow-lg', (loading || error) && 'hidden')} />
    </div>
  )
}
