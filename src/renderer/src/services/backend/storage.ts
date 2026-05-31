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

/**
 * Per-kind upload ceilings (scaling — #A64). These bound storage + bandwidth
 * cost before a file ever leaves the client. Images are checked AFTER
 * compression, so the limit is the on-disk size we actually pay for.
 */
const MAX_BYTES: Record<MediaKind, number> = {
  image: 8 * 1024 * 1024, // 8 MB (post-compression — raw camera shots compress well under this)
  audio: 50 * 1024 * 1024, // 50 MB
  pdf: 50 * 1024 * 1024, // 50 MB
  video: 200 * 1024 * 1024 // 200 MB
}

/** Allowed MIME types per kind. Anything else is rejected up front. */
const ALLOWED_MIME: Record<MediaKind, RegExp> = {
  image: /^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/i,
  audio: /^audio\/(mpeg|mp3|wav|x-wav|webm|ogg|mp4|x-m4a|aac)$/i,
  pdf: /^application\/pdf$/i,
  video: /^video\/(mp4|webm|ogg|quicktime|x-matroska)$/i
}

/** Image compression target (scaling — #A64). */
const IMAGE_MAX_DIMENSION = 1600 // px — longest edge after resize
const IMAGE_QUALITY = 0.82 // JPEG/WebP quality
/** Below this, an image isn't worth re-encoding (overhead > savings). */
const IMAGE_COMPRESS_THRESHOLD = 256 * 1024 // 256 KB
/** Formats we never re-encode (would lose animation / vector fidelity). */
const NO_COMPRESS_MIME = /^image\/(gif|svg\+xml)$/i

export interface UploadResult {
  url: string
  path: string
  sizeBytes: number
  contentType: string
}

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

function humanBytes(n: number): string {
  if (n >= 1024 * 1024) return `${Math.round((n / 1024 / 1024) * 10) / 10} MB`
  return `${Math.round(n / 1024)} KB`
}

/**
 * Validate a file's type + size before upload. Throws `UploadValidationError`
 * with a user-facing message on failure. Returns the inferred MediaKind so the
 * caller doesn't have to re-infer it.
 */
export function validateUpload(file: { type?: string; name?: string; size?: number }): MediaKind {
  const kind = inferMediaKind(file)
  const type = (file.type ?? '').toLowerCase()
  // When the browser supplies a MIME type, enforce the allow-list. Some sources
  // (drag-drop, certain OSes) leave `type` empty — there we trust the extension
  // that inferMediaKind already matched and skip the MIME check.
  if (type && !ALLOWED_MIME[kind].test(type)) {
    throw new UploadValidationError(`Unsupported ${kind} type "${type}". Please use a standard ${kind} format.`)
  }
  const size = file.size ?? 0
  if (size > MAX_BYTES[kind]) {
    throw new UploadValidationError(
      `${kind[0].toUpperCase()}${kind.slice(1)} is too large (${humanBytes(size)}). Max ${humanBytes(MAX_BYTES[kind])}.`
    )
  }
  return kind
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
 * Client-side image compression (scaling — #A64). Down-scales the longest edge
 * to `IMAGE_MAX_DIMENSION` and re-encodes as WebP (falling back to JPEG) so we
 * never store/serve a 12 MP camera dump where a 1600px web image will do.
 *
 * Best-effort: returns the ORIGINAL file when compression isn't possible (no
 * canvas/DOM, unsupported format, or the result came out larger). Animated GIF
 * and SVG are passed through untouched.
 */
export async function compressImage(file: File): Promise<File> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return file
  if (NO_COMPRESS_MIME.test(file.type) || !file.type.startsWith('image/')) return file
  if (file.size < IMAGE_COMPRESS_THRESHOLD) return file

  try {
    const bitmap = await createImageBitmap(file)
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = longest > IMAGE_MAX_DIMENSION ? IMAGE_MAX_DIMENSION / longest : 1
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const toBlob = (type: string): Promise<Blob | null> =>
      new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, IMAGE_QUALITY))

    // Prefer WebP; fall back to JPEG if the browser returns null (older Safari).
    let outType = 'image/webp'
    let blob = await toBlob(outType)
    if (!blob) {
      outType = 'image/jpeg'
      blob = await toBlob(outType)
    }
    if (!blob || blob.size >= file.size) return file // no win — keep original

    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '')
    const ext = outType === 'image/webp' ? 'webp' : 'jpg'
    return new File([blob], `${baseName}.${ext}`, { type: outType, lastModified: file.lastModified })
  } catch {
    return file // never block an upload on a compression failure
  }
}

/**
 * Upload a file and get back a URL. `prefix` becomes the folder inside the
 * bucket (e.g. an ownerId or "lessons"). Falls back to a data: URL when
 * Supabase isn't configured.
 *
 * Validates type + size first (throws `UploadValidationError`) and compresses
 * images client-side before upload (scaling — #A64). Pass `compress: false` to
 * upload the original bytes untouched.
 */
export async function uploadFile(
  file: File,
  opts: { prefix?: string; compress?: boolean } = {}
): Promise<UploadResult> {
  // 1) Reject bad types / oversized files up front (cheap scaling guard).
  const kind = validateUpload(file)
  // 2) Shrink images before they hit storage (unless opted out).
  const toUpload = kind === 'image' && opts.compress !== false ? await compressImage(file) : file

  const contentType = toUpload.type || 'application/octet-stream'
  const path = `${opts.prefix ? `${slugify(opts.prefix)}/` : ''}${randomToken()}-${slugify(toUpload.name || 'file')}`

  if (hasSupabaseEnv) {
    const sb = getSupabaseClient()
    const { error } = await sb.storage.from(BUCKET).upload(path, toUpload, {
      contentType,
      cacheControl: '3600',
      upsert: false
    })
    if (error) throw error
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, path, sizeBytes: toUpload.size, contentType }
  }

  // Local fallback — inline data URL.
  if (toUpload.size > LOCAL_MAX_BYTES) {
    throw new Error(
      `File too large for local mode (${Math.round(toUpload.size / 1024 / 1024)} MB > 4 MB). ` +
        'Configure Supabase Storage (VITE_USE_SUPABASE=1) to upload large files.'
    )
  }
  const url = await readAsDataUrl(toUpload)
  return { url, path, sizeBytes: toUpload.size, contentType }
}

/**
 * Convenience: upload a file and return just its URL (Supabase Storage public
 * URL when configured, else a data: URL ≤4 MB). Drop-in replacement for the old
 * `fileToDataUrl(file)` — pass a folder prefix (covers/avatars/library/…).
 */
export async function uploadUrl(file: File, prefix?: string): Promise<string> {
  return (await uploadFile(file, { prefix })).url
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
