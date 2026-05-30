/**
 * Single entry point for all platform data. Flipped between the local mock
 * and the real Supabase backend by `VITE_USE_SUPABASE` in .env.local.
 *
 * Default: local mock (so preview works without credentials).
 * Set VITE_USE_SUPABASE=1 + VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 * in .env.local to swap to live.
 */
import { localBackend } from './local'
import { supabaseBackend } from './supabase'

const useSupabase =
  typeof import.meta !== 'undefined' &&
  (import.meta.env?.VITE_USE_SUPABASE === '1' || import.meta.env?.VITE_USE_SUPABASE === 1) &&
  !!import.meta.env?.VITE_SUPABASE_URL &&
  !!import.meta.env?.VITE_SUPABASE_ANON_KEY

export const backend = useSupabase ? supabaseBackend : localBackend
export const backendKind: 'supabase' | 'local' = useSupabase ? 'supabase' : 'local'

if (typeof window !== 'undefined') {
  // Make the choice visible in DevTools so we don't get confused.
  // eslint-disable-next-line no-console
  console.info(`[backend] using ${backendKind}`)
}

export type { Backend, CourseFilter, ID } from './types'
export { uploadFile, uploadAndRecord, deleteUpload, inferMediaKind } from './storage'
export type { UploadResult } from './storage'
export { subscribeTable, joinRoom, emitLocalChange } from './realtime'
export type { TableChange, RoomChannel, Unsubscribe } from './realtime'
export { hasSupabaseEnv } from './client'
