/**
 * File uploads (Task #24). PDF + audio (and image/video) uploads that return a
 * URL the rest of the app can store on a Post, DM, Lesson, or MediaAsset.
 *
 * - With Supabase configured → uploads to the public `uploads` storage bucket
 *   and returns the public URL.
 * - Without Supabase (local/preview) → returns a base64 `data:` URL so the file
 *   still works inline (kept in localStorage-backed records). Large files are
 *   rejected in local mode to avoid blowing the localStorage quota.
 *
 * `uploadAndRecord` additionally writes a MediaAsset row via the backend so the
 * file shows up in the owner's media library.
 */
import { getSupabaseClient, hasSupabaseEnv } from './client'
import { backend } from './index'
import type { MediaAsset, MediaKind } from '@shared/types'

const BUCKET = 'uploads'
/** Local (data-URL) mode cap — anything bigger needs real Supabase Storage. */
const LOCAL_MAX_BYTES = 4 * 1024 * 1024 // 4 MB

export interface UploadResult {
  url: string
  path: string
  sizeBytes: number
  contentType: string
}

/** Infer a coarse MediaKind from a File's MIME type / name. */
export function inferMediaKind(file: { type?: string; name?: string }): MediaKind {
  const t = (file.type ?? '').toLowerCase()
  const n = (file.name ?? '').toLowerCase()
  if (t.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|webm)$/.test(n)) return 'audio'
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  if (t.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/.test(n)) return 'video'
  return 'image'
}

function slugify(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').toLowerCase()
}

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10)
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })
}

/**
 * Upload a file and get back a URL. `prefix` becomes the folder inside the
 * bucket (e.g. an ownerId or "lessons"). Falls back to a data: URL when
 * Supabase isn't configured.
 */
export async function uploadFile(
  file: File,
  opts: { prefix?: string } = {}
): Promise<UploadResult> {
  const contentType = file.type || 'application/octet-stream'
  const path = `${opts.prefix ? `${slugify(opts.prefix)}/` : ''}${randomToken()}-${slugify(file.name || 'file')}`

  if (hasSupabaseEnv) {
    const sb = getSupabaseClient()
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType,
      cacheControl: '3600',
      upsert: false
    })
    if (error) throw error
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, path, sizeBytes: file.size, contentType }
  }

  // Local fallback — inline data URL.
  if (file.size > LOCAL_MAX_BYTES) {
    throw new Error(
      `File too large for local mode (${Math.round(file.size / 1024 / 1024)} MB > 4 MB). ` +
        'Configure Supabase Storage (VITE_USE_SUPABASE=1) to upload large files.'
    )
  }
  const url = await readAsDataUrl(file)
  return { url, path, sizeBytes: file.size, contentType }
}

/** Upload + record a MediaAsset for `ownerId`, returning the persisted row. */
export async function uploadAndRecord(file: File, ownerId: string): Promise<MediaAsset> {
  const kind = inferMediaKind(file)
  const result = await uploadFile(file, { prefix: ownerId })
  return backend.createMedia({
    ownerId,
    kind,
    url: result.url,
    name: file.name || result.path,
    sizeBytes: result.sizeBytes,
    contentType: result.contentType
  })
}

/** Best-effort delete of an uploaded object (no-op in local mode). */
export async function deleteUpload(path: string): Promise<void> {
  if (!hasSupabaseEnv) return
  await getSupabaseClient().storage.from(BUCKET).remove([path]).then(() => undefined, () => undefined)
}
