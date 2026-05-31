/**
 * Repeatable list of downloadable lesson materials (PDF / audio). Files upload
 * for real via the storage helper (Supabase Storage when configured, else a
 * data URL) — no dead buttons. Part of the shared authoring form kit (#A58).
 */
import { useRef, useState } from 'react'
import type { LessonMaterialRef } from '@shared/types'
import { uploadUrl } from '../../services/backend'
import { IconBook, IconVolume, IconX } from '../icons'

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface MaterialsFieldProps {
  value: LessonMaterialRef[]
  onChange: (v: LessonMaterialRef[]) => void
}

export default function MaterialsField({ value, onChange }: MaterialsFieldProps): JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPick = async (file?: File): Promise<void> => {
    setError(null)
    if (!file) return
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg)$/i.test(file.name)
    if (!isPdf && !isAudio) { setError('Add a PDF or an audio file.'); return }
    if (file.size > 4 * 1024 * 1024) { setError('File must be under 4 MB (cloud storage lifts this).'); return }
    setBusy(true)
    try {
      const url = await uploadUrl(file, 'library')
      const mat: LessonMaterialRef = { kind: isPdf ? 'pdf' : 'audio', name: file.name, url, size: prettySize(file.size) }
      onChange([...value, mat])
    } catch {
      setError('Upload failed — try again.')
    } finally {
      setBusy(false)
    }
  }

  const rename = (i: number, name: string): void => onChange(value.map((m, j) => (j === i ? { ...m, name } : m)))
  const remove = (i: number): void => onChange(value.filter((_, j) => j !== i))

  return (
    <div className="flex flex-col gap-2">
      {value.map((m, i) => (
        <div key={`${m.url}-${i}`} className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.kind === 'audio' ? 'bg-brand-500/15 text-brand-300' : 'bg-rose-500/15 text-rose-300'}`}>
            {m.kind === 'audio' ? <IconVolume className="w-4 h-4" /> : <IconBook className="w-4 h-4" />}
          </span>
          <input
            value={m.name}
            onChange={(e) => rename(i, e.target.value)}
            className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-0"
          />
          <span className="text-[11px] text-slate-500 shrink-0">{m.kind.toUpperCase()}{m.size ? ` · ${m.size}` : ''}</span>
          <button type="button" onClick={() => remove(i)} className="text-rose-400/70 hover:text-rose-300 shrink-0" title="Remove"><IconX className="w-4 h-4" /></button>
        </div>
      ))}
      <input ref={fileInput} type="file" accept=".pdf,application/pdf,audio/*" className="hidden" onChange={(e) => void onPick(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        className="self-start text-xs font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {busy ? 'Uploading…' : '+ Add PDF or audio'}
      </button>
      {error && <p className="text-[12px] text-rose-400">⚠ {error}</p>}
    </div>
  )
}
