import { useRef, useState } from 'react'
import { cn } from '../../lib/classnames'
import { IconDownload } from '../icons'

export interface BulkImportResult {
  created: number
  errors: string[]
}

interface BulkImportPanelProps {
  /** Heading, e.g. "Bulk import exercises". */
  title: string
  description?: string
  /** Example JSON shown in the textarea placeholder + via "Load sample". */
  sample: string
  /**
   * Parse + persist. Receives the raw text; throws (message surfaced) on a
   * parse error, otherwise returns how many entities were created + any
   * per-row warnings.
   */
  onImport: (raw: string) => BulkImportResult | Promise<BulkImportResult>
  className?: string
}

/**
 * Reusable JSON bulk-import surface — paste or upload a .json file, import, and
 * see a created-count + per-row errors. Each entity supplies its own
 * parse/persist function so the same panel powers courses, exercises, vocab,
 * stories, … (#A58)
 */
export default function BulkImportPanel({ title, description, sample, onImport, className }: BulkImportPanelProps): JSX.Element {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const run = async (): Promise<void> => {
    setError(null); setResult(null); setBusy(true)
    try {
      setResult(await onImport(raw))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import. Check the JSON shape.')
    } finally {
      setBusy(false)
    }
  }

  const loadFile = (file?: File): void => {
    if (!file) return
    const fr = new FileReader()
    fr.onload = () => setRaw(String(fr.result))
    fr.readAsText(file)
  }

  return (
    <div className={cn('rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-3', className)}>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={sample}
        rows={6}
        spellCheck={false}
        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs font-mono text-slate-200 resize-y focus:border-brand-400 focus:outline-none"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
        <button onClick={() => void run()} disabled={busy || !raw.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
          {busy ? 'Importing…' : 'Import'}
        </button>
        <button onClick={() => fileInput.current?.click()} className="btn-ghost px-3 py-2 text-sm inline-flex items-center gap-1.5">
          <IconDownload className="w-4 h-4" /> Upload .json
        </button>
        <button onClick={() => setRaw(sample)} className="text-xs font-semibold text-brand-300 hover:text-brand-200">Load sample</button>
      </div>
      {error && <p className="text-[13px] text-rose-400">⚠ {error}</p>}
      {result && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5">
          <p className="text-sm font-bold text-emerald-200">Imported {result.created} item{result.created === 1 ? '' : 's'}.</p>
          {result.errors.length > 0 && (
            <ul className="mt-1 text-[12px] text-amber-300 list-disc pl-4">
              {result.errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
              {result.errors.length > 8 && <li>…and {result.errors.length - 8} more</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
