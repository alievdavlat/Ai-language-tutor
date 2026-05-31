/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { cn } from '../../../lib/classnames'
import { IconX } from '../../../components/icons'

interface BulkImportModalProps {
  singular: string
  /** Receives the parsed array, returns how many were imported. */
  onImport: (rows: any[]) => Promise<number>
  onClose: () => void
  onDone: () => void
}

/**
 * Paste a JSON array of records → bulk upsert. Used by every content resource
 * for seeding/migrating in bulk without a row-by-row form.
 */
export default function BulkImportModal({ singular, onImport, onClose, onDone }: BulkImportModalProps): JSX.Element {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState<number | null>(null)

  const run = async (): Promise<void> => {
    setError('')
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('That isn’t valid JSON. Paste an array like [ { … }, { … } ].')
      return
    }
    if (!Array.isArray(parsed)) {
      setError('Expected a JSON array of records.')
      return
    }
    if (parsed.length === 0) {
      setError('The array is empty — nothing to import.')
      return
    }
    setBusy(true)
    try {
      const n = await onImport(parsed)
      setCount(n)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #0e1119, #0a0c12)' }}>
        <header className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Bulk import {singular}s</h2>
            <p className="text-[11px] text-slate-500">Paste a JSON array — each object becomes a {singular}. Existing ids are updated.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-4 h-4" /></button>
        </header>
        <div className="px-5 py-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setCount(null) }}
            placeholder={`[\n  { "title": "Example ${singular}", "level": "A2" }\n]`}
            rows={10}
            spellCheck={false}
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-brand-400 focus:outline-none resize-y"
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
          {count !== null && <p className="text-xs text-emerald-300">Imported {count} {singular}{count === 1 ? '' : 's'}. ✓</p>}
        </div>
        <footer className="px-5 py-4 border-t border-white/[0.07] flex justify-end gap-2 bg-black/20">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.06]">Close</button>
          <button onClick={() => void run()} disabled={busy || !text.trim()} className={cn('rounded-lg px-4 py-2 text-sm font-bold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50')}>
            {busy ? 'Importing…' : 'Import'}
          </button>
        </footer>
      </div>
    </div>
  )
}
