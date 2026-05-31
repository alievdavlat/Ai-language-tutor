import { useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/classnames'
import { uploadUrl } from '../../services/backend'
import { IconCheck, IconX } from '../icons'

interface MediaPickerProps {
  value?: string
  onChange: (url: string | undefined) => void
  /** Accept attribute, e.g. "application/pdf" or "audio/*". */
  accept: string
  /** Storage folder/bucket prefix (pdfs, audio, uploads, …). */
  bucket: string
  /** Button label when empty, e.g. "PDF" or "Audio". */
  label: string
  icon?: ReactNode
  /** Max size in MB. Default 4 (local data-URL cap). */
  maxMb?: number
  className?: string
}

/**
 * Compact pill that attaches a single file (PDF / audio / …) via upload. Shows a
 * filled state with a Remove control once attached. Replaces the dead "PDF" and
 * "Audio" buttons in the lesson/course authoring forms. (#A58)
 */
export default function MediaPicker({
  value,
  onChange,
  accept,
  bucket,
  label,
  icon,
  maxMb = 4,
  className
}: MediaPickerProps): JSX.Element {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file?: File): Promise<void> => {
    setError(null)
    if (!file) return
    if (file.size > maxMb * 1024 * 1024) { setError(`Must be under ${maxMb} MB (or enable cloud storage).`); return }
    setBusy(true)
    try {
      onChange(await uploadUrl(file, bucket))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const attached = !!value

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => (attached ? onChange(undefined) : input.current?.click())}
        disabled={busy}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-3 py-1.5 transition disabled:opacity-50',
          attached
            ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/20'
            : 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/10'
        )}
        title={attached ? 'Click to remove' : `Attach ${label}`}
      >
        {attached ? <IconCheck className="w-3.5 h-3.5" /> : icon}
        {busy ? 'Uploading…' : attached ? `${label} attached` : label}
        {attached && <IconX className="w-3 h-3 ml-0.5" />}
      </button>
      {error && <span className="text-[11px] text-rose-400 mt-1">⚠ {error}</span>}
    </span>
  )
}
