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
import { contentKey, hashFile } from '../dedup'
import type { MediaAsset, MediaKind } from '@shared/types'

const BUCKET = 'uploads'
/** Local (data-URL) mode cap — anything bigger needs real Supabase Storage. */
const LOCAL_MAX_BYTES = 4 * 1024 * 1024 // 4 MB

export interface UploadResult {
  url: string
  path: string
  sizeBytes: number
  contentType: string
  /** SHA-256 of the file bytes — the content fingerprint. */
  hash: string
  /** True when an identical file was already stored and got reused (#A65). */
  deduped: boolean
}

// ─── content-addressed storage registry (#A65 bonus) ───────────────────────────
// Maps a file's SHA-256 → the stored object, with a ref-count. Uploading the
// same bytes twice reuses one object; deleting only purges the bytes once the
// last reference is gone. Saves storage + bandwidth (ties into #A64).
interface CasEntry {
  url: string
  path: string
  sizeBytes: number
  contentType: string
  refs: number
}
const CAS_KEY = 'speakai.cas.v1'

function casLoad(): Record<string, CasEntry> {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return JSON.parse(window.localStorage.getItem(CAS_KEY) ?? '{}') as Record<string, CasEntry>
  } catch {
    return {}
  }
}
function casSave(map: Record<string, CasEntry>): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(CAS_KEY, JSON.stringify(map))
  } catch {
    /* quota — best effort */
  }
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

  // Content-addressed dedupe: if these exact bytes were uploaded before, reuse
  // the stored object and just bump its ref-count instead of uploading again.
  const hash = await hashFile(file)
  const cas = casLoad()
  const existing = cas[hash]
  if (existing) {
    existing.refs += 1
    casSave(cas)
    return {
      url: existing.url,
      path: existing.path,
      sizeBytes: existing.sizeBytes,
      contentType: existing.contentType,
      hash,
      deduped: true
    }
  }

  const register = (url: string): UploadResult => {
    cas[hash] = { url, path, sizeBytes: file.size, contentType, refs: 1 }
    casSave(cas)
    return { url, path, sizeBytes: file.size, contentType, hash, deduped: false }
  }

  if (hasSupabaseEnv) {
    const sb = getSupabaseClient()
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType,
      cacheControl: '3600',
      upsert: false
    })
    if (error) throw error
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
    return register(data.publicUrl)
  }

  // Local fallback — inline data URL.
  if (file.size > LOCAL_MAX_BYTES) {
    throw new Error(
      `File too large for local mode (${Math.round(file.size / 1024 / 1024)} MB > 4 MB). ` +
        'Configure Supabase Storage (VITE_USE_SUPABASE=1) to upload large files.'
    )
  }
  return register(await readAsDataUrl(file))
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
    contentType: result.contentType,
    contentHash: contentKey.file(result.hash)
  })
}

/**
 * Best-effort delete of an uploaded object. Honors the content-addressed
 * ref-count: only purges the bytes once the last reference is released.
 */
export async function deleteUpload(path: string): Promise<void> {
  const cas = casLoad()
  const hash = Object.keys(cas).find((h) => cas[h].path === path)
  if (hash) {
    cas[hash].refs -= 1
    if (cas[hash].refs > 0) {
      casSave(cas)
      return // still referenced elsewhere — keep the bytes
    }
    delete cas[hash]
    casSave(cas)
  }
  if (!hasSupabaseEnv) return
  await getSupabaseClient().storage.from(BUCKET).remove([path]).then(() => undefined, () => undefined)
}
