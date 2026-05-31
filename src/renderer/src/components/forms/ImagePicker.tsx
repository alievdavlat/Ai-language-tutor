import { useRef, useState } from 'react'
import { cn } from '../../lib/classnames'
import { isImageCover } from '../../lib/cover'
import { uploadUrl } from '../../services/backend'
import { IconX } from '../icons'

interface ImagePickerProps {
  value: string
  onChange: (url: string) => void
  /** Storage folder/bucket prefix (covers, avatars, library, …). Default "covers". */
  bucket?: string
  /** Aspect ratio of the drop zone. Default "video" (16:9). */
  aspect?: 'video' | 'square' | 'wide'
  /** Big emoji shown in the empty drop zone. */
  emoji?: string
  /** Primary line in the empty drop zone. */
  prompt?: string
  /** Secondary hint line in the empty drop zone. */
  hint?: string
  className?: string
}

const ASPECT: Record<NonNullable<ImagePickerProps['aspect']>, string> = {
  video: 'aspect-video',
  square: 'aspect-square',
  wide: 'aspect-[3/1]'
}

/**
 * Image upload picker — uploads to Supabase Storage (or a ≤4 MB data: URL
 * locally) and returns the URL. Shows a live preview with replace/remove.
 * Replaces the duplicated file-input + uploadUrl boilerplate in every editor.
 * (#A58)
 */
export default function ImagePicker({
  value,
  onChange,
  bucket = 'covers',
  aspect = 'video',
  emoji = '🖼️',
  prompt = 'Upload an image',
  hint = 'JPG/PNG · under 4 MB',
  className
}: ImagePickerProps): JSX.Element {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file?: File): Promise<void> => {
    setError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > 4 * 1024 * 1024) { setError('Image must be under 4 MB.'); return }
    setBusy(true)
    try {
      onChange(await uploadUrl(file, bucket))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {isImageCover(value) ? (
        <div className={cn('relative rounded-xl overflow-hidden ring-1 ring-white/10', ASPECT[aspect])}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
          >
            <IconX className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/60 text-white rounded-full px-2.5 py-1 hover:bg-black/80"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={cn(
            'w-full rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.04] disabled:opacity-50',
            ASPECT[aspect]
          )}
        >
          <span className="text-2xl">{busy ? '⏳' : emoji}</span>
          <span className="text-xs text-slate-400">{busy ? 'Uploading…' : prompt}</span>
          <span className="text-[10px] text-slate-600">{hint}</span>
        </button>
      )}
      {error && <p className="text-[12px] text-rose-400 mt-1.5">⚠ {error}</p>}
    </div>
  )
}
