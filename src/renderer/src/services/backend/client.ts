/**
 * Shared, lazily-constructed Supabase client. Used by the Supabase backend,
 * the Storage upload helper (#24), and the Realtime sync layer (#26) so they
 * all share one connection (one websocket for realtime, one auth session).
 *
 * createClient() throws on an empty url, which would blank the standalone
 * browser preview (no env vars there). So we never construct it at import time —
 * only on first use, and only when both env vars are present.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the renderer was built with Supabase credentials. */
export const hasSupabaseEnv = !!url && !!key

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    if (!url || !key) {
      throw new Error('[supabase] cannot create client: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing')
    }
    _client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  }
  return _client
}
